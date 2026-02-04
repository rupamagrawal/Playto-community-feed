import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useKarma } from '../context/KarmaContext';

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useKarma();

  useEffect(() => {
    fetchLeaderboard();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/leaderboard/top/');
      setLeaders(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (position) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${position + 1}`;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-accent to-pink-500 opacity-80 animate-gradient-xy"></div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl animate-float">🏆</span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Top Contributors
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest pl-12">
          Last 24 Hours
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-accent rounded-full animate-spin"></div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="py-12 text-center glass-panel bg-white/5 rounded-xl border-dashed border-white/10">
          <p className="text-slate-400 text-sm">No activity yet. Be the first!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {leaders.map((user, index) => (
            <div
              key={user.id}
              className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:translate-x-1 group overflow-hidden ${index === 0
                  ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30'
                  : index === 1
                    ? 'bg-gradient-to-r from-slate-300/10 to-transparent border-slate-300/30'
                    : index === 2
                      ? 'bg-gradient-to-r from-orange-600/10 to-transparent border-orange-600/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-opacity ${index === 0 ? 'bg-yellow-500 opacity-100' :
                  index === 1 ? 'bg-slate-300 opacity-100' :
                    index === 2 ? 'bg-orange-500 opacity-100' :
                      'bg-accent opacity-0 group-hover:opacity-100'
                }`}></div>

              {/* Rank */}
              <div className={`text-2xl font-bold min-w-[36px] text-center ${index < 3 ? 'animate-pulse-slow' : 'text-slate-500'
                }`}>
                {getMedalEmoji(index)}
              </div>

              {/* User Info */}
              <div className="flex-1 flex flex-col gap-0.5">
                <span className={`font-semibold text-[15px] ${index === 0 ? 'text-yellow-400' : 'text-slate-200'
                  }`}>
                  {user.username}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {user.karma_24h} karma
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Karma Legend */}
      <div className="pt-6 border-t border-white/5">
        <h3 className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest pl-1">
          Karma Rules
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-lg">❤️</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-300">+5</span>
              <span className="text-[10px] text-slate-500">Post</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-lg">💬</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-300">+1</span>
              <span className="text-[10px] text-slate-500">Comment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
