import React, { useState } from 'react';
import axios from 'axios';

function CreatePost() {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await axios.post('/api/posts/', {
        content: content.trim()
      });
      
      setContent('');
      window.location.reload();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative bg-surface border border-zinc-800 rounded-2xl p-6 overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-purple-600 to-blue-600 opacity-80"></div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with the community..."
          rows="4"
          disabled={submitting}
          className="w-full px-4 py-3 bg-primary-light border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-500 text-[15px] leading-relaxed resize-vertical min-h-[100px] transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 focus:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-zinc-500 font-mono">
            {content.length} characters
          </span>
          <button 
            type="submit" 
            disabled={!content.trim() || submitting}
            className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-bold text-[15px] tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Posting...
              </>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
