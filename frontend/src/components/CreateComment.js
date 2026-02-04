import React, { useState } from 'react';
import axios from 'axios';
import { useLogin } from '../context/LoginContext';

function CreateComment({ postId, parentId = null, onCommentAdded, placeholder = "Write a comment..." }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { openLogin } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await axios.post('/api/comments/', {
        post: postId,
        parent: parentId,
        content: content.trim()
      });

      setContent('');
      onCommentAdded();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        openLogin();
      } else {
        console.error('Error creating comment:', error);
        alert('Failed to post comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows="2"
        disabled={submitting}
        className="w-full px-3.5 py-2.5 bg-primary-light border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-500 text-sm resize-vertical min-h-[60px] transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="self-end px-6 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {submitting ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

export default CreateComment;
