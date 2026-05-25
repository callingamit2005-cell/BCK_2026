import type { SplitType, SplitResult } from '../types';

interface SplitInput {
  amount: number;
  splitType: SplitType;
  members: { memberId: string; name: string }[];
  customValues?: Record<string, number>;
}

export function calculateSplit(input: SplitInput): SplitResult[] {
  const { amount, splitType, members, customValues = {} } = input;

  if (!members.length || amount <= 0) return [];

  switch (splitType) {
    case 'equal': {
      const share = Math.round((amount / members.length) * 100) / 100;
      return members.map(m => ({ memberId: m.memberId, name: m.name, shareAmount: share }));
    }
    case 'unequal':
      return members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        shareAmount: Math.round((customValues[m.memberId] || 0) * 100) / 100,
      }));
    case 'percentage':
      return members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        shareAmount: Math.round((amount * (customValues[m.memberId] || 0)) / 100 * 100) / 100,
      }));
    case 'shares': {
      const totalShares = Object.values(customValues).reduce((s, v) => s + v, 0) || 1;
      return members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        shareAmount: Math.round((amount * (customValues[m.memberId] || 0)) / totalShares * 100) / 100,
      }));
    }
    default:
      return [];
  }
}
