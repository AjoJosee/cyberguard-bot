'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  KeyRound,
  FileWarning,
  Send,
  RefreshCw,
  Settings,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Sparkles,
  X,
  ChevronRight,
  Key,
} from 'lucide-react';
import { MarkdownView } from '@/components/MarkdownView';
import {
  OFFICIAL_RESOURCES,
  EMERGENCY_PLAYBOOKS,
  TOPIC_KNOWLEDGE,
  GROK_SYSTEM_PROMPT,
  getRuleBasedResponse,
  getFallbackResponse,
} from '@/lib/knowledge';
import { checkSensitiveInput } from '@/lib/security-rules';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isSecurityAlert?: boolean;
  source?: 'grok-ai' | 'rule-engine' | 'rule-engine-fallback';
}

export default function CyberGuardPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `### 👋 Welcome to CyberGuard AI

I am your cybersecurity and online safety companion. Whether you want to learn safe digital habits or require **immediate triage for a suspected scam or breach**, I'm here to provide calm, step-by-step guidance.

> 🔒 **Privacy Guarantee**: I will **never** ask for your passwords, OTP codes, PINs, or financial details. Never enter sensitive credentials in chat.

#### Need Immediate Help?
Select an **Emergency Triage** action below or ask any question about digital security:`,
      timestamp: 'Just now',
      source: 'rule-engine',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [clientApiKey, setClientApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('grok-2-latest');
  const [showSettings, setShowSettings] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputWarning, setInputWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check backend server status and retrieve session key
  useEffect(() => {
    fetch('/api/chat')
      .then((res) => {
        if (!res.ok) throw new Error('API not present (static mode)');
        return res.json();
      })
      .then((data) => {
        if (data.hasServerKey) {
          setHasServerKey(true);
        }
      })
      .catch(() => {
        // Expected on static exports like GitHub Pages
      });

    if (typeof window !== 'undefined') {
      const savedKey = sessionStorage.getItem('cyberguard_grok_key') || localStorage.getItem('cyberguard_grok_key');
      if (savedKey) setClientApiKey(savedKey);
    }
  }, []);

  // Monitor input text for sensitive credentials (OTPs, passwords, cards)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const check = checkSensitiveInput(val);
    if (check.hasSensitiveData && check.warningMessage) {
      setInputWarning(check.warningMessage);
    } else {
      setInputWarning(null);
    }
  };

  const handleSaveSettings = (key: string, model: string) => {
    setClientApiKey(key);
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      if (key) {
        sessionStorage.setItem('cyberguard_grok_key', key);
        localStorage.setItem('cyberguard_grok_key', key);
      } else {
        sessionStorage.removeItem('cyberguard_grok_key');
        localStorage.removeItem('cyberguard_grok_key');
      }
    }
    setShowSettings(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `### 🛡️ CyberGuard Ready\n\nChat history reset. How can I assist with your cybersecurity or online privacy today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'rule-engine',
      },
    ]);
  };

  // Trigger Emergency Playbook directly
  const triggerEmergencyPlaybook = (playbookId: string) => {
    const playbook = EMERGENCY_PLAYBOOKS[playbookId];
    if (!playbook) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: `🚨 Emergency Triage: ${playbook.title.replace(/^[^a-zA-Z0-9]+/, '')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let responseContent = `### ${playbook.title}\n\n`;
    responseContent += `> ⚠️ **Immediate Emergency Triage**: ${playbook.summary}\n\n`;
    responseContent += `#### Action Checklist:\n`;
    playbook.steps.forEach((step, idx) => {
      responseContent += `${idx + 1}. ${step}\n`;
    });
    responseContent += `\n#### Important Context:\n`;
    playbook.tips.forEach((tip) => {
      responseContent += `- ${tip}\n`;
    });
    if (playbook.officialResources.length > 0) {
      responseContent += `\n#### Official Assistance & Reporting:\n`;
      playbook.officialResources.forEach((res) => {
        responseContent += `- [**${res.name}**](${res.url}) - ${res.description}\n`;
      });
    }

    const assistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'rule-engine',
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  // Trigger Topic guidance
  const triggerTopic = (topicKey: string) => {
    const topic = TOPIC_KNOWLEDGE[topicKey];
    if (!topic) return;
    sendMessage(`Tell me safe habits and red flags for ${topic.name}`);
  };

  // Direct client-side streaming from Grok API
  const streamFromGrokDirect = async (
    apiKey: string,
    history: Message[],
    assistantMessageId: string
  ) => {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: GROK_SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`xAI API responded with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                accumulated += delta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulated, source: 'grok-ai' }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore incomplete chunks
            }
          }
        }
      }
    }
  };

  // Send a message
  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isLoading) return;

    // Check sensitive data client-side before sending
    const check = checkSensitiveInput(textToSend);
    if (check.hasSensitiveData && check.warningMessage) {
      const alertMsg: Message = {
        id: `alert-${Date.now()}`,
        role: 'assistant',
        content: check.warningMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSecurityAlert: true,
      };
      setMessages((prev) => [...prev, alertMsg]);
      setInput('');
      setInputWarning(null);
      return;
    }

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setInputWarning(null);
    setIsLoading(true);

    const assistantMessageId = `asst-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: clientApiKey || hasServerKey ? 'grok-ai' : 'rule-engine',
    };

    setMessages([...newMessages, initialAssistantMsg]);

    try {
      // 1. If user provided a client Grok key in settings/session, call xAI directly
      if (clientApiKey && clientApiKey.trim().length > 0) {
        await streamFromGrokDirect(clientApiKey, newMessages, assistantMessageId);
        return;
      }

      // 2. Otherwise attempt server route /api/chat (if server key exists)
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model: selectedModel,
          }),
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: data.content,
                      isSecurityAlert: data.isSecurityAlert,
                      source: data.source || 'rule-engine',
                    }
                  : msg
              )
            );
            return;
          } else {
            // Stream SSE
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulated, source: 'grok-ai' }
                      : msg
                  )
                );
              }
            }
            return;
          }
        }
      } catch {
        // Fall through to client rule engine
      }

      // 3. Instant Client-Side Rule Engine Fallback (ultra-fast, works 100% offline & on static pages)
      const ruleResponse = getRuleBasedResponse(textToSend) || getFallbackResponse(textToSend);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: ruleResponse,
                source: 'rule-engine',
              }
            : msg
        )
      );
    } catch (err: unknown) {
      console.error('Error in chat:', err);
      // Graceful fallback
      const fallback = getRuleBasedResponse(textToSend) || getFallbackResponse(textToSend);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: fallback,
                source: 'rule-engine-fallback',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">CyberGuard</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {clientApiKey || hasServerKey ? 'Grok AI Mode' : 'Knowledge Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cybersecurity Guidance & Emergency Incident Triage
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResources(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Official Reporting Resources"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Official Portals</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Grok API & Bot Settings"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">API Key / Model</span>
            </button>
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mandatory Privacy & Safety Notice Banner */}
      <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 text-xs text-amber-300/90 flex items-center justify-center gap-2 text-center">
        <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
        <span>
          <strong>Privacy Notice</strong>: CyberGuard will <u>never</u> ask for or store passwords, OTPs, PINs, or banking details. Never disclose sensitive credentials in chat.
        </span>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Emergency Triage Quick-Action Cards (Step 3) */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>High-Concern Incident Triage</span>
            </div>
            <span className="text-[11px] text-slate-400">Instant step-by-step guidance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => triggerEmergencyPlaybook('suspected-scam')}
              className="flex flex-col text-left p-3.5 rounded-xl bg-slate-950/70 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-700/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Suspected Scam</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                Someone demands money, gift cards, OTPs, or remote screen access.
              </p>
              <span className="mt-2 text-[11px] font-medium text-rose-400/90 flex items-center gap-1">
                Open playbook <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => triggerEmergencyPlaybook('compromised-account')}
              className="flex flex-col text-left p-3.5 rounded-xl bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-700/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
                <KeyRound className="w-4 h-4" />
                <span>Compromised Account</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                Account hacked, unauthorized logins, or locked out of email/social.
              </p>
              <span className="mt-2 text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
                Lockdown steps <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => triggerEmergencyPlaybook('suspicious-links-files')}
              className="flex flex-col text-left p-3.5 rounded-xl bg-slate-950/70 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-700/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1">
                <FileWarning className="w-4 h-4" />
                <span>Suspicious Link / File</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                How to verify safely, and emergency triage if you already clicked it.
              </p>
              <span className="mt-2 text-[11px] font-medium text-cyan-400/90 flex items-center gap-1">
                Verification & Triage <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </section>

        {/* 5 Core Cybersecurity Topics Quick Pills (Step 2) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium text-[11px] px-1 flex-shrink-0">
            Topics:
          </span>
          <button
            onClick={() => triggerTopic('phishing')}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            🎣 Phishing & Email
          </button>
          <button
            onClick={() => triggerTopic('passwords-2fa')}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            🔑 Passwords & 2FA
          </button>
          <button
            onClick={() => triggerTopic('malware-downloads')}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            🦠 Malware & Downloads
          </button>
          <button
            onClick={() => triggerTopic('public-wifi-vpn')}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            📶 Public Wi-Fi & VPN
          </button>
          <button
            onClick={() => triggerTopic('social-engineering')}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            🎭 Social Engineering
          </button>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 space-y-4 min-h-[360px]">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Shield className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-md relative group ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : message.isSecurityAlert
                      ? 'bg-rose-950/40 border border-rose-800/80 text-rose-200 rounded-bl-none'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Top message info badge */}
                  <div className="flex items-center justify-between gap-2 mb-1 text-[11px] opacity-75">
                    <span className="font-medium">
                      {isUser ? 'You' : 'CyberGuard'}
                    </span>
                    <div className="flex items-center gap-2">
                      {message.source && !isUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                          {message.source === 'grok-ai' ? '🤖 Grok AI' : '🛡️ Local Knowledge'}
                        </span>
                      )}
                      <span>{message.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white"
                          title="Copy response"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-normal">
                      {message.content}
                    </p>
                  ) : (
                    <MarkdownView content={message.content} />
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-700 flex items-center justify-center flex-shrink-0 mt-1 text-white font-semibold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Analyzing security inquiry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Sensitivity Warning */}
        <div className="sticky bottom-2 z-20 pt-2">
          {inputWarning && (
            <div className="mb-2 p-2.5 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-start gap-2 shadow-lg backdrop-blur-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal">
                {inputWarning}
              </div>
              <button
                onClick={() => setInputWarning(null)}
                className="text-rose-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 focus-within:border-cyan-500/70 rounded-2xl p-2 shadow-xl transition-all"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about suspicious emails, passwords, scams, or WiFi safety (Never type real passwords/OTPs)..."
              rows={1}
              className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm md:text-base focus:ring-0 focus:outline-none resize-none px-2 py-1.5 max-h-32"
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium transition-all shadow-md flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Fictional Scenario Starters */}
          <div className="mt-2 flex flex-wrap gap-1.5 items-center justify-center text-[11px] text-slate-500">
            <span>Try asking:</span>
            <button
              onClick={() => sendMessage('I received an urgent email saying my bank account was suspended. How do I verify it?')}
              className="hover:text-cyan-400 transition-colors underline decoration-dotted"
            >
              "Fake bank email"
            </button>
            <span>•</span>
            <button
              onClick={() => sendMessage('What is the safest way to store passwords without forgetting them?')}
              className="hover:text-cyan-400 transition-colors underline decoration-dotted"
            >
              "Best password habits"
            </button>
            <span>•</span>
            <button
              onClick={() => sendMessage('Is hotel or coffee shop public Wi-Fi safe to use?')}
              className="hover:text-cyan-400 transition-colors underline decoration-dotted"
            >
              "Public Wi-Fi risks"
            </button>
          </div>
        </div>
      </main>

      {/* Official Resources Modal */}
      {showResources && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowResources(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Official Reporting Portals</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              If you have encountered a cybercrime, financial fraud, or identity theft, report it directly to these official authorities:
            </p>

            <div className="space-y-3">
              {OFFICIAL_RESOURCES.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-700/60 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-cyan-400 group-hover:text-cyan-300">
                      {res.name}
                    </span>
                    {res.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {res.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{res.description}</p>
                </a>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowResources(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Configuring Grok API Key / Model) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Grok AI Configuration</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter your Grok API key (from <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">console.x.ai</a>) to unlock real-time Grok reasoning. Keys can also be placed in the backend <code>.env.local</code>.
            </p>

            {/* Server Status Indicator */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400">Backend Server .env Key:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded ${
                  hasServerKey
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hasServerKey ? '✓ Active in .env' : 'Not configured in .env'}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const keyInput = (form.elements.namedItem('grokKey') as HTMLInputElement).value;
                const modelSelect = (form.elements.namedItem('grokModel') as HTMLSelectElement).value;
                handleSaveSettings(keyInput, modelSelect);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Grok API Key
                </label>
                <input
                  name="grokKey"
                  type="password"
                  defaultValue={clientApiKey}
                  placeholder={hasServerKey ? "Using backend key (leave empty)" : "xai-..."}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Keys entered here remain strictly in your browser session memory. Never sent to any third party.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Grok Model
                </label>
                <select
                  name="grokModel"
                  defaultValue={selectedModel}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 focus:outline-none"
                >
                  <option value="grok-2-latest">grok-2-latest (Balanced & High Quality)</option>
                  <option value="grok-2-mini">grok-2-mini (Ultra Fast Response)</option>
                  <option value="grok-beta">grok-beta</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
