import { appEnv } from '@/config/env';
import { GroqProvider } from './providers/groqProvider';
import { GeminiProvider } from './providers/geminiProvider';
import { OpenAIProvider } from './providers/openaiProvider';
import { AIProvider, AIContext } from './providers/types';

/**
 * 📊 [AI_TELEMETRY] session-scoped observability (In-memory only)
 * 🛡️ MEMORY_SAFE: Uses primitive counters, no list accumulation.
 */
export class AITelemetry {
  static metrics = {
    successful_responses: 0,
    timeout_failures: 0,
    parse_failures: 0,
    fallback_activations: 0,
    auth_failures: 0,
    rate_limits: 0,
    server_failures: 0,
    total_latency_ms: 0,
    max_latency_ms: 0,
    cancellation_count: 0,
    request_count: 0
  };

  static startRequest() {
    this.metrics.request_count++;
    return performance.now();
  }

  static endRequest(startTime: number, success: boolean, isTimeout = false) {
    const duration = performance.now() - startTime;
    this.metrics.total_latency_ms += duration;
    this.metrics.max_latency_ms = Math.max(this.metrics.max_latency_ms, duration);
    if (success) {
      this.metrics.successful_responses++;
    } else if (isTimeout) {
      this.metrics.timeout_failures++;
    }
  }

  static logParseFailure() { this.metrics.parse_failures++; }
  static logFallback() { this.metrics.fallback_activations++; }
  static logCancellation() { this.metrics.cancellation_count++; }
  static logAuthFailure() { this.metrics.auth_failures++; }
  static logRateLimit() { this.metrics.rate_limits++; }
  static logServerFailure() { this.metrics.server_failures++; }

  static getAverageLatency() {
    const totalRequests = this.metrics.successful_responses + this.metrics.timeout_failures;
    return totalRequests > 0 ? (this.metrics.total_latency_ms / totalRequests) : 0;
  }
  
  static resetMetrics() {
    Object.keys(this.metrics).forEach(key => (this.metrics as any)[key] = 0);
  }
}

class AIRouter {
  private providers: Record<string, AIProvider> = {
    groq: new GroqProvider(),
    gemini: new GeminiProvider(),
    openai: new OpenAIProvider(),
  };

  private cache: Record<string, { response: string; timestamp: number }> = {};
  private CACHE_TTL = 1000 * 60 * 60; // 1 hour

  async generateAIResponse(prompt: string, context: AIContext): Promise<string | null> {
    const cacheKey = `${prompt}_${context.language}_${context.totalExpense}`;
    
    // Check cache
    if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].timestamp < this.CACHE_TTL)) {
      return this.cache[cacheKey].response;
    }

    const providerName = appEnv.aiProvider || 'groq';
    const provider = this.providers[providerName];

    if (!provider) {
      console.error(`AI Provider ${providerName} not found.`);
      AITelemetry.logFallback();
      return null;
    }

    const startTime = AITelemetry.startRequest();
    try {
      const response = await this.withTimeout(provider.generateResponse(prompt, context), 15000);
      
      if (response) {
        AITelemetry.endRequest(startTime, true);
        this.cache[cacheKey] = { response, timestamp: Date.now() };
        return response;
      }
      
      AITelemetry.endRequest(startTime, false);
      return null;
    } catch (err: any) {
      const isTimeout = err.message === 'AI Request Timeout';
      AITelemetry.endRequest(startTime, false, isTimeout);
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`AI Router error with ${providerName}:`, err);
      }
      return null;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), ms))
    ]);
  }
}

export const aiRouter = new AIRouter();
