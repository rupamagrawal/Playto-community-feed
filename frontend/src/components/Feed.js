import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Post from './Post';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/posts/');
      setPosts(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = () => {
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
        <p className="text-accent mb-4">{error}</p>
        <button 
          onClick={fetchPosts}
          className="px-6 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.length === 0 ? (
        <div className="bg-surface border border-zinc-800 rounded-2xl p-16 text-center">
          <p className="text-zinc-500 text-lg">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map(post => (
          <Post key={post.id} post={post} onUpdate={handlePostUpdate} />
        ))
      )}
    </div>
  );
}

export default Feed;
