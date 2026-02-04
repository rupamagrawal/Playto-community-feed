import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import CreatePost from './components/CreatePost';
import Login from './components/Login';
import { KarmaProvider } from './context/KarmaContext';
import { LoginProvider, useLogin } from './context/LoginContext';

// Configure axios defaults
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshFeed, setRefreshFeed] = useState(0);

  const { showLoginModal, openLogin, closeLogin } = useLogin();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me/');
      setIsAuthenticated(true);
      setCurrentUser(response.data);
    } catch (error) {
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    closeLogin();
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const handlePostCreated = () => {
    setRefreshFeed(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-dark">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user wants to login, show the login screen
  if (showLoginModal && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-dark p-4 relative">
        <button
          onClick={closeLogin}
          className="absolute top-8 right-8 text-slate-400 hover:text-white glass-button"
        >
          Close X
        </button>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200">
      <KarmaProvider>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
          <div className="max-w-6xl mx-auto glass-panel rounded-2xl px-6 py-4 flex justify-between items-center transition-all duration-300 hover:border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-pink-500 flex items-center justify-center shadow-lg shadow-accent/20 animate-pulse-slow">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-white">Playto</span>
                <span className="text-accent">.</span>
              </h1>
            </div>

            <div className="flex items-center gap-6">
              {currentUser ? (
                <>
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {currentUser.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="glass-button text-sm bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={openLogin}
                  className="glass-button bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20"
                >
                  Log In / Sign Up
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 pt-32 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Feed Section */}
            <div className="lg:col-span-3 space-y-8">
              {isAuthenticated ? (
                <CreatePost onPostCreated={handlePostCreated} />
              ) : (
                <div className="glass-panel p-6 rounded-2xl text-center mb-8 bg-gradient-to-r from-accent/10 to-pink-500/10 border-accent/20">
                  <p className="text-slate-300 mb-4">Join the conversation to post and like!</p>
                  <button
                    onClick={openLogin}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-semibold transition-colors"
                  >
                    Login to Contribute
                  </button>
                </div>
              )}

              <Feed key={refreshFeed} />
            </div>

            {/* Sidebar Section */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <Leaderboard />

                {/* Mini Footer */}
                <div className="glass-panel p-6 rounded-2xl text-center">
                  <p className="text-xs text-slate-500 font-mono tracking-widest opacity-60">
                    PLAYTO COMMUNITY © 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </KarmaProvider>
    </div>
  );
}

function App() {
  return (
    <LoginProvider>
      <AppContent />
    </LoginProvider>
  );
}

export default App;
