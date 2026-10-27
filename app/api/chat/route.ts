import { NextRequest, NextResponse } from 'next/server';
import { checkSensitiveInput } from '@/lib/security-rules';
import {
  GROK_SYSTEM_PROMPT,
  getRuleBasedResponse,
  getFallbackResponse,
} from '@/lib/knowledge';


interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// GET handler to check server status and whether an environment key is set
export async function GET() {
  const hasServerKey = Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
  return NextResponse.json({
    status: 'ok',
    hasServerKey,
    supportedModels: ['grok-2-latest', 'grok-2-mini', 'grok-beta'],
  });
}

// POST handler for chat completions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], model = 'grok-2-latest', forceRuleEngine = false } = body;

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

    // 3. Resolve Grok API Key (Backend .env has priority, client header fallback)
    const apiKey =
      process.env.GROK_API_KEY ||
      process.env.XAI_API_KEY ||
      req.headers.get('x-grok-api-key') ||
      '';

    // 4. If no Grok API Key is provided, use the fast rule-based engine
    if (!apiKey || apiKey.trim() === '') {
      const ruleResponse = getRuleBasedResponse(latestUserMsg) || getFallbackResponse(latestUserMsg);
      return NextResponse.json({
        role: 'assistant',
        content: ruleResponse,
        source: 'rule-engine',
        notice: 'Response generated via built-in cybersecurity knowledge engine (Add your Grok API key in .env or settings for AI mode).',
      });
    }

    // 5. Call xAI Grok API (OpenAI-compatible chat completions)
    const xaiPayload = {
      model: model || 'grok-2-latest',
      messages: [
        { role: 'system', content: GROK_SYSTEM_PROMPT },
        ...messages.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.3, // Low temperature for high factual accuracy and consistency
      max_tokens: 1000,
      stream: true,
    };

    const xaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(xaiPayload),
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text();
      console.error('xAI API error:', xaiResponse.status, errorText);

      // Graceful fallback to rule-based engine if Grok API returns error/quota/auth issue
      const fallbackResponse = getRuleBasedResponse(latestUserMsg) || getFallbackResponse(latestUserMsg);
      return NextResponse.json({
        role: 'assistant',
        content: fallbackResponse,
        source: 'rule-engine-fallback',
        warning: `Grok API returned status ${xaiResponse.status}. Served from CyberGuard local security knowledge base.`,
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
              // Ignore partial JSON parse chunks
            }
          }
        }
      },
    });

    return new Response(xaiResponse.body?.pipeThrough(transformStream), {
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
