// /api/bands-summarize.js
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraphFeedback = "" } = await req.json();

    if (!paragraphFeedback.trim()) {
      return new Response(JSON.stringify({ error: "No paragraph feedback provided." }), { status: 400 });
    }

    // Extract all paragraph-level band scores
    const regex = /C:\s*(\d)[^\d]+L:\s*(\d)[^\d]+O:\s*(\d)/gi;
    const matches = [...paragraphFeedback.matchAll(regex)];

    if (matches.length === 0) {
      return new Response(JSON.stringify({
        bandAnalysis: "⚠️ No band scores detected in the paragraph feedback."
      }), { status: 200 });
    }

    let totalC = 0, totalL = 0, totalO = 0;
    matches.forEach(m => {
      totalC += parseInt(m[1]);
      totalL += parseInt(m[2]);
      totalO += parseInt(m[3]);
    });

    const avgC = totalC / matches.length;
    const avgL = totalL / matches.length;
    const avgO = totalO / matches.length;
    const overallAvg = (avgC + avgL + avgO) / 3;

    let level = "";
    if (overallAvg >= 6.5) level = "Level 5**";
    else if (overallAvg >= 5.5) level = "Level 5*";
    else if (overallAvg >= 4.5) level = "Level 5";
    else if (overallAvg >= 3.5) level = "Level 4";
    else if (overallAvg >= 2.5) level = "Level 3";
    else if (overallAvg >= 1.5) level = "Level 2";
    else level = "Level 1";

    const result = `
🧠 Summarizing band scores from paragraph feedback...

**Averages across all paragraphs:**
C: ${avgC.toFixed(1)}
L: ${avgL.toFixed(1)}
O: ${avgO.toFixed(1)}

🎯 Final Average: ${(overallAvg).toFixed(1)}
🎓 Predicted DSE Level: ${level}
`;

    return new Response(JSON.stringify({ bandAnalysis: result.trim() }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
