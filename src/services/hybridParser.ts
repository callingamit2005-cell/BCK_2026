import { localExpenseParser } from "./localParser";
import { aiExpenseParser } from "./aiParser";

export async function hybridExpenseParser(text: string) {
  // 🟢 try local first
  const local = localExpenseParser(text);

  if (local && local.amount) {
    console.log("⚡ Parsed locally");
    return local;
  }

  // 🟣 fallback to AI
  console.log("🧠 Using AI parser");
  return await aiExpenseParser(text);
}