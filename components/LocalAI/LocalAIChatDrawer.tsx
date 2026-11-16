'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, RotateCcw, Send, Square, Trash2, Unlock } from 'lucide-react';
import type { FocusSession, Problem } from '@/types';
import type { TutorContext } from '@/lib/lmstudio';
import { elapsedMs } from '@/lib/session';
import { Dialog } from '../ui/Dialog';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Msg { id: number; role: 'user' | 'assistant'; content: string }

// Conversations survive closing/reopening the drawer (per problem) for this page load.
const conversations = new Map<string, Msg[]>();
let nextId = 1;

interface Props {
  onClose: () => void;
  baseUrl: string;
  problem: Problem | null;
  /** Present when an attempt on this problem is running: the tutor stays in hint-only mode. */
  session?: FocusSession;
  hasHistory: boolean;
}

export function LocalAIChatDrawer({ onClose, baseUrl, problem, session, hasHistory }: Props) {
  const key = problem?.id ?? '__general__';
  const [messages, setMessages] = useState<Msg[]>(() => conversations.get(key) ?? []);
  const [input, setInput] = useState('');
  const [streamText, setStreamText] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>(() => { try { return localStorage.getItem('sde_lm_model') ?? ''; } catch { return ''; } });
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [checkNonce, setCheckNonce] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { conversations.set(key, messages); }, [key, messages]);

  // Stop generation if the drawer closes or the component unmounts.
  useEffect(() => () => { abortRef.current?.abort(); if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setStatus('checking');
    fetch(`/api/local-ai/models?baseUrl=${encodeURIComponent(baseUrl)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((d: { connected: boolean; models: string[]; error?: string }) => {
        setStatus(d.connected ? 'online' : 'offline');
        setModels(d.models ?? []);
        if (!d.connected) setError(d.error ?? 'LM Studio is offline.');
        else setError(null);
      })
      .catch(err => { if (err.name !== 'AbortError') setStatus('offline'); });
    return () => ctrl.abort();
  }, [baseUrl, checkNonce]);

  const activeModel = models.includes(model) ? model : models[0] ?? '';

  const context: TutorContext | undefined = useMemo(() => {
    if (!problem) return undefined;
    return {
      n: problem.n,
      title: problem.title,
      module: problem.module,
      pattern: problem.pattern,
      difficulty: problem.difficulty,
      kind: session?.kind,
      elapsedMinutes: session ? Math.round(elapsedMs(session) / 60_000) : undefined,
      revealedHints: session ? problem.hints.slice(0, session.hintsRevealed) : [],
      triedNotes: session?.triedNotes ?? [],
      solutionUnlocked: session?.solutionRevealed ?? false,
      reviewMode: !session && hasHistory,
    };
  }, [problem, session, hasHistory]);

  const locked = !!problem && !context?.solutionUnlocked && !context?.reviewMode;

  // Scroll to bottom on new content (instant, not smooth, so it never queues up animations).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamText]);

  const flush = () => {
    rafRef.current = null;
    setStreamText(bufferRef.current);
  };

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || abortRef.current) return;
    const userMsg: Msg = { id: nextId++, role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setError(null);
    setStreamText('');
    setThinking(false);
    bufferRef.current = '';

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/local-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(m => ({ role: m.role, content: m.content })), model: activeModel, baseUrl, context }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.error) throw new Error(typeof evt.error === 'string' ? evt.error : evt.error.message ?? 'LM Studio error');
            const delta = evt.choices?.[0]?.delta ?? {};
            if (delta.reasoning_content || delta.reasoning) setThinking(true);
            if (delta.content) {
              setThinking(false);
              bufferRef.current += delta.content;
              if (rafRef.current === null) rafRef.current = requestAnimationFrame(flush);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // partial line
            throw e;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError((err as Error).message);
    } finally {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      const reply = bufferRef.current.trim();
      if (reply) setMessages(prev => [...prev, { id: nextId++, role: 'assistant', content: reply }]);
      bufferRef.current = '';
      setStreamText(null);
      setThinking(false);
      abortRef.current = null;
    }
  }, [messages, activeModel, baseUrl, context]);

  const stop = () => abortRef.current?.abort();
  const streaming = streamText !== null;

  const quick = locked
    ? [
        { label: 'Review my approach', fill: 'Here is my approach so far:\n\n' },
        { label: 'Edge cases to test?', send: 'Which edge cases should I test my solution against? Just list inputs, no fixes.' },
        { label: 'Why might it TLE?', send: 'My solution times out. Ask me questions that help me find why, without giving the fix.' },
        { label: 'Java API question', fill: 'Java question (not about the algorithm): ' },
      ]
    : problem
      ? [
          { label: 'Explain the approach', send: `Walk me through the optimal approach for ${problem.title}, with the key invariant and complexity.` },
          { label: 'Review my code', fill: 'Review this Java code for bugs and style:\n\n' },
          { label: 'Similar problems?', send: 'Which problems use the same pattern, and what changes between them?' },
        ]
      : [];

  return (
    <Dialog
      open
      variant="right"
      width="30rem"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          Local AI
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-ink-green' : status === 'checking' ? 'bg-ink-2 animate-pulse' : 'bg-ink-orange'}`} aria-label={status} />
          <span className="text-[11px] font-display font-normal text-ink-2">{status}</span>
        </span>
      }
      headerExtra={
        <button className="btn-icon" onClick={() => setMessages([])} aria-label="Clear conversation" title="Clear conversation" disabled={streaming}>
          <Trash2 className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex flex-col h-full">
        <div className="px-5 py-3 border-b-[1.5px] border-dashed border-line text-xs space-y-2 shrink-0">
          {problem ? (
            <p className="flex items-center gap-1.5 text-ink-2">
              {locked ? <Lock className="w-3 h-3 text-ink-yellow" /> : <Unlock className="w-3 h-3 text-ink-green" />}
              <span className="truncate"><span className="text-ink">#{problem.n} {problem.title}</span> · {locked ? 'hint-only mode' : context?.reviewMode ? 'review mode' : 'solution unlocked'}</span>
            </p>
          ) : (
            <p className="text-ink-2">No problem attached. General Java and DSA questions.</p>
          )}
          {models.length > 1 && (
            <select
              className="field !py-1 !text-xs font-display"
              value={activeModel}
              onChange={e => { setModel(e.target.value); try { localStorage.setItem('sde_lm_model', e.target.value); } catch { /* ignore */ } }}
              aria-label="Model"
            >
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[200px]">
          {messages.length === 0 && !streaming && (
            <p className="text-sm text-ink-2">
              {locked
                ? "I'll ask questions and give at most one nudge at a time. No answers until you've used both hints and unlocked the solution."
                : 'Ask anything about this problem or Java.'}
            </p>
          )}
          {messages.map(m => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
              {m.role === 'user' ? (
                <div className="max-w-[90%] rounded px-3 py-2 bg-paper-2 border border-line text-sm text-ink whitespace-pre-wrap">{m.content}</div>
              ) : (
                <MarkdownRenderer content={m.content} />
              )}
            </div>
          ))}
          {streaming && (
            <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
              {streamText || <span className="text-ink-2">{thinking ? 'Thinking…' : '…'}</span>}
              <span className="inline-block w-1.5 h-3.5 bg-ink-2 animate-pulse ml-0.5 align-middle" aria-hidden />
            </div>
          )}
          {error && (
            <div className="rounded border border-ink-orange/40 bg-ink-orange/12 p-3 text-xs text-ink-orange flex items-start gap-2" role="alert">
              <span className="flex-1">{error}</span>
              {status === 'offline' && <span className="text-ink-2">Start LM Studio → Developer → Start Server, or change the URL in Settings.</span>}
            </div>
          )}
        </div>

        <div className="border-t-[1.5px] border-dashed border-line px-5 py-3 space-y-2 shrink-0">
          {quick.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {quick.map(q => (
                <button
                  key={q.label}
                  className="badge !text-[11px] !py-1 !px-2 text-ink hover:text-ink shrink-0"
                  disabled={streaming}
                  onClick={() => (q.send ? send(q.send) : setInput(q.fill ?? ''))}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={e => { e.preventDefault(); send(input); }}
          >
            <textarea
              rows={2}
              className="field flex-1 resize-none text-sm"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder={status === 'offline' ? 'LM Studio is offline' : 'Message (Enter to send, Shift+Enter for a new line)'}
              aria-label="Message"
              data-autofocus
            />
            {streaming ? (
              <button type="button" className="btn !p-2.5" onClick={stop} aria-label="Stop generating"><Square className="w-4 h-4 fill-ink-orange text-ink-orange" /></button>
            ) : (
              <button type="submit" className="btn-primary !p-2.5" disabled={!input.trim()} aria-label="Send"><Send className="w-4 h-4" /></button>
            )}
          </form>
          {status === 'offline' && (
            <button className="text-[11px] text-ink-2 hover:text-ink flex items-center gap-1" onClick={() => setCheckNonce(n => n + 1)}>
              <RotateCcw className="w-3 h-3" /> Started LM Studio? Check again
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
