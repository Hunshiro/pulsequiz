import React, { useState } from 'react';
import { ArrowRight, User, Hash, Sparkles } from 'lucide-react';

interface JoinRoomViewProps {
  onJoin: (roomCode: string, name: string, avatar: string) => void;
  defaultRoomCode?: string;
  error?: string | null;
  onClearError?: () => void;
}

const AVATARS = ['⚡', '🚀', '🦊', '🦁', '🦉', '🎯', '💡', '💎', '🐉', '🐼', '🌟', '🔥'];

export const JoinRoomView: React.FC<JoinRoomViewProps> = ({
  onJoin,
  defaultRoomCode = '',
  error,
  onClearError
}) => {
  const [code, setCode] = useState(defaultRoomCode);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚡');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Please enter a room code.');
      return;
    }
    if (!name.trim()) {
      alert('Please enter your participant name.');
      return;
    }
    onJoin(code.trim().toUpperCase(), name.trim(), selectedAvatar);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-2xl border border-indigo-500/30">
          🎮
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Join Live Quiz
        </h1>
        <p className="text-xs text-slate-400">
          Enter the room code provided by your quiz host to play in real time.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-400 hover:text-white font-bold ml-2"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Room Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              Room Code
            </label>
            <input
              type="text"
              maxLength={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (onClearError) onClearError();
              }}
              placeholder="e.g. QUIZ88"
              className="w-full text-center font-mono text-xl sm:text-2xl font-bold tracking-widest text-white rounded-xl border border-slate-700 bg-slate-950 py-3 uppercase placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Your Name / Nickname
            </label>
            <input
              type="text"
              maxLength={25}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex M."
              className="w-full text-sm font-semibold text-white rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Choose Your Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`flex h-11 items-center justify-center rounded-xl text-xl transition-all ${
                    selectedAvatar === emoji
                      ? 'bg-indigo-600 border-2 border-white scale-110 shadow-md shadow-indigo-600/40'
                      : 'bg-slate-950 border border-slate-800 hover:border-slate-700 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Join CTA */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30"
          >
            <span>Enter Quiz Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
