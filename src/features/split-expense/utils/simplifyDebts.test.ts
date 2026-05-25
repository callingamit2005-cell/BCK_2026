/**
 * 🔒 REGRESSION SUITE: Settlement Engine
 * 🛡️ MANDATE: Protect financial integrity and ghost-member identity.
 */

import { describe, it, expect, vi } from 'vitest';
import { computeBalances, simplifyDebts } from './simplifyDebts';

describe('Settlement Engine Regression Protection', () => {

  const GHOST_MEMBER_1 = { id: 'm-ghost-1', name: 'Ghost One', user_id: null as any };
  const GHOST_MEMBER_2 = { id: 'm-ghost-2', name: 'Ghost Two', user_id: null as any };
  const REG_MEMBER_1 = { id: 'm-reg-1', name: 'Registered One', user_id: 'u-1' };
  const REG_MEMBER_2 = { id: 'm-reg-2', name: 'Registered Two', user_id: 'u-2' };

  const ALL_MEMBERS = [GHOST_MEMBER_1, GHOST_MEMBER_2, REG_MEMBER_1, REG_MEMBER_2];

  describe('computeBalances()', () => {

    it('should correctly handle a 100% ghost-member group', () => {
      const expenses = [{
        paidByMemberId: 'm-ghost-1',
        splits: [
          { member_id: 'm-ghost-1', shareAmount: 50 },
          { member_id: 'm-ghost-2', shareAmount: 50 }
        ]
      }];
      
      const balances = computeBalances(expenses, [GHOST_MEMBER_1, GHOST_MEMBER_2]);
      
      const b1 = balances.find(b => b.id === 'm-ghost-1');
      const b2 = balances.find(b => b.id === 'm-ghost-2');
      
      expect(b1.balance).toBe(50); // Paid 100, owes 50
      expect(b2.balance).toBe(-50); // Paid 0, owes 50
      expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0);
    });

    it('should correctly handle mixed registered + ghost groups', () => {
      const expenses = [
        {
          paidByMemberId: 'm-reg-1',
          splits: [
            { member_id: 'm-reg-1', shareAmount: 100 },
            { member_id: 'm-ghost-1', shareAmount: 100 }
          ]
        },
        {
          paidByMemberId: 'm-ghost-1',
          splits: [
            { member_id: 'm-reg-1', shareAmount: 50 },
            { member_id: 'm-ghost-1', shareAmount: 50 }
          ]
        }
      ];

      const balances = computeBalances(expenses, [REG_MEMBER_1, GHOST_MEMBER_1]);
      
      const reg = balances.find(b => b.id === 'm-reg-1');
      const ghost = balances.find(b => b.id === 'm-ghost-1');

      // Reg: Paid 200, owes (100 + 50) = 150. Balance = +50
      // Ghost: Paid 100, owes (100 + 50) = 150. Balance = -50
      expect(reg.balance).toBe(50);
      expect(ghost.balance).toBe(-50);
      expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0);
    });

    it('should maintain integer precision (paisa logic)', () => {
      const expenses = [{
        paidByMemberId: 'm-reg-1',
        splits: [
          { member_id: 'm-reg-1', shareAmount: 33.3333 },
          { member_id: 'm-reg-2', shareAmount: 33.3333 },
          { member_id: 'm-ghost-1', shareAmount: 33.3334 }
        ]
      }];

      const balances = computeBalances(expenses, [REG_MEMBER_1, REG_MEMBER_2, GHOST_MEMBER_1]);
      
      // Total amount = 33.3333 + 33.3333 + 33.3334 = 100
      // Reg1: Paid 100, owes 33 (Math.round). Paid 100, owes 33. Balance = 67
      // Note: computeBalances rounds splits. 33.3333 -> 33. 33.3334 -> 33.
      // TotalInPaisa = 33 + 33 + 33 = 99.
      // Reg1 Balance: 99 (paid) - 33 (owes) = 66
      // Reg2 Balance: 0 (paid) - 33 (owes) = -33
      // Ghost1 Balance: 0 (paid) - 33 (owes) = -33
      // 66 - 33 - 33 = 0.
      
      expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0);
    });

    it('should trigger console.error on invalid/missing member_id', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const expenses = [{
        paidByMemberId: 'm-reg-1',
        splits: [{ member_id: null as any, shareAmount: 100 }]
      }];

      computeBalances(expenses, [REG_MEMBER_1]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SETTLEMENT_CRITICAL]'));
      consoleSpy.mockRestore();
    });
  });

  describe('simplifyDebts()', () => {
    
    it('should simplify complex triangular debts', () => {
      // A owes B 100, B owes C 100 -> A owes C 100
      const balances = [
        { id: 'A', name: 'A', balance: -100 },
        { id: 'B', name: 'B', balance: 0 },
        { id: 'C', name: 'C', balance: 100 }
      ];

      const debts = simplifyDebts(balances);
      expect(debts).toHaveLength(1);
      expect(debts[0]).toEqual({ from: 'A', to: 'C', amount: 100 });
    });

    it('should handle floating point micro-remainders', () => {
      const balances = [
        { id: 'A', name: 'A', balance: -100.0000001 },
        { id: 'B', name: 'B', balance: 100.0000001 }
      ];

      const debts = simplifyDebts(balances);
      expect(debts).toHaveLength(1);
      expect(debts[0].amount).toBeCloseTo(100);
    });

    it('should produce zero debts when all are settled', () => {
      const balances = [
        { id: 'A', name: 'A', balance: 0.005 },
        { id: 'B', name: 'B', balance: -0.005 }
      ];

      const debts = simplifyDebts(balances);
      expect(debts).toHaveLength(0);
    });

    it('should strictly use member.id for from/to fields', () => {
      const balances = [
        { id: 'm-ghost-id', name: 'Ghost', balance: -100, user_id: null },
        { id: 'm-reg-id', name: 'Reg', balance: 100, user_id: 'u-1' }
      ];

      const debts = simplifyDebts(balances);
      expect(debts[0].from).toBe('m-ghost-id');
      expect(debts[0].to).toBe('m-reg-id');
    });
  });

  describe('Invariant Assertions', () => {
    it('must always sum to zero within epsilon', () => {
      const expenses = Array.from({ length: 100 }, (_, i) => ({
        paidByMemberId: ALL_MEMBERS[i % 4].id,
        splits: ALL_MEMBERS.map(m => ({ member_id: m.id, shareAmount: Math.random() * 1000 }))
      }));

      const balances = computeBalances(expenses, ALL_MEMBERS);
      const total = balances.reduce((s, b) => s + b.balance, 0);
      expect(Math.abs(total)).toBeLessThan(0.01);
    });

    it('must prevent duplicate settlement identities', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const duplicateMembers = [
        { id: 'dup', name: 'One', user_id: null },
        { id: 'dup', name: 'Two', user_id: null }
      ];
      
      computeBalances([], duplicateMembers as any);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate member identity'),
        'dup'
      );
      consoleSpy.mockRestore();
    });
  });
});