import React, { useState } from 'react';
import { GitCompare, Plus, Minus, Check, Copy, Columns, FileText } from 'lucide-react';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  expected_line_num: number | null;
  submitted_line_num: number | null;
  content: string;
}

export interface DiffData {
  has_changes: boolean;
  additions_count: number;
  deletions_count: number;
  lines: DiffLine[];
  unified_diff: string;
}

interface InteractiveDiffViewerProps {
  expected: string;
  submitted: string;
  diffData?: DiffData | null;
  isLoading?: boolean;
  onClose?: () => void;
}

export const InteractiveDiffViewer: React.FC<InteractiveDiffViewerProps> = ({
  expected,
  submitted,
  diffData,
  isLoading = false,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);

  // Client-side fallback diff generator if server diffData not available yet
  const computeClientDiff = (): DiffData => {
    const expLines = expected ? expected.split('\n') : [];
    const subLines = submitted ? submitted.split('\n') : [];
    const max = Math.max(expLines.length, subLines.length);

    const lines: DiffLine[] = [];
    let additions = 0;
    let deletions = 0;

    for (let i = 0; i < max; i++) {
      const exp = expLines[i];
      const sub = subLines[i];

      if (exp === sub) {
        lines.push({
          type: 'unchanged',
          expected_line_num: i + 1,
          submitted_line_num: i + 1,
          content: exp ?? '',
        });
      } else {
        if (exp !== undefined) {
          lines.push({
            type: 'removed',
            expected_line_num: i + 1,
            submitted_line_num: null,
            content: exp,
          });
          deletions++;
        }
        if (sub !== undefined) {
          lines.push({
            type: 'added',
            expected_line_num: null,
            submitted_line_num: i + 1,
            content: sub,
          });
          additions++;
        }
      }
    }

    return {
      has_changes: additions > 0 || deletions > 0,
      additions_count: additions,
      deletions_count: deletions,
      lines,
      unified_diff: lines.map((l) => (l.type === 'added' ? `+${l.content}` : l.type === 'removed' ? `-${l.content}` : ` ${l.content}`)).join('\n'),
    };
  };

  const activeDiff = diffData || computeClientDiff();

  const handleCopyUnified = async () => {
    if (activeDiff.unified_diff) {
      await navigator.clipboard.writeText(activeDiff.unified_diff);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 gap-3">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Computing interactive diff...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
              Exercise Solution Diff Viewer
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                <Plus className="w-3 h-3" />+{activeDiff.additions_count} additions
              </span>
              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                <Minus className="w-3 h-3" />-{activeDiff.deletions_count} deletions
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'unified'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Unified
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyUnified}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Diff'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Diff Content Container */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs">
        {viewMode === 'split' ? (
          /* Side-by-Side View */
          <div className="grid grid-cols-2 divide-x divide-slate-800 min-w-[700px]">
            {/* Left: Expected Solution */}
            <div>
              <div className="px-4 py-2 bg-slate-900/60 text-slate-400 border-b border-slate-800 font-sans font-semibold text-xs tracking-wider uppercase">
                Expected Solution
              </div>
              <div className="divide-y divide-slate-900/40">
                {activeDiff.lines
                  .filter((l) => l.type !== 'added')
                  .map((line, idx) => (
                    <div
                      key={`left-${idx}`}
                      className={`flex items-start ${
                        line.type === 'removed'
                          ? 'bg-rose-950/40 text-rose-300'
                          : 'text-slate-300 hover:bg-slate-900/50'
                      }`}
                    >
                      <span className="w-12 py-1 px-2 text-right select-none text-slate-600 border-r border-slate-800/60 bg-slate-950/50 shrink-0">
                        {line.expected_line_num || ''}
                      </span>
                      <span className="w-6 py-1 text-center select-none shrink-0 font-bold">
                        {line.type === 'removed' ? '-' : ' '}
                      </span>
                      <pre className="py-1 px-2 whitespace-pre-wrap break-all flex-1 font-mono">
                        {line.content}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Submitted Solution */}
            <div>
              <div className="px-4 py-2 bg-slate-900/60 text-slate-400 border-b border-slate-800 font-sans font-semibold text-xs tracking-wider uppercase">
                Your Submission
              </div>
              <div className="divide-y divide-slate-900/40">
                {activeDiff.lines
                  .filter((l) => l.type !== 'removed')
                  .map((line, idx) => (
                    <div
                      key={`right-${idx}`}
                      className={`flex items-start ${
                        line.type === 'added'
                          ? 'bg-emerald-950/40 text-emerald-300'
                          : 'text-slate-300 hover:bg-slate-900/50'
                      }`}
                    >
                      <span className="w-12 py-1 px-2 text-right select-none text-slate-600 border-r border-slate-800/60 bg-slate-950/50 shrink-0">
                        {line.submitted_line_num || ''}
                      </span>
                      <span className="w-6 py-1 text-center select-none shrink-0 font-bold">
                        {line.type === 'added' ? '+' : ' '}
                      </span>
                      <pre className="py-1 px-2 whitespace-pre-wrap break-all flex-1 font-mono">
                        {line.content}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Unified Stream View */
          <div className="divide-y divide-slate-900/40">
            <div className="px-4 py-2 bg-slate-900/60 text-slate-400 border-b border-slate-800 font-sans font-semibold text-xs tracking-wider uppercase">
              Unified Stream
            </div>
            {activeDiff.lines.map((line, idx) => (
              <div
                key={`unified-${idx}`}
                className={`flex items-start ${
                  line.type === 'added'
                    ? 'bg-emerald-950/40 text-emerald-300'
                    : line.type === 'removed'
                    ? 'bg-rose-950/40 text-rose-300'
                    : 'text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <span className="w-12 py-1 px-2 text-right select-none text-slate-600 border-r border-slate-800/60 bg-slate-950/50 shrink-0">
                  {line.expected_line_num || ''}
                </span>
                <span className="w-12 py-1 px-2 text-right select-none text-slate-600 border-r border-slate-800/60 bg-slate-950/50 shrink-0">
                  {line.submitted_line_num || ''}
                </span>
                <span className="w-6 py-1 text-center select-none shrink-0 font-bold">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>
                <pre className="py-1 px-2 whitespace-pre-wrap break-all flex-1 font-mono">
                  {line.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
