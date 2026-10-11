'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Square, 
  Trash2, 
  RotateCcw, 
  Settings2, 
  Bot, 
  Paperclip
} from 'lucide-react';
import { Problem } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface LocalAIChatDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  activeProblem: Problem | null;
  embedded?: boolean;
}

export const LocalAIChatDrawer: React.FC<LocalAIChatDrawerProps> = ({
  isOpen,
  onClose,
  activeProblem,
  embedded = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to Local AI (LM Studio)
I'm running locally on your machine. Ask me for optimal Java invariants, time/space complexity analysis with math ($O(N)$, $\\Omega(1)$), or edge case reviews.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('http://127.0.0.1:1234/v1');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [includeProblemContext, setIncludeProblemContext] = useState<boolean>(true);

  // Resizable drawer width state (for standalone mode)
  const [drawerWidth, setDrawerWidth] = useState<number>(460);
  const [isDraggingResize, setIsDraggingResize] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem('sde_lm_studio_url');
      if (savedUrl) setBaseUrl(savedUrl);
      const savedWidth = localStorage.getItem('sde_ai_drawer_width');
      if (savedWidth) {
        const parsed = parseInt(savedWidth);
        if (!isNaN(parsed) && parsed >= 360 && parsed <= 900) {
          setDrawerWidth(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch available models from LM Studio
  const checkConnectionAndModels = useCallback(async (targetUrl?: string) => {
    setIsCheckingConnection(true);
    setConnectionError(null);
    const url = targetUrl || baseUrl;

    try {
      const res = await fetch(`/api/local-ai/models?baseUrl=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.connected && Array.isArray(data.models) && data.models.length > 0) {
        setIsConnected(true);
        setModels(data.models);
        if (!selectedModel || !data.models.includes(selectedModel)) {
          setSelectedModel(data.defaultModel || data.models[0]);
        }
      } else if (data.connected) {
        setIsConnected(true);
        setModels([]);
        setSelectedModel('Default Loaded Model');
      } else {
        setIsConnected(false);
        setConnectionError(data.error || 'Connection refused. Is LM Studio local server running?');
      }
    } catch (err: unknown) {
      setIsConnected(false);
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      setConnectionError(msg);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [baseUrl, selectedModel]);

  // Check connection when drawer opens or baseUrl changes
  useEffect(() => {
    if (isOpen) {
      checkConnectionAndModels();
    }
  }, [isOpen, checkConnectionAndModels]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Handle saving custom base URL
  const handleSaveBaseUrl = (newUrl: string) => {
    setBaseUrl(newUrl);
    try {
      localStorage.setItem('sde_lm_studio_url', newUrl);
    } catch {
      // ignore
    }
    checkConnectionAndModels(newUrl);
  };

  // Drag-to-resize handlers
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
  };

  useEffect(() => {
    if (!isDraggingResize) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 360 && newWidth <= Math.min(900, window.innerWidth - 100)) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingResize(false);
      try {
        localStorage.setItem('sde_ai_drawer_width', drawerWidth.toString());
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingResize, drawerWidth]);

  const setWidthPreset = (targetWidth: number) => {
    const clamped = Math.min(Math.max(360, targetWidth), window.innerWidth - 100);
    setDrawerWidth(clamped);
    try {
      localStorage.setItem('sde_ai_drawer_width', clamped.toString());
    } catch {
      // ignore
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const placeholderAssistant: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage, placeholderAssistant]);
    setInput('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const conversationPayload = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const problemPayload = includeProblemContext && activeProblem ? {
        id: activeProblem.id,
        sheetIndex: activeProblem.sheetIndex,
        title: activeProblem.title,
        difficulty: activeProblem.difficulty,
        topic: activeProblem.topic,
        subTopic: activeProblem.subTopic,
        hints: activeProblem.hints,
      } : undefined;

      const response = await fetch('/api/local-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
          model: selectedModel,
          baseUrl,
          problemContext: problemPayload,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No streaming body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content || '';
            if (deltaContent) {
              accumulatedContent += deltaContent;
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  last.content = accumulatedContent;
                }
                return copy;
              });
            }
          } catch {
            // Partial JSON chunk, skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped generation
      } else {
        const errMsg = err instanceof Error ? err.message : 'Communication error';
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            last.content = `> ⚠️ **Error**: ${errMsg}\n\nPlease check that LM Studio is open and the local server is started at \`${baseUrl}\`.`;
          }
          return copy;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. What Java DSA challenge are you working on?`,
        timestamp: Date.now(),
      },
    ]);
  };

  if (!isOpen) return null;

  // The chat inner content (shared between standalone drawer and embedded workspace pane)
  const chatContent = (
    <div className="flex flex-col h-full w-full bg-[#09090b] relative overflow-hidden select-text">
      {/* Resizer Handle (Only in standalone drawer mode) */}
      {!embedded && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-zinc-500/50 transition-colors z-20"
          title="Drag to resize width"
        />
      )}

      {/* Header Bar */}
      <div className="px-3 py-2.5 bg-[#000000] border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        
        {/* Left: Status & Model */}
        <div className="flex items-center space-x-2 truncate">
          <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Bot className="w-3 h-3 text-zinc-300" />
          </div>
          <div className="truncate flex items-center space-x-2">
            <span className="text-xs font-semibold text-white tracking-tight">
              Local AI
            </span>
            <span className="flex items-center space-x-1 text-[10px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`} />
              <span className={isConnected ? 'text-emerald-400' : 'text-zinc-500'}>
                {isCheckingConnection ? 'Connecting...' : isConnected ? 'Online' : 'Offline'}
              </span>
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Standalone width presets */}
          {!embedded && (
            <div className="hidden sm:flex items-center space-x-1 text-[10px] font-mono text-zinc-500 mr-1 border-r border-zinc-800 pr-1.5">
              <button
                onClick={() => setWidthPreset(400)}
                className={`px-1.5 py-0.5 rounded hover:text-white ${drawerWidth <= 420 ? 'text-white font-semibold bg-zinc-800' : ''}`}
                title="Compact Width"
              >
                400
              </button>
              <button
                onClick={() => setWidthPreset(540)}
                className={`px-1.5 py-0.5 rounded hover:text-white ${drawerWidth > 420 && drawerWidth < 650 ? 'text-white font-semibold bg-zinc-800' : ''}`}
                title="Standard Width"
              >
                540
              </button>
              <button
                onClick={() => setWidthPreset(720)}
                className={`px-1.5 py-0.5 rounded hover:text-white ${drawerWidth >= 650 ? 'text-white font-semibold bg-zinc-800' : ''}`}
                title="Wide Width"
              >
                720
              </button>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition ${
              showSettings 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="LM Studio Host / Model Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            title="Clear Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Settings Bar (Host & Model selector) */}
      {showSettings && (
        <div className="px-3 py-2 bg-[#0c0c0e] border-b border-zinc-800 space-y-2 text-xs font-mono shrink-0 animate-in slide-in-from-top-1 duration-150">
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500 font-semibold mb-1">
              <span>LM Studio Server</span>
              <button
                onClick={() => checkConnectionAndModels()}
                className="text-zinc-400 hover:text-white flex items-center space-x-1"
              >
                <RotateCcw className={`w-2.5 h-2.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => handleSaveBaseUrl(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              placeholder="http://127.0.0.1:1234/v1"
            />
          </div>

          {models.length > 0 && (
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-semibold mb-1">
                Model
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {connectionError && (
            <p className="text-[11px] text-rose-400 leading-tight">
              {connectionError}
            </p>
          )}
        </div>
      )}

      {/* Context Badge */}
      {activeProblem && (
        <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono shrink-0">
          <div className="flex items-center space-x-1.5 truncate">
            <Paperclip className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="text-zinc-500">Problem:</span>
            <span className="text-white truncate font-medium">
              #{activeProblem.sheetIndex.toString().padStart(2, '0')} {activeProblem.title}
            </span>
          </div>

          <button
            onClick={() => setIncludeProblemContext(!includeProblemContext)}
            className={`text-[10px] px-1.5 py-0.5 rounded transition ${
              includeProblemContext 
                ? 'bg-zinc-800 text-white font-medium' 
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle whether problem description is sent with prompts"
          >
            {includeProblemContext ? 'Attached' : 'Detached'}
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      {activeProblem && (
        <div className="px-3 py-1.5 bg-[#09090b] border-b border-zinc-800/60 flex items-center space-x-1.5 overflow-x-auto text-[11px] font-mono shrink-0 no-scrollbar">
          <button
            onClick={() => handleSendMessage(`What is the optimal Java approach and time/space complexity (in LaTeX format) for ${activeProblem.title}?`)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 whitespace-nowrap transition"
          >
            ⚡ Invariants &amp; Math
          </button>
          <button
            onClick={() => handleSendMessage(`What are the key Java gotchas and edge cases for ${activeProblem.title}?`)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 whitespace-nowrap transition"
          >
            ⚠️ Java Gotchas
          </button>
          <button
            onClick={() => handleSendMessage(`Provide a gentle hint for ${activeProblem.title} without giving away the complete solution.`)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 whitespace-nowrap transition"
          >
            💡 Gentle Hint
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[92%] rounded-xl p-3 leading-relaxed ${
              m.role === 'user'
                ? 'bg-zinc-900 text-white border border-zinc-800'
                : 'bg-black/60 text-zinc-200 border border-zinc-800/80 w-full'
            }`}>
              {m.role === 'assistant' ? (
                <MarkdownRenderer
                  content={m.content}
                  isStreaming={isStreaming && m.id === messages[messages.length - 1].id}
                />
              ) : (
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {m.content}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-3 bg-[#000000] border-t border-zinc-800 space-y-2 shrink-0">
        {isStreaming && (
          <div className="flex justify-center">
            <button
              onClick={handleStopStreaming}
              className="px-2.5 py-0.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white flex items-center space-x-1.5 transition"
            >
              <Square className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              <span>Stop Generating</span>
            </button>
          </div>
        )}

        <div className="relative flex items-end bg-[#09090b] border border-zinc-800 rounded-xl p-2 focus-within:border-zinc-600 transition">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isConnected ? "Ask local model (supports LaTeX $O(N)$ & Java code)..." : "LM Studio offline. Configure in ⚙️"}
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed p-1"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isStreaming}
            className="p-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white transition ml-2 shrink-0"
            title="Send (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
          <span>LaTeX: $O(N \log N)$</span>
          <span className="truncate max-w-[200px] text-right">
            {selectedModel ? selectedModel.split('/').pop() : 'Local Model'}
          </span>
        </div>
      </div>
    </div>
  );

  // If embedded in a multi-pane layout, return direct content
  if (embedded) {
    return chatContent;
  }

  // Otherwise return standalone right-side drawer with backdrop and resize handle
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      <aside 
        style={{ width: `${drawerWidth}px` }}
        className="fixed inset-y-0 right-0 max-w-[95vw] bg-[#09090b] border-l border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {chatContent}
      </aside>
    </>
  );
};
