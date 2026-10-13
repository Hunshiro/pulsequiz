import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormatGuideModal: React.FC<FormatGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exampleText = `1. What is the powerhouse of the human cell?
A) Nucleus
B) Mitochondria ✅
C) Ribosome
D) Endoplasmic Reticulum

2. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury ✅
D) Mars

3. In web development, which language runs directly in the browser?
A) Python
B) JavaScript ✅
C) C++
D) Ruby`;

  const copyExample = () => {
    navigator.clipboard.writeText(exampleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How to format your .txt quiz file</h2>
              <p className="text-xs text-slate-400">Mark the correct answer using a right tick emoji</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-2">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-indigo-400">Rules</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
              <li>Each question can start with a number like <code className="text-indigo-300 font-mono">1.</code>, <code className="text-indigo-300 font-mono">Q1:</code>, or plain text.</li>
              <li>Options can be on separate lines with prefixes like <code className="text-indigo-300 font-mono">A)</code>, <code className="text-indigo-300 font-mono">B)</code>, or dashes <code className="text-indigo-300 font-mono">-</code>.</li>
              <li>Place a right tick emoji (<code className="text-emerald-400 font-mono">✅</code> or <code className="text-emerald-400 font-mono">✔️</code>) at the end of the correct option.</li>
              <li>Separate questions with a blank line for best readability.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400">Copyable Example</span>
              <button
                onClick={copyExample}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto select-all">
              {exampleText}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Got it, Let's Quiz
          </button>
        </div>
      </div>
    </div>
  );
};
