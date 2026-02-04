# community/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    """
    Extended user model.
    Karma is NOT stored here - it's calculated dynamically from Like records.
    """
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Post(models.Model):
    """
    A post in the community feed.
    Like count is derived from Like model, not stored redundantly.
    """
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Post by {self.author.username}: {self.content[:50]}"

    @property
    def like_count(self):
        """Dynamically calculate like count"""
        return self.post_likes.count()


class Comment(models.Model):
    """
    Threaded comments with unlimited nesting depth.
    Self-referencing FK for parent-child relationship.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='replies'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'parent']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.id}"

    @property
    def like_count(self):
        """Dynamically calculate like count"""
        return self.comment_likes.count()


class Like(models.Model):
    """
    Generic Like model for both Posts and Comments.
    Uses DB-level unique constraint to prevent duplicate likes.
    Timestamps enable time-based karma calculation.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    
    # Generic relation: either post OR comment (but not both)
    post = models.ForeignKey(
        Post, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='post_likes'
    )
    comment = models.ForeignKey(
        Comment, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='comment_likes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent duplicate likes at database level
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'post'],
                name='unique_user_post_like',
                condition=models.Q(post__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['user', 'comment'],
                name='unique_user_comment_like',
                condition=models.Q(comment__isnull=False)
            ),
            # Ensure exactly one target (post XOR comment)
            models.CheckConstraint(
                check=(
                    models.Q(post__isnull=False, comment__isnull=True) |
                    models.Q(post__isnull=True, comment__isnull=False)
                ),
                name='like_has_single_target'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'post']),
            models.Index(fields=['user', 'comment']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        target = f"Post {self.post.id}" if self.post else f"Comment {self.comment.id}"
        return f"{self.user.username} likes {target}"

    def clean(self):
        from django.core.exceptions import ValidationError
        # Ensure exactly one target is set
        if (self.post is None) == (self.comment is None):
            raise ValidationError("Like must target exactly one: post or comment")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
