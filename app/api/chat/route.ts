import { NextRequest, NextResponse } from 'next/server';
import { checkSensitiveInput } from '@/lib/security-rules';
import {
  GROQ_SYSTEM_PROMPT,
  getRuleBasedResponse,
  getFallbackResponse,
} from '@/lib/knowledge';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// GET handler to check server status and whether an environment key is set
export async function GET() {
  const hasServerKey = Boolean(
    process.env.GROQ_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.XAI_API_KEY
  );
  return NextResponse.json({
    status: 'ok',
    provider: 'Groq',
    hasServerKey,
    supportedModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ],
  });
}

// POST handler for chat completions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      model = 'llama-3.3-70b-versatile',
      forceRuleEngine = false,
    } = body;

    const userMessages = messages.filter((m: ChatMessage) => m.role === 'user');
    const latestUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

    // 1. PRIVACY GUARDRAIL: Check for sensitive personal information (passwords, OTPs, cards)
    const sensitiveCheck = checkSensitiveInput(latestUserMsg);
    if (sensitiveCheck.hasSensitiveData && sensitiveCheck.warningMessage) {
      return NextResponse.json({
        role: 'assistant',
        content: sensitiveCheck.warningMessage,
        isSecurityAlert: true,
      });
    }

    // 2. Check if rule engine is requested or if emergency triage query is triggered directly
    if (forceRuleEngine) {
      const ruleResponse = getRuleBasedResponse(latestUserMsg) || getFallbackResponse(latestUserMsg);
      return NextResponse.json({
        role: 'assistant',
        content: ruleResponse,
        source: 'rule-engine',
      });
    }

    // 3. Resolve Groq API Key (Backend .env has priority, client header fallback)
    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.GROK_API_KEY ||
      process.env.XAI_API_KEY ||
      req.headers.get('x-groq-api-key') ||
      req.headers.get('x-grok-api-key') ||
      '';

    // 4. If no API Key is provided, use the fast rule-based engine
    if (!apiKey || apiKey.trim() === '') {
      const ruleResponse = getRuleBasedResponse(latestUserMsg) || getFallbackResponse(latestUserMsg);
      return NextResponse.json({
        role: 'assistant',
        content: ruleResponse,
        source: 'rule-engine',
        notice: 'Response generated via built-in cybersecurity knowledge engine (Add your Groq API key in .env or settings for AI mode).',
      });
    }

    // Filter conversation history to valid user/assistant turns
    const firstUserIndex = messages.findIndex((m: ChatMessage) => m.role === 'user');
    const conversationTurns = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;

    // 5. Call Groq API (OpenAI-compatible chat completions)
    const groqPayload = {
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: GROQ_SYSTEM_PROMPT },
        ...conversationTurns.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.3,
      max_tokens: 1024,
      stream: true,
    };

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(groqPayload),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);

      // Graceful fallback to rule-based engine with error notice
      const fallbackResponse = getRuleBasedResponse(latestUserMsg) || getFallbackResponse(latestUserMsg);
      return NextResponse.json({
        role: 'assistant',
        content: fallbackResponse,
        source: 'rule-engine-fallback',
        warning: `Groq API returned status ${groqResponse.status}. Served from CyberGuard local security knowledge base.`,
      });
    }

    // Stream SSE response back to client for ultra-fast perceived latency
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // Ignore partial chunks
            }
          }
        }
      },
    });

    return new Response(groqResponse.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content:
          '### ⚠️ Service Notice\n\nAn unexpected error occurred while processing your request. Please remember to never share passwords or sensitive details online. If dealing with an active security incident, refer to [CISA Resources](https://www.cisa.gov) or [FTC Report Fraud](https://reportfraud.ftc.gov).',
        isError: true,
      },
      { status: 500 }
    );
  }
}
