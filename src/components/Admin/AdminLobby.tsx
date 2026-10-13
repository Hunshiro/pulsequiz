import React, { useState } from 'react';
import { Copy, Check, Users, Play, Clock, Award, Shield, ArrowRight } from 'lucide-react';
import { QuizRoomState, Participant } from '../../types/quiz';

interface AdminLobbyProps {
  roomState: QuizRoomState;
  participants: Participant[];
  currentParticipant?: Participant | null;
  onStartQuiz: () => void;
  onJoinAsPlayer?: (name: string, avatar: string) => void;
}

export const AdminLobby: React.FC<AdminLobbyProps> = ({
  roomState,
  participants,
  currentParticipant,
  onStartQuiz,
  onJoinAsPlayer
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [adminName, setAdminName] = useState('Admin (Host)');
  const [adminAvatar, setAdminAvatar] = useState('👑');

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/?room=${roomState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeParticipants = participants.filter(p => p.connected);
  const isJoinedAsPlayer = Boolean(currentParticipant);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Room Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Host Control Center · Lobby Active</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {roomState.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Share this room code with participants so they can join on their screens.
          </p>
        </div>

        {/* Big Room Code Display */}
        <div className="inline-block p-6 sm:p-8 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 shadow-inner">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
            Room Code
          </div>
          <div className="font-mono text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-violet-400 tracking-wider">
            {roomState.roomCode}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>

        {/* Config Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-left">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Questions</span>
            <span className="text-base font-bold text-white font-mono">{roomState.totalQuestions} Questions</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Timer / Q</span>
            <span className="text-base font-bold text-amber-400 font-mono">{roomState.settings.timePerQuestion}s</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Scoring</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              +{roomState.settings.correctMarks} / -{roomState.settings.negativeMarks}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Leaderboard</span>
            <span className="text-base font-bold text-indigo-400 font-mono">
              After Every 10 Qs
            </span>
          </div>
        </div>

        {/* Admin Player Participation Status */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-xl border border-indigo-500/40">
              {currentParticipant ? currentParticipant.avatar : '👑'}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Admin Player Participation</span>
                {isJoinedAsPlayer ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                    Host Only
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {isJoinedAsPlayer
                  ? `You are joined as "${currentParticipant?.name}". You can answer questions directly and appear on the leaderboard!`
                  : 'Join as a player to answer questions and compete on the leaderboard too.'}
              </p>
            </div>
          </div>

          {!isJoinedAsPlayer && onJoinAsPlayer && (
            <button
              onClick={() => onJoinAsPlayer('Admin (Host)', '👑')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/30"
            >
              + Join as Player Too
            </button>
          )}
        </div>
      </div>

      {/* Participants Roster */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              Joined Participants ({activeParticipants.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {activeParticipants.length === 0 ? 'Waiting for players...' : 'Ready to start'}
          </span>
        </div>

        {activeParticipants.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
            <div className="text-3xl mb-2 animate-bounce">👥</div>
            <p className="text-sm font-semibold text-slate-300">No participants yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Open a new browser tab or switch to the Player Window tab above to join using code <strong className="text-indigo-400 font-mono">{roomState.roomCode}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-left animate-in zoom-in-95 duration-150"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-xl border border-indigo-500/20 shrink-0">
                  {p.avatar}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Connected</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Start Quiz Action */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            {activeParticipants.length === 0
              ? 'You can start now with 0 players for testing, or wait for players to join.'
              : 'All participants will begin Question 1 simultaneously.'}
          </p>

          <button
            onClick={onStartQuiz}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Quiz for Everyone</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
