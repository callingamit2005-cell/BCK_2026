export type BlogPostMock = {
  id: number;
  slug: string;
  title: string;
  tag: string;
  date: string;
  excerpt: string;
  content: string;
};

export const blogPostMocks: BlogPostMock[] = [
  {
    id: 1,
    slug: "save-10000-every-month",
    title: "5 Easy Tricks to Save Rs10,000 Every Month",
    tag: "Savings",
    date: "Mar 1, 2026",
    excerpt:
      "Start building your emergency fund with these simple strategies that anyone can follow.",
    content: `# 5 Easy Tricks to Save Rs10,000 Every Month\n\nSaving money does not require extreme lifestyle changes. Start with fixed rules:\n\n1. Move a fixed amount to savings on salary day.\n2. Track all spending categories weekly.\n3. Set spending limits for food delivery and impulse buys.\n4. Repay high-interest debt first.\n5. Automate recurring bills to avoid late fees.\n\nConsistency matters more than perfection.`,
  },
  {
    id: 2,
    slug: "mutual-funds-for-beginners",
    title: "Understanding Mutual Funds for Beginners",
    tag: "Investing",
    date: "Feb 24, 2026",
    excerpt:
      "A complete beginner's guide to getting started with mutual fund SIPs in India.",
    content: `# Understanding Mutual Funds for Beginners\n\nMutual funds pool money from many investors and invest in diversified assets.\n\n- Equity funds: higher risk, higher long-term return potential.\n- Debt funds: lower volatility, suitable for stability.\n- Hybrid funds: balance between risk and return.\n\nChoose funds based on goals and time horizon, not short-term noise.`,
  },
  {
    id: 3,
    slug: "budget-like-a-pro-with-bachatkaro",
    title: "How to Budget Like a Pro with BachatKaro",
    tag: "Budgeting",
    date: "Feb 18, 2026",
    excerpt:
      "Master the 50/30/20 rule and track every rupee with our smart categorization.",
    content: `# How to Budget Like a Pro with BachatKaro\n\nA simple budget can be practical and realistic:\n\n- 50% needs\n- 30% wants\n- 20% savings and debt repayment\n\nReview your budget once per week and adjust categories based on actual spend.`,
  },
  {
    id: 4,
    slug: "tax-saving-tips-for-salaried-employees",
    title: "Tax Saving Tips for Salaried Employees",
    tag: "Tax",
    date: "Feb 10, 2026",
    excerpt:
      "Maximize your take-home salary with these legal tax-saving instruments.",
    content: `# Tax Saving Tips for Salaried Employees\n\nPlan deductions early in the financial year.\n\n- Review eligible deductions and exemptions.\n- Avoid last-minute tax planning.\n- Keep documentation ready for declarations.\n\nTax planning works best when aligned with long-term goals.`,
  },
];
