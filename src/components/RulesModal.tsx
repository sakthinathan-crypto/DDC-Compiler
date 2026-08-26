import React from 'react';
import { Contest } from '../types';
import { X, BookOpen, Clock, Award, ShieldCheck, Terminal, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  contest?: Contest | null;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, contest, onClose }) => {
  if (!isOpen) return null;

  const duration = contest ? contest.durationMinutes : 30;
  const totalQuestions = contest?.totalQuestions || contest?.questionIds.length || 5;
  const totalMarks = contest?.totalMarks || 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e111a] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-left max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Club Logo */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-black/60 p-1 border border-amber-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src="/brand/club-logo.png"
              alt="Designers Domain Club"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-mono">
              Competition Rules & Guidelines
            </h2>
            <p className="text-xs font-mono text-amber-400">
              Designers Domain Club &bull; {contest ? contest.title : 'Official Platform Competition'}
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-5 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          {/* Section 1: Objective */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <Terminal className="w-4 h-4" />
              <span>1. Competition Objective</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm">
              Each problem is loaded with a pre-written starter code that contains an intentional logical bug. Your mission is to <strong>identify the bug</strong>, <strong>fix the code</strong>, verify against the sample test cases using "Run Code", and submit your solution to be evaluated against hidden test cases.
            </p>
          </div>

          {/* Section 2: Structure & Scoring */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
              <Award className="w-4 h-4" />
              <span>2. Structure & Marks Distribution</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li><strong>Total Questions:</strong> {totalQuestions} Debugging Challenges</li>
              <li><strong>Total Marks:</strong> {totalMarks} Marks</li>
              <li><strong>Supported Languages:</strong> <strong>Python 3</strong> and <strong>C (GCC)</strong>.</li>
              <li><strong>Evaluation:</strong> Submissions are scored against server-side hidden test cases. Partial test passes award proportionate marks.</li>
            </ul>
          </div>

          {/* Section 3: Time & Tie-Breaking */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold font-mono">
              <Clock className="w-4 h-4" />
              <span>3. Time Limit & Tie-Breaking</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li><strong>Duration:</strong> {duration} Minutes countdown. The timer is server-authoritative and starts upon registration.</li>
              <li><strong>Tie-Breaking Rule 1:</strong> Higher Total Score ranks higher.</li>
              <li><strong>Tie-Breaking Rule 2:</strong> In case of equal score, shorter completion time ranks higher.</li>
            </ul>
          </div>

          {/* Section 4: Security & Plagiarism */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>4. Execution & Fair Play</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              All code is executed inside secure, isolated sandboxes with strict CPU and memory limits. Do not attempt infinite loops, external network calls, or malicious shell exploits. Hidden test cases will never be exposed.
            </p>
          </div>
        </div>

        {/* Footer Credit & Close */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            Designed by Aegis for Designers Domain Club
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
