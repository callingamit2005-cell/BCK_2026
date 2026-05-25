export interface DashboardVoiceParseResult {
  amount?: number;
  paymentMode?: "UPI" | "Cash" | "Net Banking" | "Card";
  category?: "Food" | "Shopping" | "Bills" | "Travel" | "Others";
  notes?: string;
}

export interface GroupMemberLike {
  id: string;
  name: string;
}

export interface GroupVoiceParseResult {
  amount?: number;
  paidByMemberId?: string;
  paidByName?: string;
  title?: string;
}

const PAYMENT_KEYWORDS: Array<{ value: DashboardVoiceParseResult["paymentMode"]; tokens: string[] }> = [
  { value: "UPI", tokens: ["upi", "gpay", "phonepe", "paytm"] },
  { value: "Cash", tokens: ["cash", "nakad"] },
  { value: "Card", tokens: ["card", "credit", "debit", "visa", "mastercard"] },
  { value: "Net Banking", tokens: ["net banking", "netbanking", "neft", "rtgs", "imps"] },
];

const CATEGORY_KEYWORDS: Array<{ value: DashboardVoiceParseResult["category"]; tokens: string[] }> = [
  { value: "Food", tokens: ["food", "dinner", "lunch", "breakfast", "snacks", "snack"] },
  { value: "Shopping", tokens: ["grocery", "groceries", "shopping", "mall", "amazon", "flipkart"] },
  { value: "Bills", tokens: ["bill", "electricity", "water", "internet", "wifi", "recharge", "rent", "emi"] },
  { value: "Travel", tokens: ["petrol", "fuel", "diesel", "taxi", "cab", "uber", "ola", "bus", "train", "travel"] },
  { value: "Others", tokens: ["other", "misc"] },
];

const GROUP_NOISE_WORDS = new Set([
  "paid",
  "by",
  "for",
  "the",
  "a",
  "an",
  "with",
  "from",
  "on",
  "at",
  "in",
]);

const normalizeText = (text: string): string =>
  text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const detectAmount = (text: string): number | undefined => {
  const match = text.match(/\b\d+(\.\d+)?\b/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

const tokenize = (text: string): string[] => normalizeText(text).split(" ").filter(Boolean);

const levenshtein = (a: string, b: string): number => {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
};

const fuzzyFindMember = (
  tokens: string[],
  membersList: GroupMemberLike[],
): GroupVoiceParseResult => {
  let bestMember: GroupMemberLike | undefined;
  let bestScore = -1;

  for (const member of membersList) {
    const normalizedName = normalizeText(member.name);
    const nameTokens = normalizedName.split(" ").filter(Boolean);
    for (const spoken of tokens) {
      for (const nameToken of nameTokens) {
        let score = 0;
        if (spoken === nameToken) score = 100;
        else if (spoken.startsWith(nameToken) || nameToken.startsWith(spoken)) score = 85;
        else {
          const distance = levenshtein(spoken, nameToken);
          if (distance <= 1) score = 75;
          else if (distance === 2 && nameToken.length >= 5) score = 60;
        }
        if (score > bestScore) {
          bestScore = score;
          bestMember = member;
        }
      }
    }
  }

  if (!bestMember || bestScore < 75) return {};
  return {
    paidByMemberId: bestMember.id,
    paidByName: bestMember.name,
  };
};

export const parseDashboardVoice = (text: string): DashboardVoiceParseResult => {
  const normalized = normalizeText(text);
  const amount = detectAmount(normalized);

  const paymentMode = PAYMENT_KEYWORDS.find((entry) =>
    entry.tokens.some((token) => normalized.includes(token)),
  )?.value;

  const category = CATEGORY_KEYWORDS.find((entry) =>
    entry.tokens.some((token) => normalized.includes(token)),
  )?.value;

  let notes = normalized;
  if (amount !== undefined) {
    notes = notes.replace(new RegExp(`\\b${amount}\\b`, "g"), " ");
  }
  if (paymentMode) {
    const tokens = PAYMENT_KEYWORDS.find((entry) => entry.value === paymentMode)?.tokens ?? [];
    for (const token of tokens) {
      notes = notes.replace(new RegExp(`\\b${token}\\b`, "g"), " ");
    }
  }
  if (category) {
    const tokens = CATEGORY_KEYWORDS.find((entry) => entry.value === category)?.tokens ?? [];
    for (const token of tokens) {
      notes = notes.replace(new RegExp(`\\b${token}\\b`, "g"), " ");
    }
  }
  notes = notes.replace(/\s+/g, " ").trim();

  return {
    amount,
    paymentMode,
    category,
    notes: notes || undefined,
  };
};

export const parseGroupVoice = (
  text: string,
  membersList: GroupMemberLike[],
): GroupVoiceParseResult => {
  const normalized = normalizeText(text);
  const amount = detectAmount(normalized);
  const tokens = tokenize(normalized);
  const memberMatch = fuzzyFindMember(tokens, membersList);

  let title = normalized;
  if (amount !== undefined) {
    title = title.replace(new RegExp(`\\b${amount}\\b`, "g"), " ");
  }
  if (memberMatch.paidByName) {
    const nameTokens = tokenize(memberMatch.paidByName);
    for (const nt of nameTokens) {
      title = title.replace(new RegExp(`\\b${nt}\\b`, "g"), " ");
    }
  }
  for (const noise of GROUP_NOISE_WORDS) {
    title = title.replace(new RegExp(`\\b${noise}\\b`, "g"), " ");
  }
  title = title.replace(/\s+/g, " ").trim();

  return {
    amount,
    paidByMemberId: memberMatch.paidByMemberId,
    paidByName: memberMatch.paidByName,
    title: title || undefined,
  };
};

