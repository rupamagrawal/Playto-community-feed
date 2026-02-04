import React, { useState } from 'react';
import axios from 'axios';
import CommentThread from './CommentThread';
import CreateComment from './CreateComment';
import { useKarma } from '../context/KarmaContext';
import { useLogin } from '../context/LoginContext';

function Post({ post, onUpdate }) {
  const [liked, setLiked] = useState(post.user_has_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Use local state for comment count to update it instantly without parent reload
  const [commentCount, setCommentCount] = useState(post.comment_count);

  const { triggerKarmaUpdate } = useKarma();
  const { openLogin } = useLogin();

  const toggleLike = async () => {
    try {
      await axios.post('/api/likes/toggle/', {
        post_id: post.id
      });
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      triggerKarmaUpdate(); // Update leaderboard
      // onUpdate(); // Removed to prevent full feed reload
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        openLogin(); // Trigger login modal
      } else {
        console.error('Error toggling like:', error);
      }
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await axios.get(`/api/posts/${post.id}/`);
      // The detail view returns the post with a nested comment tree
      if (response.data.comments) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      setShowComments(true);
      if (comments.length === 0) {
        await fetchComments();
      }
    } else {
      setShowComments(false);
    }
  };

  const handleCommentAdded = async () => {
    // Refresh comments for this post only
    await fetchComments();
    setCommentCount(prev => prev + 1);

    // Ensure comments are visible
    if (!showComments) {
      setShowComments(true);
    }

    triggerKarmaUpdate();
    // onUpdate(); // Removed to prevent full feed reload
  };

  return (
    <article className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-accent/40 hover:-translate-y-1 group relative overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-accent/20">
            {post.author.username[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200 text-[15px] group-hover:text-accent transition-colors duration-300">
              {post.author.username}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-5">
        <p className="text-slate-200 leading-relaxed text-[15px]">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-white/5">
        <button
          onClick={toggleLike}
          className={`glass-button flex items-center gap-2 text-sm ${liked
            ? 'bg-accent/20 border-accent/50 text-accent'
            : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-transparent'
            }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ${liked ? 'scale-110' : 'group-hover:scale-110'}`}>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>{likeCount}</span>
        </button>

        <button
          onClick={toggleComments}
          className="glass-button flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-transparent text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <CreateComment postId={post.id} onCommentAdded={handleCommentAdded} />

          {loadingComments ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-700 border-t-accent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map(comment => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onUpdate={handleCommentAdded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default Post;
