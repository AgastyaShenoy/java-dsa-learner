'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Key, 
  BrainCircuit, 
  History, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck
} from 'lucide-react';
import { CoachReport } from '@/types';
import { CoachReportCard } from './CoachReportCard';
import { getCoachReports } from '@/lib/db';
import { requestCoachAudit, gatherPast7DaysStats, PerformanceStats } from '@/lib/gemini';

export const AICoachView: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [reports, setReports] = useState<CoachReport[]>([]);
  const [currentReport, setCurrentReport] = useState<CoachReport | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statsPreview, setStatsPreview] = useState<PerformanceStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistoricalReports = useCallback(async () => {
    try {
      const pastReports = await getCoachReports();
      setReports(pastReports);
      if (pastReports.length > 0) {
        setCurrentReport(prev => prev || pastReports[0]);
      }
    } catch (e) {
      console.error('Failed to load past coach reports:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('sde_gemini_api_key') || '';
      setApiKey(storedKey);
    }
    loadHistoricalReports();
    gatherPast7DaysStats().then(setStatsPreview).catch(console.error);
  }, [loadHistoricalReports]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sde_gemini_api_key', key.trim());
    }
    setShowKeyInput(false);
  };

  const handleRunAudit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await requestCoachAudit(apiKey.trim() || undefined);
      setCurrentReport(result.report);
      setIsDemoMode(result.isDemo);
      await loadHistoricalReports();
      const updatedStats = await gatherPast7DaysStats();
      setStatsPreview(updatedStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze progress';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Dossier Overview & Key Setup */}
      <div className="rounded-xl bg-[#0d0e12] border border-[#22252e] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#c084fc] font-semibold">
              <BrainCircuit className="w-4 h-4" />
              <span>Diagnostic AI Performance Engine</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-[#f4f4f6] tracking-tight">
              Gemini 2.5 Flash Coach Audit
            </h2>

            <p className="text-xs sm:text-sm text-[#8b929f] max-w-xl leading-relaxed">
              Analyzes your 7-day solve velocity, clean-to-blocker ratios, hint dependency frequency, and Java takeaways to detect pattern blindspots.
            </p>
          </div>

          {/* Audit CTA Button & API Key Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-3 py-2 rounded-lg text-xs font-mono bg-[#13151b] hover:bg-[#181a22] text-[#c2c7d0] hover:text-white border border-[#22252e] flex items-center justify-center space-x-2 transition"
            >
              <Key className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>{apiKey ? 'Key Configured' : 'Configure Key'}</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating 7-Day Dossier...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze My Progress</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* API Key Modal/Input Accordion */}
        {showKeyInput && (
          <div className="mt-4 p-3.5 rounded-lg bg-[#08090c] border border-[#22252e] animate-in fade-in duration-150 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#f4f4f6]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Google Gemini API Key (Stored locally in localStorage)</span>
              </div>
              <span className="text-[10px] text-[#555b67] font-mono">Zero external relay</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 rounded-md bg-[#12141a] border border-[#22252e] text-xs text-[#f4f4f6] font-mono focus:outline-none focus:border-[#38bdf8]"
              />
              <button
                onClick={() => handleSaveApiKey(apiKey)}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white transition"
              >
                Save Key
              </button>
            </div>

            <p className="text-[11px] text-[#8b929f]">
              No key yet? The built-in heuristic evaluator can run an immediate progress diagnostic for your session.
            </p>
          </div>
        )}
      </div>

      {/* 7-Day Dossier Stats Snapshot */}
      {statsPreview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#22252e]">
            <span className="text-[11px] font-mono text-[#8b929f]">7-DAY SOLVES</span>
            <div className="text-lg font-bold font-mono text-[#f4f4f6] tabular-nums mt-0.5">
              {statsPreview.totalSolvedCount} <span className="text-[11px] text-[#555b67] font-normal">problems</span>
            </div>
            <div className="text-[10px] text-[#8b929f] font-mono mt-0.5">
              Avg {statsPreview.avgTimeSpentMinutes}m / solve
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#22252e]">
            <span className="text-[11px] font-mono text-[#8b929f]">QUALITY RATIO</span>
            <div className="text-lg font-bold font-mono text-[#34d399] tabular-nums mt-0.5">
              {statsPreview.cleanCount} <span className="text-[11px] text-[#555b67] font-normal">clean / </span>
              <span className="text-[#f87171]">{statsPreview.blockerCount} blocked</span>
            </div>
            <div className="text-[10px] text-[#fbbf24] font-mono mt-0.5">
              {statsPreview.hesitantCount} hesitant solves
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#22252e]">
            <span className="text-[11px] font-mono text-[#8b929f]">HINT DEPENDENCY</span>
            <div className="text-lg font-bold font-mono text-[#f4f4f6] tabular-nums mt-0.5">
              {Object.values(statsPreview.topicBreakdown).reduce((acc, curr) => acc + curr.totalHintsViewed, 0)}
              <span className="text-[11px] text-[#555b67] font-normal"> hints</span>
            </div>
            <div className="text-[10px] text-[#8b929f] font-mono mt-0.5">
              {Object.keys(statsPreview.topicBreakdown).length} active topics
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#22252e]">
            <span className="text-[11px] font-mono text-[#8b929f]">JAVA NOTES</span>
            <div className="text-lg font-bold font-mono text-[#f59e0b] tabular-nums mt-0.5">
              {statsPreview.javaNotes.length} <span className="text-[11px] text-[#555b67] font-normal">takeaways</span>
            </div>
            <div className="text-[10px] text-[#8b929f] font-mono mt-0.5">
              Audited for anti-patterns
            </div>
          </div>
        </div>
      )}

      {/* Error display if any */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-[#7f1d1d]/20 border border-[#dc2626]/40 text-[#fca5a5] text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#f87171]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Audit Display */}
      {currentReport ? (
        <div className="space-y-5">
          <CoachReportCard report={currentReport} isDemo={isDemoMode} />
        </div>
      ) : (
        <div className="rounded-xl border border-[#22252e] bg-[#0d0e12] p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#181a22] border border-[#282b36] text-[#c084fc] mx-auto flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#f4f4f6]">No Diagnostic Run Yet</h3>
          <p className="text-xs text-[#8b929f] max-w-sm mx-auto leading-relaxed">
            Click &quot;Analyze My Progress&quot; to evaluate your 7-day trajectory. Gemini 2.5 Flash will generate a custom breakdown of pattern mastery, Java syntax blindspots, and pacing advice.
          </p>
          <button
            onClick={handleRunAudit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white transition"
          >
            Run Initial Audit
          </button>
        </div>
      )}

      {/* Historical Report Archive */}
      {reports.length > 1 && (
        <div className="space-y-2.5 pt-5 border-t border-[#22252e]">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8b929f] flex items-center space-x-1.5">
            <History className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Audit History Archive ({reports.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {reports.map((r, i) => (
              <button
                key={r.id || `report-${i}`}
                onClick={() => {
                  setCurrentReport(r);
                  setIsDemoMode(false);
                }}
                className={`p-3 rounded-lg border text-left transition ${
                  currentReport?.id === r.id
                    ? 'bg-[#181a22] border-[#c084fc]/50'
                    : 'bg-[#0d0e12] border-[#22252e] hover:bg-[#13151b]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#8b929f] font-mono mb-1">
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#181a22] text-[#f4f4f6]">
                    {r.problemsAnalyzedCount} logs
                  </span>
                </div>
                <div className="text-xs font-medium text-[#f4f4f6] line-clamp-1">
                  {r.pacingRecommendation?.action === 'INCREASE' ? 'Accelerate' :
                   r.pacingRecommendation?.action === 'SLOW_DOWN' ? 'Consolidate' : 'Maintain'} &bull; {r.pacingRecommendation?.suggestedDailyTarget} prob/day
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
