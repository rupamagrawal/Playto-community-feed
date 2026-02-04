# community/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.db.models import Prefetch, Count, Q, Case, When, IntegerField, Sum, OuterRef, Subquery, Value, F
from django.db.models.functions import Coalesce
from django.db import transaction, IntegrityError
from django.utils import timezone
from datetime import timedelta

from .models import User, Post, Comment, Like
from .serializers import (
    PostSerializer, PostDetailSerializer, CreatePostSerializer,
    CommentSerializer, CreateCommentSerializer, LikeSerializer,
    UserLeaderboardSerializer,
    UserRegistrationSerializer, LoginSerializer, UserBasicSerializer
)
from django.contrib.auth import authenticate, login, logout


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Posts with optimized queries to prevent N+1.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePostSerializer
        elif self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer
    
    def get_queryset(self):
        """
        Optimize queryset based on action.
        - List: prefetch likes, count comments
        - Detail: prefetch full comment tree
        """
        user = self.request.user
        
        # Base queryset with author
        queryset = Post.objects.select_related('author')
        
        if self.action == 'list':
            # For list view: annotate counts, prefetch user's likes
            queryset = queryset.annotate(
                annotated_like_count=Count('post_likes', distinct=True),
                comment_count=Count('comments', distinct=True)
            )
            
            # Prefetch user's likes for "user_has_liked" check
            if user.is_authenticated:
                user_likes_prefetch = Prefetch(
                    'post_likes',
                    queryset=Like.objects.filter(user=user),
                    to_attr='_user_likes'
                )
                queryset = queryset.prefetch_related(user_likes_prefetch)
        
        elif self.action == 'retrieve':
            # For detail view: prefetch complete comment tree efficiently
            queryset = self._prefetch_comment_tree(queryset, user)
        
        return queryset
    
    def _prefetch_comment_tree(self, queryset, user):
        """
        Prefetch entire comment tree in minimal queries.
        
        Strategy:
        1. Fetch all comments for the post in one query
        2. Fetch all comment likes for the post's comments
        3. Build tree in Python (no recursive DB calls)
        """
        # Prefetch all comments with their authors
        comments_prefetch = Prefetch(
            'comments',
            queryset=Comment.objects.select_related('author').annotate(
                annotated_like_count=Count('comment_likes', distinct=True)
            ).order_by('created_at'),
            to_attr='_prefetched_comments'
        )
        
        queryset = queryset.prefetch_related(comments_prefetch)
        
        # Annotate like count for posts
        queryset = queryset.annotate(
            annotated_like_count=Count('post_likes', distinct=True),
            comment_count=Count('comments', distinct=True)
        )
        
        # Prefetch user's likes
        if user.is_authenticated:
            user_post_likes = Prefetch(
                'post_likes',
                queryset=Like.objects.filter(user=user),
                to_attr='_user_likes'
            )
            queryset = queryset.prefetch_related(user_post_likes)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to build comment tree in Python.
        """
        instance = self.get_object()
        
        # Build comment tree structure
        self._build_comment_tree(instance)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def _build_comment_tree(self, post):
        """
        Build nested comment structure from flat list.
        Attaches replies to parent comments using Python dict lookup.
        
        This prevents N+1 queries by organizing prefetched data.
        """
        if not hasattr(post, '_prefetched_comments'):
            return
        
        comments = post._prefetched_comments
        
        # Create lookup dict for O(1) access
        comment_dict = {comment.id: comment for comment in comments}
        
        # Attach replies to their parents
        for comment in comments:
            comment._prefetched_replies = []
            
            if comment.parent_id:
                parent = comment_dict.get(comment.parent_id)
                if parent:
                    if not hasattr(parent, '_prefetched_replies'):
                        parent._prefetched_replies = []
                    parent._prefetched_replies.append(comment)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comments.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Comment.objects.select_related('author', 'post')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateCommentSerializer
        return CommentSerializer


class LikeViewSet(viewsets.ViewSet):
    """
    ViewSet for Like/Unlike actions.
    Handles race conditions with atomic transactions and DB constraints.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        Toggle like on a post or comment.
        Uses atomic transaction to prevent race conditions.
        DB unique constraints prevent duplicate likes.
        """
        serializer = LikeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        post_id = serializer.validated_data.get('post_id')
        comment_id = serializer.validated_data.get('comment_id')
        user = request.user
        
        try:
            with transaction.atomic():
                # Build filter for this like
                filter_kwargs = {'user': user}
                create_kwargs = {'user': user}
                
                if post_id:
                    filter_kwargs['post_id'] = post_id
                    create_kwargs['post_id'] = post_id
                else:
                    filter_kwargs['comment_id'] = comment_id
                    create_kwargs['comment_id'] = comment_id
                
                # Try to delete existing like
                deleted, _ = Like.objects.filter(**filter_kwargs).delete()
                
                if deleted:
                    # Like was removed
                    return Response({
                        'status': 'unliked',
                        'message': 'Like removed successfully'
                    }, status=status.HTTP_200_OK)
                else:
                    # Create new like
                    Like.objects.create(**create_kwargs)
                    return Response({
                        'status': 'liked',
                        'message': 'Like added successfully'
                    }, status=status.HTTP_201_CREATED)
        
        except IntegrityError as e:
            # Race condition: like was created between check and create
            # This is caught by unique constraint
            return Response({
                'error': 'Concurrent modification detected. Please try again.'
            }, status=status.HTTP_409_CONFLICT)


class LeaderboardViewSet(viewsets.ViewSet):
    """
    ViewSet for leaderboard showing top users by 24-hour karma.
    Karma is calculated dynamically from Like records.
    """
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def top(self, request):
        """
        Get top 5 users by karma earned in last 24 hours.
        
        Karma Rules:
        - Post Like → +5 Karma
        - Comment Like → +1 Karma
        
        Only likes created in the last 24 hours count.
        """
        # Calculate 24 hours ago
        time_threshold = timezone.now() - timedelta(hours=24)
        
        # Subquery for Post Karma (Likes on user's posts)
        post_karma_sq = Subquery(
            Like.objects.filter(
                post__author=OuterRef('pk'),
                created_at__gte=time_threshold
            ).values('post__author').annotate(
                total=Count('id') * 5
            ).values('total')[:1],
            output_field=IntegerField()
        )

        # Subquery for Comment Karma (Likes on user's comments)
        comment_karma_sq = Subquery(
            Like.objects.filter(
                comment__author=OuterRef('pk'),
                created_at__gte=time_threshold
            ).values('comment__author').annotate(
                total=Count('id') * 1
            ).values('total')[:1],
            output_field=IntegerField()
        )

        # Aggregate karma using subqueries
        leaderboard = User.objects.annotate(
            pk_karma=Coalesce(post_karma_sq, Value(0)),
            ck_karma=Coalesce(comment_karma_sq, Value(0))
        ).annotate(
            karma_24h=F('pk_karma') + F('ck_karma')
        ).filter(
            karma_24h__gt=0  # Only users with karma > 0
        ).order_by('-karma_24h')[:5]  # Top 5
        
        serializer = UserLeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)


class AuthViewSet(viewsets.ViewSet):
    """
    ViewSet for handling Authentication.
    Uses Django's session-based authentication.
    """
    permission_classes = [AllowAny]
    # Standard authentication for 'me' and 'logout'


    @action(detail=False, methods=['post'])
    @method_decorator(csrf_exempt)
    def login(self, request):
        """
        Login endpoint. 
        CSRF exempt because initial login has no cookie.
        Auth classes disabled to prevent CSRF enforcement by SessionAuth.
        """
        self.authentication_classes = [] 

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        login(request, user)
        
        return Response({
            'user': UserBasicSerializer(user).data,
            'message': 'Logged in successfully'
        })

    @action(detail=False, methods=['post'])
    @method_decorator(csrf_exempt)
    def register(self, request):
        """
        Register endpoint.
        CSRF exempt + Auth disabled for initial creation.
        """
        self.authentication_classes = []
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Explicitly set backend for login() to work with a newly created user
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        
        login(request, user)  # Auto-login after registration
        
        return Response({
            'user': UserBasicSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return current user details"""
        serializer = UserBasicSerializer(request.user)
        return Response(serializer.data)
