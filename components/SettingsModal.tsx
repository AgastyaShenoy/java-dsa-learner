'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Database
} from 'lucide-react';
import { 
  getUserSettings, 
  updateUserSettings, 
  exportDatabaseJSON, 
  importDatabaseJSON, 
  resetToSeedData 
} from '@/lib/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [target, setTarget] = useState<number>(4);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    getUserSettings().then(s => {
      setTarget(s.targetProblemsPerDay);
    });
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sde_gemini_api_key') || '';
      setApiKey(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    try {
      await updateUserSettings({
        targetProblemsPerDay: target
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('sde_gemini_api_key', apiKey.trim());
      }
      setStatusMessage('Settings saved.');
      setIsError(false);
      onDataChanged();
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      setIsError(true);
      setStatusMessage('Failed to save settings.');
    }
  };

  const handleExportJSON = async () => {
    try {
      const jsonStr = await exportDatabaseJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sde-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Backup exported.');
      setIsError(false);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setIsError(true);
      setStatusMessage('Export failed.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importDatabaseJSON(content);
      if (res.success) {
        setIsError(false);
        setStatusMessage(res.message);
        onDataChanged();
      } else {
        setIsError(true);
        setStatusMessage(`Import failed: ${res.message}`);
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all data to Striver seed dataset? All logged problem progress will be cleared.')) {
      await resetToSeedData();
      setStatusMessage('Reset to factory seed data completed.');
      setIsError(false);
      onDataChanged();
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Settings Modal: Cursor Settings Pane Style */}
      <div className="relative w-full max-w-lg rounded-xl bg-[#0e1015] border border-[#282b34] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2228] bg-[#000000] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#38bdf8]" />
            <h2 className="text-sm font-semibold text-[#f4f4f6]">
              Preferences &amp; Data Control
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md bg-[#181a22] text-[#8b929f] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-2.5 rounded-md text-xs font-mono flex items-center space-x-2 ${
              isError 
                ? 'bg-[#7f1d1d]/20 text-[#fca5a5] border border-[#dc2626]/40' 
                : 'bg-[#064e3b]/20 text-[#34d399] border border-[#059669]/40'
            }`}>
              {isError ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 1. Daily Target Preference */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-medium text-[#8b929f]">
              DEFAULT PROBLEMS PER DAY
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min={1}
                max={20}
                value={target}
                onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-1.5 rounded-md bg-[#08090c] border border-[#22252e] text-xs font-mono font-bold text-white focus:outline-none focus:border-[#38bdf8]"
              />
              <span className="text-xs text-[#8b929f]">
                Default quota on Mission Control.
              </span>
            </div>
          </div>

          {/* 2. Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-[#8b929f] flex items-center space-x-1.5">
                <Key className="w-3 h-3 text-[#f59e0b]" />
                <span>GOOGLE GEMINI API KEY</span>
              </label>
              <span className="text-[10px] text-[#555b67] font-mono">gemini-2.5-flash</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-1.5 rounded-md bg-[#08090c] border border-[#22252e] text-xs font-mono text-white placeholder-[#555b67] focus:outline-none focus:border-[#38bdf8]"
            />
            <p className="text-[11px] text-[#8b929f]">
              Saved strictly in browser <code className="text-[#c2c7d0] font-mono">localStorage</code>.
            </p>
          </div>

          {/* 3. Data Backup & Restore */}
          <div className="space-y-2.5 pt-2 border-t border-[#1f2228]">
            <label className="text-xs font-mono font-medium text-[#8b929f] flex items-center space-x-1.5">
              <Database className="w-3 h-3 text-[#38bdf8]" />
              <span>DEXIE PERSISTENCE &amp; BACKUP</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                className="p-2.5 rounded-lg bg-[#12141a] hover:bg-[#181a22] border border-[#22252e] text-left transition flex items-center space-x-2 text-xs font-medium text-[#c2c7d0]"
              >
                <Download className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <div>
                  <div>Export Backup</div>
                  <div className="text-[10px] text-[#555b67] font-mono">JSON snapshot</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg bg-[#12141a] hover:bg-[#181a22] border border-[#22252e] text-left transition flex items-center space-x-2 text-xs font-medium text-[#c2c7d0]"
              >
                <Upload className="w-4 h-4 text-[#34d399] shrink-0" />
                <div>
                  <div>Import JSON</div>
                  <div className="text-[10px] text-[#555b67] font-mono">Restore or add 150+</div>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          {/* 4. Factory Reset */}
          <div className="pt-2 border-t border-[#1f2228]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[#f87171]">Factory Reset</h4>
                <p className="text-[11px] text-[#8b929f]">Restores 30 initial seed problems and clears logs.</p>
              </div>
              <button
                type="button"
                onClick={handleResetData}
                className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#7f1d1d]/20 hover:bg-[#7f1d1d]/30 text-[#f87171] border border-[#dc2626]/40 transition flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2228] bg-[#000000] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-mono text-[#8b929f] hover:text-white transition"
          >
            Close [Esc]
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm transition"
          >
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
