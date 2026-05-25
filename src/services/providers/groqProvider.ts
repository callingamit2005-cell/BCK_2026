import { appEnv } from '@/config/env';
import { AIProvider, AIContext } from './types';
import { AITelemetry } from '../aiRouter';

export class GroqProvider implements AIProvider {
  name = 'groq';

  async generateResponse(prompt: string, context: AIContext): Promise<string | null> {
    const apiKey = appEnv.groqApiKey;

    // Enterprise default model
    const model = appEnv.groqModel || 'llama-3.3-70b-versatile';

    // Enterprise timeout
    const timeoutMs = 15000;

    // Boot diagnostic
    console.info('[AI_PROVIDER_BOOT]', {
      provider: 'groq',
      model
    });

    if (!apiKey) {
      console.warn('[GROQ_PROVIDER_MISSING_KEY]');
      return null;
    }

    // Abort protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,

            messages: [
              {
                role: 'system',
                content: `
You are a banking-grade Indian financial advisor.

RULES:
- deterministic responses only
- no storytelling
- no motivational fluff
- no markdown
- no speculation
- concise Hinglish
- practical advice only
- maximum 25 words per field
- output STRICT valid JSON only

Financial Context:
Income: ${context.income}
Expenses: ${context.totalExpense}
Wasteful Spend: ${context.unnecessaryTotal}
Language: ${context.language}
                `.trim(),
              },
              {
                role: 'user',
                content: prompt,
              },
            ],

            // Structured output enforcement
            response_format: { type: 'json_object' },

            // Enterprise deterministic mode
            temperature: 0.0,
            top_p: 0.1,

            // Controlled generation budget
            max_tokens: 400,
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'N/A');

        console.error('[GROQ_PROVIDER_FAILURE]', {
          status: response.status,
          statusText: response.statusText,
          body: errorText?.substring(0, 500),
          model,
          timeoutMs,
        });

        // Enterprise classification
        if (response.status === 401 || response.status === 403) {
          AITelemetry.logAuthFailure();
        } else if (response.status === 429) {
          AITelemetry.logRateLimit();
        } else if (response.status >= 500) {
          AITelemetry.logServerFailure();
        }

        return null;
      }

      const data = await response.json();

      // Defensive provider schema validation
      const content =
        data?.choices?.[0]?.message?.content?.trim?.() || null;

      if (!content) {
        console.warn('[GROQ_PROVIDER_EMPTY_RESPONSE]', {
          model,
        });

        return null;
      }

      return content;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err?.name === 'AbortError') {
        console.warn('[GROQ_PROVIDER_TIMEOUT]', {
          timeoutMs,
          model,
        });
      } else {
        console.error('[GROQ_PROVIDER_CRITICAL_ERROR]', {
          message: err?.message || 'Unknown error',
          model,
        });
      }

      return null;
    }
  }
}