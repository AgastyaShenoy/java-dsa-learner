'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { UserSettings } from '@/types';
import { Dialog } from './ui/Dialog';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '@/lib/theme';
import { applyImport, downloadBackup, getLegacyUnmapped, parseBackup, resetProgress, updateSettings, type ParsedImport } from '@/lib/db';

interface Props {
  onClose: () => void;
  settings: UserSettings;
  attemptCount: number;
}

export function SettingsModal({ onClose, settings, attemptCount }: Props) {
  const [lock, setLock] = useState(String(settings.hintLockMinutes));
  const [includeStretch, setIncludeStretch] = useState(settings.includeStretch);
  const [lmUrl, setLmUrl] = useState(settings.lmStudioUrl);
  const [lcUser, setLcUser] = useState(settings.leetcodeUsername);
  const [saved, setSaved] = useState(false);

  const [pending, setPending] = useState<ParsedImport | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [resetText, setResetText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [legacyCount, setLegacyCount] = useState(0);
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice);
  useEffect(() => { getLegacyUnmapped().then(l => setLegacyCount(l.length)); }, []);

  const lockNum = Number(lock);
  const lockValid = lock.trim() !== '' && Number.isInteger(lockNum) && lockNum >= 0 && lockNum <= 120;
  const userValid = lcUser.trim() === '' || /^[A-Za-z0-9_-]{1,40}$/.test(lcUser.trim());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockValid || !userValid) return;
    await updateSettings({ hintLockMinutes: lockNum, includeStretch, lmStudioUrl: lmUrl.trim() || 'http://127.0.0.1:1234/v1', leetcodeUsername: lcUser.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(null);
    try {
      setPending(parseBackup(await file.text()));
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Could not read that file.' });
    }
  };

  const confirmImport = async () => {
    if (!pending) return;
    try {
      if (attemptCount > 0) await downloadBackup('before-import');
      await applyImport(pending);
      setMessage({ kind: 'ok', text: `Restored ${pending.attempts.length} attempts${pending.skipped ? ` (${pending.skipped} skipped: unknown problem or bad data)` : ''}.` });
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Import failed. Nothing was changed.' });
    }
    setPending(null);
  };

  const doReset = async () => {
    if (resetText !== 'reset') return;
    if (attemptCount > 0) await downloadBackup('before-reset');
    await resetProgress();
    setResetText('');
    setMessage({ kind: 'ok', text: 'Progress cleared. A backup was downloaded first.' });
  };

  return (
    <Dialog open onClose={onClose} title="Settings" width="34rem" closeOnBackdrop={false}>
      <div className="p-5 space-y-8">
        <form onSubmit={save} className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">Practice</h3>
          <div>
            <label htmlFor="s-lock" className="label">Solo minutes before hint 1</label>
            <input id="s-lock" className="field w-28 tabular-nums" inputMode="numeric" value={lock} onChange={e => setLock(e.target.value.replace(/[^\d]/g, ''))} />
            {!lockValid && <p className="text-xs text-ink-orange mt-1">0 to 120.</p>}
          </div>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" checked={includeStretch} onChange={e => setIncludeStretch(e.target.checked)} className="accent-ink-pink w-4 h-4 mt-1" />
            <span>Include stretch problems in &quot;Next up&quot;<span className="block text-xs text-ink-2">21 niche ones (KMP, Kosaraju, Floyd–Warshall…). They stay in the sheet either way.</span></span>
          </label>

          <h3 className="text-sm font-semibold text-ink pt-2">Connections</h3>
          <div>
            <label htmlFor="s-lm" className="label">LM Studio server</label>
            <input id="s-lm" className="field font-mono text-xs" value={lmUrl} onChange={e => setLmUrl(e.target.value)} placeholder="http://127.0.0.1:1234/v1" />
            <p className="text-xs text-ink-2 mt-1">Must be on this machine (localhost) unless LMSTUDIO_ALLOW_REMOTE=1 is set for the server.</p>
          </div>
          <div>
            <label htmlFor="s-lc" className="label">LeetCode username (for the contest rating tile)</label>
            <input id="s-lc" className="field" value={lcUser} onChange={e => setLcUser(e.target.value)} placeholder="optional" autoComplete="off" />
            {!userValid && <p className="text-xs text-ink-orange mt-1">Letters, numbers, - and _ only.</p>}
          </div>
          <button type="submit" className="btn-primary" disabled={!lockValid || !userValid}>{saved ? 'Saved ✓' : 'Save settings'}</button>
        </form>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Look</h3>
          <div className="flex gap-2" role="radiogroup" aria-label="Theme">
            {(['system', 'dark', 'light'] as ThemeChoice[]).map(t => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme === t}
                className="chip !text-sm"
                onClick={() => { setThemeChoice(t); setTheme(t); }}
              >
                {t === 'system' ? 'Match system' : t === 'dark' ? 'Black' : 'Newsprint'}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-2">Saved in this browser only.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Your data</h3>
          <p className="text-xs text-ink-2">Everything lives in this browser ({attemptCount} attempts). Clearing site data deletes it, so export now and then.</p>
          {legacyCount > 0 && (
            <p className="text-xs text-ink-yellow/80">
              {legacyCount} log{legacyCount > 1 ? 's' : ''} from the old 30-problem version didn&apos;t match a Striver 180 problem. They&apos;re kept aside and included in every export.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => downloadBackup()}><Download className="w-4 h-4" /> Export backup</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Restore from backup…</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickFile} />
          </div>

          {pending && (
            <div className="rounded-[3px] border-2 border-dashed border-ink-orange px-4 py-3 space-y-2" role="alertdialog" aria-label="Confirm restore">
              <p className="text-sm text-ink">
                Replace your {attemptCount} attempts with {pending.attempts.length} from this {pending.format === 'v1-legacy' ? 'old-version ' : ''}backup?
                {pending.skipped > 0 && ` ${pending.skipped} entries will be skipped.`}
              </p>
              <p className="text-xs text-ink-2">{attemptCount > 0 ? 'Your current data downloads as a backup first.' : ''}</p>
              <div className="flex gap-2">
                <button className="btn" onClick={confirmImport}>Replace</button>
                <button className="btn" onClick={() => setPending(null)}>Cancel</button>
              </div>
            </div>
          )}
          {message && <p className={`text-sm ${message.kind === 'ok' ? 'text-ink-green' : 'text-ink-orange'}`} role="status">{message.text}</p>}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Start over</h3>
          <p className="text-xs text-ink-2">Deletes every attempt. Type <span className="font-mono text-ink">reset</span> to confirm. A backup downloads first.</p>
          <div className="flex gap-2">
            <input className="field w-32 font-mono" value={resetText} onChange={e => setResetText(e.target.value)} aria-label="Type reset to confirm" />
            <button className="btn danger" disabled={resetText !== 'reset'} onClick={doReset}>Delete all progress</button>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
