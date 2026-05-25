export interface AIProvider {
  name: string;
  generateResponse(prompt: string, context: any): Promise<string | null>;
}

export interface AIContext {
  income: number;
  totalExpense: number;
  unnecessaryTotal: number;
  projectedSavings: number;
  language: 'en' | 'hi' | 'hinglish';
}
