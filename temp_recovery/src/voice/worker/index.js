export default {
  async fetch(request, env, ctx) {
    // ✅ CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      const body = await request.json();
      const text = body.text || "";

      // 🔥 AI parsing
      const result = await parseWithAI(text, env);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};

/**
 * Parse expense text using Workers AI + fallback
 */
async function parseWithAI(text, env) {
  const prompt = `
Extract expense details from the following text. Return a JSON object with these fields:
- amount: number (if present)
- title: string (short description)
- paidBy: string (person who paid, if mentioned)
- category: string or null (e.g., Food, Travel, Shopping, Bills, Others)
- paymentMode: string or null (e.g., Cash, UPI, Card, Net Banking)
- split: "equal" or "unequal" (if mentioned)

Text: "${text}"

Only output JSON, no other text.
`;

  const model = "@cf/meta/llama-3-8b-instruct";
  let aiResponse;
  try {
    aiResponse = await env.AI.run(model, { prompt, stream: false });
  } catch (e) {
    console.error("AI error, falling back to regex", e);
    const amountMatch = text.match(/\d+/);
    return {
      amount: amountMatch ? Number(amountMatch[0]) : undefined,
      title: text,
      paidBy: undefined,
      category: null,
      paymentMode: null,
      split: "equal",
    };
  }

  const output = aiResponse.response;
  const jsonMatch = output.match(/\{.*\}/s);
  if (!jsonMatch) {
    const amountMatch = text.match(/\d+/);
    return {
      amount: amountMatch ? Number(amountMatch[0]) : undefined,
      title: text,
      paidBy: undefined,
      category: null,
      paymentMode: null,
      split: "equal",
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    const amountMatch = text.match(/\d+/);
    return {
      amount: amountMatch ? Number(amountMatch[0]) : undefined,
      title: text,
      paidBy: undefined,
      category: null,
      paymentMode: null,
      split: "equal",
    };
  }

  return {
    amount: parsed.amount ? Number(parsed.amount) : undefined,
    title: parsed.title || text,
    paidBy: parsed.paidBy || undefined,
    category: parsed.category || null,
    paymentMode: parsed.paymentMode || null,
    split: parsed.split === "unequal" ? "unequal" : "equal",
  };
}