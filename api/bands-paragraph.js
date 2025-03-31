// /api/bands-paragraph.js
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraph = "", position = "body" } = await req.json();

    if (!paragraph.trim()) {
      return new Response(JSON.stringify({ paragraphAnalysis: "⚠️ Empty paragraph." }), { status: 400 });
    }

    const systemPrompt = "You are a strict HKDSE English teacher. For each paragraph of student writing, provide structured feedback ONLY in the format below.";

    const userMessage = `
Paragraph (${position}):
${paragraph.trim()}

Follow this exact format:

### Feedback on the Paragraph:

**Content:**
- Feedback on ideas, relevance, clarity, depth, or development.

**Language:**
- Feedback on grammar, vocabulary, tone, and sentence structure.

**Organisation:**
- Feedback on logical flow, structure, transitions, and coherence.

**Suggestion:**
- 1–2 concise suggestions to improve this paragraph to a higher level.
`;

    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "⚠️ No feedback generated.";

    return new Response(JSON.stringify({ paragraphAnalysis: analysis }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
