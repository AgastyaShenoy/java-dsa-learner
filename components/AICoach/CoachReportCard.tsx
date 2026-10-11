'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Coffee, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Calendar,
  Layers
} from 'lucide-react';
import { CoachReport } from '@/types';

interface CoachReportCardProps {
  report: CoachReport;
  isDemo?: boolean;
}

export const CoachReportCard: React.FC<CoachReportCardProps> = ({ report, isDemo = false }) => {
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetIdx(idx);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
  };

  const getPacingBadge = (action: string) => {
    switch (action) {
      case 'INCREASE':
        return {
          bg: 'text-[#34d399] bg-[#064e3b]/25 border-[#059669]/40',
          label: 'Accelerate Pace (+)',
          icon: TrendingUp
        };
      case 'SLOW_DOWN':
        return {
          bg: 'text-[#f87171] bg-[#7f1d1d]/25 border-[#dc2626]/40',
          label: 'Consolidate Fundamentals (-)',
          icon: AlertCircle
        };
      case 'MAINTAIN':
      default:
        return {
          bg: 'text-[#38bdf8] bg-[#0c4a6e]/25 border-[#0284c7]/40',
          label: 'Maintain Cadence (=)',
          icon: CheckCircle
        };
    }
  };

  const pacing = getPacingBadge(report.pacingRecommendation?.action || 'MAINTAIN');
  const PacingIcon = pacing.icon;

  const dateFormatted = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-4">
      
      {/* Report Header */}
      <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#22252e] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-[#181a22] border border-[#282b36] text-[#c084fc]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-[#f4f4f6]">Gemini 2.5 Flash Coach Audit</h3>
                {isDemo && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#78350f]/30 text-[#fbbf24] border border-[#d97706]/40">
                    Heuristic Preview
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8b929f] font-mono flex items-center space-x-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-[#555b67]" />
                <span>Generated {dateFormatted} &bull; {report.problemsAnalyzedCount} logs evaluated</span>
              </p>
            </div>
          </div>

          <div className={`self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1 rounded-md border text-xs font-mono font-medium ${pacing.bg}`}>
            <PacingIcon className="w-3.5 h-3.5" />
            <span>{pacing.label}</span>
          </div>
        </div>

        {/* Section 1: Executive Diagnosis */}
        <div className="p-3.5 rounded-lg bg-[#08090c] border border-[#1f2228]">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#c084fc] mb-1.5 flex items-center space-x-1.5">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>1. Executive Diagnosis: Mastery vs Friction</span>
          </div>
          <p className="text-xs text-[#c2c7d0] leading-relaxed">
            {report.executiveDiagnosis}
          </p>
        </div>
      </div>

      {/* Grid: Java Blindspots + Pacing Recalibration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Section 2: Java Syntax & Idiomatic Blindspots */}
        <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#22252e] space-y-3">
          <div className="flex items-center space-x-1.5 text-[#f59e0b]">
            <Coffee className="w-3.5 h-3.5" />
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider">
              2. Java Syntax &amp; Idiomatic Blindspots
            </h4>
          </div>

          <div className="space-y-2">
            {(report.javaBlindspots || []).map((spot, idx) => (
              <div 
                key={`spot-${idx}`}
                className="p-3 rounded-lg bg-[#08090c] border border-[#1f2228] text-xs text-[#c2c7d0] leading-relaxed flex items-start space-x-2.5"
              >
                <span className="w-4 h-4 rounded bg-[#181a22] text-[#f59e0b] border border-[#262a34] flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                  {idx + 1}
                </span>
                <p className="flex-1">{spot}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Pacing Recalibration */}
        <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#22252e] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-[#38bdf8] mb-2.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider">
                3. Pacing Recalibration
              </h4>
            </div>

            <div className="p-3.5 rounded-lg bg-[#08090c] border border-[#1f2228] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#8b929f]">Suggested Quota:</span>
                <span className="text-sm font-mono font-bold text-[#38bdf8] px-2 py-0.5 rounded bg-[#0c4a6e]/20 border border-[#0284c7]/30">
                  {report.pacingRecommendation?.suggestedDailyTarget || 4} prob/day
                </span>
              </div>
              <p className="text-xs text-[#c2c7d0] leading-relaxed">
                {report.pacingRecommendation?.rationale}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-[#08090c] border border-[#1f2228] text-[11px] font-mono text-[#8b929f]">
            <span className="font-semibold text-[#f4f4f6]">Principle:</span> High volume without retention creates interview anxiety. 3 clean solves beats 7 hint-assisted rushes.
          </div>
        </div>

      </div>

      {/* Section 4: Targeted Mini-Drills */}
      <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#22252e] space-y-3">
        <div className="flex items-center space-x-1.5 text-[#34d399]">
          <Layers className="w-3.5 h-3.5" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider">
            4. Targeted Java Concept Mini-Drills
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(report.miniDrills || []).map((drill, idx) => (
            <div 
              key={`drill-${idx}`}
              className="rounded-lg bg-[#08090c] border border-[#1f2228] p-3.5 flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#064e3b]/25 text-[#34d399] border border-[#059669]/30">
                    Drill #{idx + 1}
                  </span>
                  <span className="text-[11px] text-[#8b929f] font-mono">{drill.concept}</span>
                </div>

                <h5 className="text-xs font-semibold text-[#f4f4f6] mt-1">
                  {drill.title}
                </h5>

                <p className="text-xs text-[#c2c7d0] mt-1 leading-relaxed">
                  {drill.challenge}
                </p>
              </div>

              {drill.javaCodeSnippet && (
                <div className="relative rounded-md bg-[#000000] border border-[#1f2228] p-2.5 overflow-x-auto">
                  <div className="flex items-center justify-between text-[10px] text-[#555b67] font-mono mb-1 pb-1 border-b border-[#1f2228]">
                    <span>Java Reference</span>
                    <button
                      onClick={() => copyCode(drill.javaCodeSnippet!, idx)}
                      className="text-[#8b929f] hover:text-[#f4f4f6] flex items-center space-x-1 font-mono transition"
                    >
                      {copiedSnippetIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[#34d399]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-[#38bdf8] leading-tight">
                    {drill.javaCodeSnippet}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
