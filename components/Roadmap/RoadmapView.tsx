'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Circle, 
  ChevronRight, 
  FolderOpen,
  Code2
} from 'lucide-react';
import { Problem, ProblemLog } from '@/types';

interface RoadmapViewProps {
  problems: Problem[];
  logs: ProblemLog[];
  onOpenStudyDeck: (problem: Problem) => void;
  onOpenSolveLogger: (problem: Problem) => void;
  onOpenEmbeddedSolver: (problem: Problem) => void;
}

type FilterOption = 'ALL' | 'UNSOLVED' | 'DUE_REVIEW' | 'BLOCKERS' | 'CLEAN';

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  problems,
  logs,
  onOpenStudyDeck,
  onOpenSolveLogger,
  onOpenEmbeddedSolver
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

  const logMap = useMemo(() => {
    const map = new Map<string, ProblemLog>();
    logs.forEach(l => map.set(l.problemId, l));
    return map;
  }, [logs]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const log = logMap.get(p.id);

      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.difficulty.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'UNSOLVED':
          return !log;
        case 'CLEAN':
          return log?.status === 'CLEAN';
        case 'BLOCKERS':
          return log?.status === 'BLOCKER';
        case 'DUE_REVIEW':
          return !!(log?.nextReviewDate && log.nextReviewDate.split('T')[0] <= todayStr);
        case 'ALL':
        default:
          return true;
      }
    });
  }, [problems, logMap, searchQuery, activeFilter, todayStr]);

  const groupedSections = useMemo(() => {
    const allTopics = new Map<string, { total: number; solved: number; subtopics: Map<string, Problem[]> }>();

    problems.forEach(p => {
      if (!allTopics.has(p.topic)) {
        allTopics.set(p.topic, { total: 0, solved: 0, subtopics: new Map() });
      }
      const t = allTopics.get(p.topic)!;
      t.total++;
      if (logMap.has(p.id)) t.solved++;

      if (!t.subtopics.has(p.subTopic)) {
        t.subtopics.set(p.subTopic, []);
      }
    });

    const result: Array<{
      topic: string;
      totalInTopic: number;
      solvedInTopic: number;
      subtopics: Array<{ subTopic: string; problems: Problem[] }>;
    }> = [];

    const subtopicBuckets = new Map<string, Problem[]>();
    filteredProblems.forEach(p => {
      const key = `${p.topic}:::${p.subTopic}`;
      if (!subtopicBuckets.has(key)) subtopicBuckets.set(key, []);
      subtopicBuckets.get(key)!.push(p);
    });

    allTopics.forEach((topicData, topicName) => {
      const subtopicList: Array<{ subTopic: string; problems: Problem[] }> = [];

      topicData.subtopics.forEach((_, subTopicName) => {
        const key = `${topicName}:::${subTopicName}`;
        const probs = subtopicBuckets.get(key) || [];
        if (probs.length > 0) {
          subtopicList.push({ subTopic: subTopicName, problems: probs });
        }
      });

      if (subtopicList.length > 0) {
        result.push({
          topic: topicName,
          totalInTopic: topicData.total,
          solvedInTopic: topicData.solved,
          subtopics: subtopicList
        });
      }
    });

    return result;
  }, [problems, filteredProblems, logMap]);

  return (
    <div className="space-y-5">
      
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl bg-[#0d0e12] border border-[#22252e]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-[#181a22] border border-[#262a34] text-[#38bdf8]">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#f4f4f6] tracking-tight">
              Striver SDE Sheet Master Roadmap
            </h2>
            <p className="text-[11px] font-mono text-[#8b929f]">
              Topic trees, completion metrics, and review cadence
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#12141a] p-1 rounded-lg border border-[#22252e]">
          {(['ALL', 'UNSOLVED', 'DUE_REVIEW', 'BLOCKERS', 'CLEAN'] as FilterOption[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition ${
                activeFilter === f
                  ? 'bg-[#181a22] text-[#f4f4f6] border border-[#2c303c] shadow-sm'
                  : 'text-[#8b929f] hover:text-[#f4f4f6] hover:bg-[#15171f]'
              }`}
            >
              {f === 'ALL' ? 'All' :
               f === 'UNSOLVED' ? 'Unsolved' :
               f === 'DUE_REVIEW' ? 'Due Review' :
               f === 'BLOCKERS' ? 'Blockers' : 'Clean'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Open / Find Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#555b67] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter problems by title, topic, or difficulty (e.g. Arrays, Pow, Kadane)..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0d0e12] border border-[#22252e] text-xs text-[#f4f4f6] placeholder-[#555b67] font-mono focus:outline-none focus:border-[#38bdf8]"
        />
      </div>

      {/* Topics & Subtopics Outline */}
      <div className="space-y-4">
        {groupedSections.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#0d0e12] border border-[#22252e] text-[#8b929f] text-xs font-mono">
            No problems match the current filter.
          </div>
        ) : (
          groupedSections.map(section => {
            const topicPercentage = Math.round((section.solvedInTopic / section.totalInTopic) * 100) || 0;

            return (
              <div key={section.topic} className="rounded-xl bg-[#0d0e12] border border-[#22252e] overflow-hidden">
                {/* Topic Header Bar */}
                <div className="px-4 py-3 bg-[#08090c] border-b border-[#1f2228] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-[#f4f4f6]">
                      {section.topic}
                    </h3>
                    <span className="text-[11px] font-mono text-[#8b929f] px-2 py-0.5 rounded bg-[#13151b] border border-[#22252e]">
                      {section.solvedInTopic} / {section.totalInTopic} ({topicPercentage}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full sm:w-40">
                    <div className="h-1.5 w-full bg-[#181a22] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#38bdf8]"
                        style={{ width: `${topicPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subtopic Sections */}
                <div className="p-4 space-y-4">
                  {section.subtopics.map(sub => (
                    <div key={sub.subTopic} className="space-y-1.5">
                      <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8b929f] flex items-center space-x-1 font-semibold">
                        <ChevronRight className="w-3 h-3 text-[#38bdf8]" />
                        <span>{sub.subTopic}</span>
                      </h4>

                      {/* Problem rows */}
                      <div className="grid grid-cols-1 divide-y divide-[#1f2228] rounded-lg border border-[#1f2228] bg-[#090a0d] overflow-hidden">
                        {sub.problems.map(prob => {
                          const log = logMap.get(prob.id);
                          const isReviewDue = !!(log?.nextReviewDate && log.nextReviewDate.split('T')[0] <= todayStr);

                          return (
                            <div 
                              key={prob.id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#12141a] transition"
                            >
                              <div className="flex items-center space-x-3">
                                {/* SVG Status Icon */}
                                <div className="shrink-0">
                                  {!log ? (
                                    <Circle className="w-3.5 h-3.5 text-[#555b67]" />
                                  ) : log.status === 'CLEAN' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                                  ) : log.status === 'HESITANT' ? (
                                    <AlertCircle className="w-3.5 h-3.5 text-[#fbbf24]" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-[#f87171]" />
                                  )}
                                </div>

                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs text-[#555b67] font-semibold tabular-nums">
                                      #{prob.sheetIndex.toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-xs font-medium text-[#f4f4f6]">
                                      {prob.title}
                                    </span>
                                    {isReviewDue && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#78350f]/30 text-[#fbbf24] border border-[#d97706]/40 font-mono">
                                        Due
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-2 text-[11px] font-mono text-[#8b929f]">
                                    <span className={`text-[10px] font-semibold ${
                                      prob.difficulty === 'Easy' ? 'text-[#34d399]' :
                                      prob.difficulty === 'Medium' ? 'text-[#fbbf24]' : 'text-[#f87171]'
                                    }`}>
                                      {prob.difficulty}
                                    </span>
                                    {log && (
                                      <>
                                        <span>&bull;</span>
                                        <span className="tabular-nums">{log.timeSpentMinutes}m</span>
                                        {log.notes && (
                                          <>
                                            <span>&bull;</span>
                                            <span className="text-[#f59e0b] truncate max-w-xs">
                                              {log.notes}
                                            </span>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center space-x-1.5 self-end sm:self-center">
                                <button
                                  onClick={() => onOpenEmbeddedSolver(prob)}
                                  className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-white text-black hover:bg-zinc-200 flex items-center space-x-1 transition shadow-sm"
                                >
                                  <Code2 className="w-3 h-3" />
                                  <span>Solve (In-App)</span>
                                </button>

                                <button
                                  onClick={() => onOpenStudyDeck(prob)}
                                  className="px-2 py-1 rounded-md text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                                >
                                  Study
                                </button>

                                <a
                                  href={prob.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                                  title="Open in new browser tab"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                <button
                                  onClick={() => onOpenSolveLogger(prob)}
                                  className="px-2 py-1 rounded-md text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
                                >
                                  {log ? 'Edit' : 'Log'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
