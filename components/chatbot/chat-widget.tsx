'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Mic, MicOff, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  actionUrl?: string;
}

interface ChatbotResponse {
  response: string;
  actionUrl?: string;
  confidence?: number;
  handoffSuggested?: boolean;
  handoffReason?: string;
  source?: 'intent' | 'ai' | 'fallback' | 'handoff';
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

const STORAGE_KEY = 'circlein-chat-history-v2';
const VOICE_MODE_STORAGE_KEY = 'circlein-voice-auto-send';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your booking assistant. Ask me anything about amenities or tell me what you'd like to book!",
  createdAt: new Date().toISOString(),
};

export function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMessages([WELCOME_MESSAGE]);
      } else {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.slice(-20).map((msg: ChatMessage) => {
            if (msg?.id?.startsWith('welcome') && msg?.role === 'assistant') {
              return {
                ...msg,
                content: WELCOME_MESSAGE.content,
              };
            }
            return msg;
          });
          setMessages(migrated);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      }

      const voiceModeSetting = localStorage.getItem(VOICE_MODE_STORAGE_KEY);
      if (voiceModeSetting !== null) {
        setAutoSendVoice(voiceModeSetting === 'true');
      }

      setIsHydrated(true);
    } catch (error) {
      console.error('Failed to load chat settings:', error);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));

    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(VOICE_MODE_STORAGE_KEY, String(autoSendVoice));
    }
  }, [autoSendVoice, isHydrated]);

  useEffect(() => {
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // no-op: recognition may already be stopped
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsidePanel = panelRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);

      if (!clickedInsidePanel && !clickedTrigger) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  );

  const sendMessage = async (value?: string) => {
    const trimmed = (value ?? inputValue).trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    if (!value) {
      setInputValue('');
    }
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          userRole: session?.user?.role || 'resident',
          conversationHistory: conversationHistory.slice(-8),
        }),
      });

      const data: ChatbotResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data?.response || 'I could not process that right now. Please try again.',
          createdAt: new Date().toISOString(),
          actionUrl: data?.actionUrl,
        },
      ]);
    } catch (error) {
      console.error('Chat request failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_error_${Date.now()}`,
          role: 'assistant',
          content: 'I ran into a connection issue. Please try again in a moment.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete chat history? This cannot be undone.');
      if (!confirmed) {
        return;
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setMessages([{ ...WELCOME_MESSAGE, id: `welcome_${Date.now()}` }]);
  };

  const ensureMicrophoneAccess = async (): Promise<boolean> => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      toast.error('Voice requires HTTPS (or localhost).');
      return false;
    }

    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });

        if (status.state === 'denied') {
          toast.error('Microphone is blocked in browser settings. Allow microphone and try again.');
          return false;
        }
      }
    } catch {
      // Some browsers do not support querying microphone permission state.
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error: any) {
      const errorName = error?.name;
      if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
        toast.error('Microphone permission denied. Click the site lock icon and allow microphone.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        toast.error('No microphone was found on this device.');
      } else {
        toast.error('Could not access microphone. Please check browser settings.');
      }
      return false;
    }
  };

  const startVoiceInput = async () => {
    try {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        toast.error('Voice mode is not supported in this browser.');
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error('Error stopping voice recognition:', error);
        }
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
        }
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }

      const hasMicAccess = await ensureMicrophoneAccess();
      if (!hasMicAccess) {
        return;
      }

      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      let hasHandledFinalResult = false;

      recognition.onstart = () => {
        setIsListening(true);

        // Safety watchdog: reset listening state if browser fails to emit onend.
        listeningTimeoutRef.current = setTimeout(() => {
          try {
            recognition.abort();
          } catch {
            // no-op
          }
          recognitionRef.current = null;
          setIsListening(false);
        }, 12000);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result?.[0]?.transcript || '';
          if (result?.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const normalizedFinal = finalTranscript.trim();
        const normalizedInterim = interimTranscript.trim();

        if (!normalizedFinal && !normalizedInterim) {
          return;
        }

        if (autoSendVoice && normalizedFinal && !hasHandledFinalResult) {
          hasHandledFinalResult = true;
          setInputValue('');
          void sendMessage(normalizedFinal);
        } else {
          setInputValue(normalizedFinal || normalizedInterim);
        }
      };

      recognition.onend = () => {
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
        }
        const errorCode = event?.error || 'unknown_error';
        if (errorCode === 'not-allowed') {
          toast.error('Microphone permission denied. Click the site lock icon and allow microphone, then try again.');
        } else if (errorCode === 'no-speech') {
          toast.error('No speech detected. Please try again.');
        } else if (errorCode === 'audio-capture') {
          toast.error('No microphone detected.');
        } else {
          toast.error('Voice input failed. Please try again.');
        }
        console.error('Voice recognition error:', errorCode);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
      console.error('Fatal error in startVoiceInput:', error);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const supportsVoice = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      <div ref={triggerRef} data-tour="chat-widget-trigger" className="fixed bottom-5 right-5 z-[85]">
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/40"
            animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'relative h-14 w-14 rounded-full shadow-xl transition-all duration-200',
            isOpen
              ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
              : 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
          )}
          aria-label="Toggle AI chat"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-[83] bg-slate-900/10 backdrop-blur-[1px]"
            />

            <motion.section
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-widget-title"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed bottom-24 right-5 z-[84] w-[calc(100vw-2.5rem)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800/90 dark:bg-slate-950"
            >
              <header className="relative flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-white dark:border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_45%)]" />
                <div className="relative">
                  <p id="chat-widget-title" className="text-sm font-semibold">CircleIn Assistant</p>
                  <p className="text-xs text-white/90">Ask anything or book by chat</p>
                </div>
                <div className="relative flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearHistory}
                    aria-label="Clear chat history"
                    className="h-8 w-8 rounded-md text-white/90 hover:bg-white/20 hover:text-white"
                    title="Clear chat history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Sparkles className="h-4 w-4" />
                </div>
              </header>

              <div ref={messagesContainerRef} className="max-h-[420px] min-h-[320px] space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_32%)] px-3 py-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                        message.role === 'user'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      {message.actionUrl && (
                        <a
                          href={message.actionUrl}
                          className="mt-2 inline-block rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                        >
                          {message.actionUrl === '/contact' ? 'Open support center' : 'Open booking details'}
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <footer className="border-t border-slate-200 p-3 dark:border-slate-800">
                {isHydrated && supportsVoice && (
                  <div className="mb-2 flex items-center">
                    <button
                      type="button"
                      className={cn(
                        'text-xs transition-colors',
                        autoSendVoice
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                      onClick={() => setAutoSendVoice((prev) => !prev)}
                    >
                      Voice auto-send: {autoSendVoice ? 'ON' : 'OFF'}
                    </button>
                  </div>
                )}
                {isHydrated && !supportsVoice && (
                  <div className="mb-2 text-xs text-amber-600 dark:text-amber-400">
                    Voice mode unavailable in this browser.
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={isListening ? 'Listening...' : 'Ask me anything or describe what to book'}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  {supportsVoice && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(isListening && 'border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400')}
                      onClick={startVoiceInput}
                      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => void sendMessage()}
                    disabled={isSending || !inputValue.trim()}
                    aria-label="Send message"
                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </footer>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
