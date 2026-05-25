import type { MemberBalance, Debt } from '../types';

export function computeBalances(
  expenses: { paidByMemberId: string; splits: { memberId: string; shareAmount: number }[] }[],
  members: { id: string; name: string }[]
): MemberBalance[] {
  const map: Record<string, { paid: number; owes: number }> = {};
  members.forEach(m => { map[m.id] = { paid: 0, owes: 0 }; });

  expenses.forEach(exp => {
    const total = exp.splits.reduce((s, sp) => s + sp.shareAmount, 0);
    if (map[exp.paidByMemberId]) map[exp.paidByMemberId].paid += total;
    exp.splits.forEach(sp => {
      if (map[sp.memberId]) map[sp.memberId].owes += sp.shareAmount;
    });
  });

  return members.map(m => ({
    memberId: m.id,
    name: m.name,
    paid: Math.round((map[m.id]?.paid || 0) * 100) / 100,
    owes: Math.round((map[m.id]?.owes || 0) * 100) / 100,
    net: Math.round(((map[m.id]?.paid || 0) - (map[m.id]?.owes || 0)) * 100) / 100,
  }));
}

export function simplifyDebts(balances: MemberBalance[]): Debt[] {
  const debtors = balances.filter(b => b.net < -0.01).map(b => ({ ...b, rem: -b.net }));
  const creditors = balances.filter(b => b.net > 0.01).map(b => ({ ...b, rem: b.net }));
  debtors.sort((a, b) => b.rem - a.rem);
  creditors.sort((a, b) => b.rem - a.rem);

  const debts: Debt[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].rem, creditors[j].rem);
    if (amt > 0.01) {
      debts.push({
        from: debtors[i].memberId, fromName: debtors[i].name,
        to: creditors[j].memberId, toName: creditors[j].name,
        amount: Math.round(amt * 100) / 100,
      });
    }
    debtors[i].rem -= amt;
    creditors[j].rem -= amt;
    if (debtors[i].rem < 0.01) i++;
    if (creditors[j].rem < 0.01) j++;
  }
  return debts;
}
