# community/serializers.py
from rest_framework import serializers
from django.db.models import Prefetch, Count, Q
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User, Post, Comment, Like


class UserBasicSerializer(serializers.ModelSerializer):
    """Lightweight user serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username']


class UserLeaderboardSerializer(serializers.ModelSerializer):
    """User serializer with karma for leaderboard"""
    karma_24h = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'karma_24h']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with password validation"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password_confirm', 'bio']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            bio=validated_data.get('bio', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login credentials"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"detail": "User does not exist. Please sign up first."})

        user = authenticate(username=username, password=password)
        
        if user and user.is_active:
            attrs['user'] = user
            return attrs
            
        raise serializers.ValidationError({"detail": "Wrong username or password."})


class CommentSerializer(serializers.ModelSerializer):
    """
    Recursive serializer for threaded comments.
    Prevents N+1 by using prefetched data.
    """
    author = UserBasicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'parent', 'content', 
            'created_at', 'like_count', 'user_has_liked', 'replies'
        ]
        read_only_fields = ['created_at', 'like_count']

    def get_like_count(self, obj):
        """Use annotated value if available, else property"""
        return getattr(obj, 'annotated_like_count', obj.like_count)

    def get_replies(self, obj):
        """
        Recursively serialize replies using prefetched data.
        NO additional queries - relies on prefetch_related in view.
        """
        # Access prefetched replies without hitting DB
        if hasattr(obj, '_prefetched_replies'):
            replies = obj._prefetched_replies
        else:
            replies = obj.replies.all()
        
        return CommentSerializer(replies, many=True, context=self.context).data

    def get_user_has_liked(self, obj):
        """Check if current user has liked this comment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Use prefetched data if available
        if hasattr(obj, '_user_likes'):
            return any(like.comment_id == obj.id for like in obj._user_likes)
        
        return obj.comment_likes.filter(user=request.user).exists()


class PostSerializer(serializers.ModelSerializer):
    """
    Post serializer with efficient comment tree loading.
    """
    author = UserBasicSerializer(read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'created_at', 
            'like_count', 'comment_count', 'user_has_liked'
        ]
        read_only_fields = ['created_at', 'like_count', 'comment_count']

    def get_like_count(self, obj):
        """Use annotated value if available, else property"""
        return getattr(obj, 'annotated_like_count', obj.like_count)

    def get_user_has_liked(self, obj):
        """Check if current user has liked this post"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Use prefetched data if available
        if hasattr(obj, '_user_likes'):
            return any(like.post_id == obj.id for like in obj._user_likes)
        
        return obj.post_likes.filter(user=request.user).exists()


class PostDetailSerializer(PostSerializer):
    """
    Post detail with full comment tree.
    Comments are prefetched in the view to avoid N+1.
    """
    comments = serializers.SerializerMethodField()
    
    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']

    def get_comments(self, obj):
        """
        Return only top-level comments.
        Nested replies are handled recursively in CommentSerializer.
        """
        # Filter for top-level comments (parent=None)
        top_level_comments = [c for c in obj._prefetched_comments if c.parent_id is None]
        return CommentSerializer(top_level_comments, many=True, context=self.context).data


class CreatePostSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    class Meta:
        model = Post
        fields = ['content']

    def create(self, validated_data):
        request = self.context['request']
        validated_data['author'] = request.user
        return super().create(validated_data)


class CreateCommentSerializer(serializers.ModelSerializer):
    """Serializer for creating comments"""
    class Meta:
        model = Comment
        fields = ['post', 'parent', 'content']

    def validate(self, data):
        """Ensure parent comment belongs to the same post"""
        if data.get('parent') and data['parent'].post != data['post']:
            raise serializers.ValidationError(
                "Parent comment must belong to the same post"
            )
        return data

    def create(self, validated_data):
        request = self.context['request']
        validated_data['author'] = request.user
        return super().create(validated_data)


class LikeSerializer(serializers.Serializer):
    """Serializer for like/unlike actions"""
    post_id = serializers.IntegerField(required=False, allow_null=True)
    comment_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        """Ensure exactly one target (post XOR comment)"""
        post_id = data.get('post_id')
        comment_id = data.get('comment_id')
        
        if (post_id is None) == (comment_id is None):
            raise serializers.ValidationError(
                "Must specify exactly one: post_id or comment_id"
            )
        
        # Verify target exists
        if post_id:
            if not Post.objects.filter(id=post_id).exists():
                raise serializers.ValidationError("Post does not exist")
        if comment_id:
            if not Comment.objects.filter(id=comment_id).exists():
                raise serializers.ValidationError("Comment does not exist")
        
        return data
