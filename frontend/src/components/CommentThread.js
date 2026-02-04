import React, { useState } from 'react';
import axios from 'axios';
import CreateComment from './CreateComment';
import { useKarma } from '../context/KarmaContext';
import { useLogin } from '../context/LoginContext';

const depthColors = [
  'from-blue-500 to-purple-600',
  'from-purple-500 to-pink-600',
  'from-green-500 to-blue-600',
  'from-orange-500 to-red-600',
  'from-cyan-500 to-purple-600',
];

function CommentThread({ comment, postId, depth = 0, onUpdate }) {
  const [showReplyForm, setShowReplyForm] = useState(false); // Keep original name
  const [liked, setLiked] = useState(comment.user_has_liked);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const { triggerKarmaUpdate } = useKarma();
  const { openLogin } = useLogin(); // Add useLogin hook

  const toggleLike = async () => {
    try {
      await axios.post('/api/likes/toggle/', {
        comment_id: comment.id
      });
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      triggerKarmaUpdate();
      // onUpdate(); // Removed to prevent reload
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        openLogin(); // Trigger login modal instead of alert
      } else {
        console.error('Error toggling like:', error);
      }
    }
  };

  const handleReplyAdded = () => {
    setShowReplyForm(false);
    onUpdate();
  };

  const avatarGradient = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 min-w-[36px] rounded-lg bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold text-sm`}>
          {comment.author.username[0].toUpperCase()}
        </div>

        {/* Comment Body */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-zinc-200 text-sm">
              {comment.author.username}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-zinc-200 text-sm leading-relaxed break-words">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-xs font-medium ${liked
                ? 'text-accent hover:bg-accent/10'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-hover'
                }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition-transform hover:scale-110">
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
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="px-2 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-surface-hover rounded-md transition-all"
            >
              Reply
            </button>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <CreateComment
                postId={postId}
                parentId={comment.id}
                onCommentAdded={handleReplyAdded}
                placeholder="Write a reply..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 sm:ml-12 pl-4 border-l-2 border-zinc-800 flex flex-col gap-4">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentThread;
