import { AIProvider, AIContext } from './types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';

  async generateResponse(prompt: string, context: AIContext): Promise<string | null> {
    console.log("GeminiProvider placeholder called.");
    return null; // Future integration
  }
}
