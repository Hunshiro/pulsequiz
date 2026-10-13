import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Columns, Sparkles, User, Shield } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface HeaderProps {
  currentTab: 'host' | 'player' | 'split';
  onTabChange: (tab: 'host' | 'player' | 'split') => void;
  onOpenFormatGuide: () => void;
  roomCode?: string;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenFormatGuide,
  roomCode,
  isConnected
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(!sounds.enabled);

  const toggleMute = () => {
    sounds.enabled = !sounds.enabled;
    setIsMuted(!sounds.enabled);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 font-extrabold text-white shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              PulseQuiz
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
              Live Arena
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Segmented View Mode */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => onTabChange('host')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'host'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Host / Admin
          </button>
          <button
            onClick={() => onTabChange('player')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'player'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Player Window
          </button>
          <button
            onClick={() => onTabChange('split')}
            title="Open host and player side-by-side for instant testing"
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Split Test
          </button>
        </nav>

        {/* Zone 3: Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {roomCode && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-500 font-medium">Room:</span>
              <span className="font-mono font-bold text-indigo-400 tracking-wider">{roomCode}</span>
            </div>
          )}

          <button
            onClick={onOpenFormatGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-slate-800/80 transition-colors whitespace-nowrap"
            title="How to format .txt quiz files"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">.txt Format</span>
          </button>

          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-slate-800/80 transition-colors"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            aria-label="Toggle sound effects"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          <div 
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-400"
            title={isConnected ? 'Server Connected' : 'Connecting to Server...'}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="hidden xl:inline">{isConnected ? 'Live' : 'Connecting'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
