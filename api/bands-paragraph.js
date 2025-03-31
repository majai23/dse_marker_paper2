// /api/bands-paragraph.js
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraph = "", position = "body" } = await req.json();
    const text = paragraph.trim();

    if (!text) {
      return new Response(JSON.stringify({ paragraphAnalysis: "⚠️ Empty paragraph." }), { status: 400 });
    }

    const lower = text.toLowerCase();

    // Detect if paragraph is a formal salutation
    const isSalutation = /^dear\s+(sir|madam|sir\/madam|sir or madam)/i.test(text) || lower.startsWith("to whom it may concern");

    // Detect if paragraph is a formal closing
    const isClosing = /^(yours\s+(faithfully|sincerely)|best regards|kind regards|respectfully)/i.test(lower);

    // Detect if paragraph is just a standalone sentence without elaboration
    const isStandalone = text.split(" ").length < 12 && !text.includes(".") && !text.includes("?") && !text.includes("!");

    if (isSalutation) {
      return new Response(JSON.stringify({
        paragraphAnalysis: `### Feedback on the Paragraph:\nThis is a formal salutation. It is appropriate and polite, and matches the tone of a formal letter. No detailed paragraph analysis is required.`
      }), { status: 200 });
    }

    if (isClosing) {
      return new Response(JSON.stringify({
        paragraphAnalysis: `### Feedback on the Paragraph:\nThis is a complimentary close. It is properly used for a formal letter. No detailed paragraph analysis is necessary.`
      }), { status: 200 });
    }

    if (isStandalone) {
      return new Response(JSON.stringify({
        paragraphAnalysis: `### Feedback on the Paragraph:\nThis appears to be a standalone sentence. It may be too brief for full analysis. Consider whether it connects clearly with the paragraph before and after.`
      }), { status: 200 });
    }

    // Default GPT feedback flow
    const systemPrompt = "You are a strict HKDSE English teacher. For each paragraph of student writing, provide structured feedback ONLY in the format below.";

    const userMessage = `
Paragraph (${position}):
${text}

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
