import { AIProvider, AIContext } from './types';

export class OpenAIProvider implements AIProvider {
  name = 'openai';

  async generateResponse(prompt: string, context: AIContext): Promise<string | null> {
    console.log("OpenAIProvider placeholder called.");
    return null; // Future integration
  }
}
