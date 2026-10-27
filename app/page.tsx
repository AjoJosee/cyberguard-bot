'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  KeyRound,
  FileWarning,
  Send,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Sparkles,
  X,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  Radio,
  CheckCircle2,
  XCircle,
  Loader2,
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

I am your cybersecurity advisor and emergency incident companion. Whether you need to verify a suspicious communication or require **immediate triage for a suspected breach or active scam**, I provide structured, calm guidance.

> 🔒 **Zero-Retention Privacy Guarantee**: CyberGuard will **never** ask for, store, or accept passwords, OTPs, PINs, or financial information. Never paste sensitive credentials in chat.

#### Quick Incident Triage:
Choose an emergency scenario below, pick a topic, or ask any question in plain English:`,
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

  // Settings testing state
  const [showKeyText, setShowKeyText] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check backend server status and retrieve local session key
  useEffect(() => {
    fetch('/api/chat')
      .then((res) => {
        if (!res.ok) throw new Error('API not present (static host)');
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
      const savedKey =
        sessionStorage.getItem('cyberguard_grok_key') ||
        localStorage.getItem('cyberguard_grok_key') ||
        '';
      if (savedKey) {
        setClientApiKey(savedKey);
        setTempApiKey(savedKey);
      }
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

  // Test the entered Grok API Key directly against xAI API
  const handleTestConnection = async () => {
    const keyToTest = tempApiKey.trim();
    if (!keyToTest) {
      setTestStatus('error');
      setTestMessage('Please enter an API key to test.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Connecting to xAI API...');

    const startTime = performance.now();
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyToTest}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`✓ Connection verified! Grok responded in ${elapsed}ms.`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.message || `HTTP ${res.status} error`;
        setTestStatus('error');
        setTestMessage(`✕ xAI Error: ${errMsg}`);
      }
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err);
      setTestStatus('error');
      setTestMessage(`✕ Network failure: ${errStr}. (Check browser ad-blockers or CORS)`);
    }
  };

  const handleSaveSettings = () => {
    const cleanKey = tempApiKey.trim();
    setClientApiKey(cleanKey);
    if (typeof window !== 'undefined') {
      if (cleanKey) {
        sessionStorage.setItem('cyberguard_grok_key', cleanKey);
        localStorage.setItem('cyberguard_grok_key', cleanKey);
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
        content: `### 🛡️ CyberGuard Ready\n\nIncident log refreshed. How can I assist with your online security or threat inquiry?`,
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
    // Sanitize history so it only sends valid conversation turns starting with first user prompt
    const firstUserIndex = history.findIndex((m) => m.role === 'user');
    const apiHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : history;
    const cleanPayloadMessages = [
      { role: 'system', content: GROK_SYSTEM_PROMPT },
      ...apiHistory
        .filter((m) => !m.isSecurityAlert)
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: cleanPayloadMessages,
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorDetails = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
        }
      } catch {
        const rawText = await response.text().catch(() => '');
        if (rawText) errorDetails = rawText;
      }
      throw new Error(`xAI API Error: ${errorDetails}`);
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
              // Ignore incomplete chunk
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
      // 1. If user provided a client Grok key, call xAI directly
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

      // 3. Instant Local Knowledge Engine
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
      console.error('Error during chat completion:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Provide transparent explanation of the API error rather than concealing it
      const fallbackAdvice = getRuleBasedResponse(textToSend) || getFallbackResponse(textToSend);
      const transparentNotice = `### ⚠️ Grok AI Connection Notice\n\n> **xAI API returned an error:** \`${errorMessage}\`\n\n**Quick resolution:**\n- Click the **API Key** button in the top menu to verify your key.\n- Check your account credits and usage at [console.x.ai](https://console.x.ai).\n- You can also test with model \`grok-2-mini\` in settings.\n\n---\n#### 🛡️ Offline Safety Response (from Local Knowledge Base):\n${fallbackAdvice}`;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: transparentNotice,
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
    <div className="flex flex-col min-h-screen bg-[#06080f] text-slate-100 cyber-grid">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#06080f]/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/10">
              <div className="w-full h-full bg-[#0c121e] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  CYBERGUARD <span className="text-[10px] text-cyan-400 font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">v1.2</span>
                </h1>
                <div className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      clientApiKey || hasServerKey ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-300">
                    {clientApiKey || hasServerKey ? 'Grok AI Stream' : 'Local Knowledge Engine'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Defensive Cyber Intelligence & Incident Response Console
              </p>
            </div>
          </div>

          {/* Action Bar */}
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
              onClick={() => {
                setTempApiKey(clientApiKey);
                setTestStatus('idle');
                setTestMessage('');
                setShowSettings(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 transition-colors"
              title="Grok API & Bot Settings"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>{clientApiKey ? 'Grok Configured' : 'Connect Grok Key'}</span>
            </button>
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear Log"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mandatory Privacy & Zero-Retention Notice */}
      <div className="bg-[#120a0a]/90 border-b border-rose-950/60 px-4 py-2 text-xs text-rose-300/90 flex items-center justify-center gap-2 text-center">
        <Lock className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
        <span>
          <strong>Air-Gap Privacy Guard</strong>: CyberGuard strictly rejects and redacts passwords, OTPs, PINs, and credit card numbers. Never disclose real secrets.
        </span>
      </div>

      {/* Main Command Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Step 3: Emergency Incident Triage (Immediate Action Matrix) */}
        <section className="bg-[#0c121e]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Emergency Incident Triage</span>
            </div>
            <span className="text-[11px] text-slate-400">Select for immediate step-by-step containment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => triggerEmergencyPlaybook('suspected-scam')}
              className="flex flex-col text-left p-3.5 rounded-xl bg-[#090d16] hover:bg-rose-950/20 border-l-4 border-l-rose-500 border border-slate-800/90 hover:border-rose-700/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Suspected Scam</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                Pressured for money, gift cards, OTPs, or remote screen software.
              </p>
              <span className="mt-2 text-[11px] font-medium text-rose-400/90 flex items-center gap-1">
                Containment steps <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => triggerEmergencyPlaybook('compromised-account')}
              className="flex flex-col text-left p-3.5 rounded-xl bg-[#090d16] hover:bg-amber-950/20 border-l-4 border-l-amber-500 border border-slate-800/90 hover:border-amber-700/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
                <KeyRound className="w-4 h-4" />
                <span>Compromised Account</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                Unauthorized login, password changed, or account locked out.
              </p>
              <span className="mt-2 text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
                Lockdown checklist <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => triggerEmergencyPlaybook('suspicious-links-files')}
              className="flex flex-col text-left p-3.5 rounded-xl bg-[#090d16] hover:bg-cyan-950/20 border-l-4 border-l-cyan-500 border border-slate-800/90 hover:border-cyan-700/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1">
                <FileWarning className="w-4 h-4" />
                <span>Suspicious Link / File</span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                Safe link inspection and post-click malware containment.
              </p>
              <span className="mt-2 text-[11px] font-medium text-cyan-400/90 flex items-center gap-1">
                Triage & Scans <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </section>

        {/* Step 2: Five Core Threat Domains */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium text-[11px] px-1 flex-shrink-0">
            Threat Domains:
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

        {/* Chat Stream View */}
        <div className="flex-1 space-y-4 min-h-[360px]">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#0c121e] border border-cyan-800/60 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Shield className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-md relative group ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : message.isSecurityAlert
                      ? 'bg-rose-950/40 border border-rose-800/80 text-rose-200 rounded-bl-none'
                      : 'bg-[#0c121e] border border-slate-800/80 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Top message telemetry */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] opacity-75">
                    <span className="font-semibold tracking-wide">
                      {isUser ? 'OPERATOR' : 'CYBERGUARD // ADVISOR'}
                    </span>
                    <div className="flex items-center gap-2">
                      {message.source && !isUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700/60 text-slate-300 font-mono">
                          {message.source === 'grok-ai' ? '● GROK AI' : '● KNOWLEDGE BASE'}
                        </span>
                      )}
                      <span className="text-[10px] font-mono">{message.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white"
                          title="Copy guidance"
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
                  <div className="w-8 h-8 rounded-lg bg-cyan-800 flex items-center justify-center flex-shrink-0 mt-1 text-white font-semibold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#0c121e] border border-cyan-800 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="bg-[#0c121e] border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Streaming security analysis...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Threat Input Terminal */}
        <div className="sticky bottom-2 z-20 pt-2">
          {inputWarning && (
            <div className="mb-2 p-2.5 rounded-xl bg-rose-950/95 border border-rose-700 text-rose-200 text-xs flex items-start gap-2 shadow-xl backdrop-blur-md animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal font-medium">
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
            className="flex items-end gap-2 bg-[#0c121e]/95 backdrop-blur-md border border-slate-800 focus-within:border-cyan-500/80 rounded-2xl p-2 shadow-2xl transition-all"
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
              placeholder="Ask about a suspicious email, phone call, OTP request, or Wi-Fi security (Never type real secrets)..."
              rows={1}
              className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm md:text-base focus:ring-0 focus:outline-none resize-none px-2 py-1.5 max-h-32"
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium transition-all shadow-md flex-shrink-0"
              title="Send inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Realistic Fictional Prompts */}
          <div className="mt-2 flex flex-wrap gap-1.5 items-center justify-center text-[11px] text-slate-500">
            <span>Fictional Scenarios:</span>
            <button
              onClick={() => sendMessage('I received an urgent email saying my bank account was suspended. How do I verify if it is real?')}
              className="hover:text-cyan-400 transition-colors underline decoration-dotted"
            >
              "Fake bank email"
            </button>
            <span>•</span>
            <button
              onClick={() => sendMessage('Someone is calling claiming to be fraud prevention and demands an SMS code. What do I do?')}
              className="hover:text-cyan-400 transition-colors underline decoration-dotted"
            >
              "Caller asks for OTP"
            </button>
            <span>•</span>
            <button
              onClick={() => sendMessage('I accidentally clicked a strange link in an SMS message. Am I hacked?')}
              className="hover:text-cyan-400 transition-colors underline decoration-dotted"
            >
              "Clicked weird SMS link"
            </button>
          </div>
        </div>
      </main>

      {/* Official Portals Modal */}
      {showResources && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0c121e] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowResources(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Authoritative Reporting & Threat Portals</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              If you have experienced financial fraud, an account hijacking, or active extortion, report it through official law enforcement and protective agencies:
            </p>

            <div className="space-y-3">
              {OFFICIAL_RESOURCES.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-[#090d16] border border-slate-800/80 hover:border-cyan-700/60 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-cyan-400 group-hover:text-cyan-300">
                      {res.name}
                    </span>
                    {res.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
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
                Close Portals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grok AI Settings & Key Diagnostic Tool */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0c121e] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Grok API Configuration</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Connect your xAI Grok API key (from <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">console.x.ai</a>) to enable real-time streaming AI reasoning.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  xAI Grok API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={tempApiKey}
                    onChange={(e) => {
                      setTempApiKey(e.target.value);
                      setTestStatus('idle');
                      setTestMessage('');
                    }}
                    placeholder="xai-..."
                    className="w-full px-3 py-2 pr-10 rounded-xl bg-[#090d16] border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder-slate-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Stored securely in your browser&apos;s session memory. Never shared with third parties.
                </span>
              </div>

              {/* Model Choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    setTestStatus('idle');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 focus:outline-none"
                >
                  <option value="grok-2-latest">grok-2-latest (Balanced & High Accuracy)</option>
                  <option value="grok-2-mini">grok-2-mini (Ultra Fast Response)</option>
                  <option value="grok-beta">grok-beta</option>
                </select>
              </div>

              {/* Live Connection Test Button */}
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing' || !tempApiKey.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Verifying with xAI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Test & Verify Key Connection</span>
                    </>
                  )}
                </button>

                {/* Test Feedback Result */}
                {testStatus !== 'idle' && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                      testStatus === 'success'
                        ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                        : testStatus === 'error'
                        ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                        : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                    {testStatus === 'error' && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 font-mono text-[11px] leading-tight break-all">
                      {testMessage}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-cyan-600/20"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
