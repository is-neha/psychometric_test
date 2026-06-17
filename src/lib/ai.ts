import { summarizeScores } from "./scoring";

type Scores = Record<string, Record<string, number>>;

function fallbackReport(username: string, scores: Scores) {
  const top = (model: string, count = 3) =>
    Object.entries(scores[model] || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([name]) => name)
      .join(", ");

  return `PSYCHOMETRIC SUMMARY

User: ${username}

RIASEC
The strongest indicated interest areas are ${top("RIASEC") || "not yet available"}. These results describe preferences, not fixed ability or future success.

OCEAN PERSONALITY
The most prominent measured personality dimensions are ${top("OCEAN") || "not yet available"}. Interpret these scores in context and alongside direct discussion with the user.

HBDI THINKING STYLE
The currently indicated thinking preferences are ${top("HBDI") || "not yet available"}. This is a preference profile and should not be treated as a measure of intelligence.

EMOTIONAL INTELLIGENCE
The strongest indicated EQ areas are ${top("EQ") || "not yet available"}. Any lower-scoring areas can be treated as development opportunities rather than labels.

SUGGESTED CAREER DIRECTIONS
Explore career families that combine the user's leading RIASEC interests with their preferred HBDI working style. Confirm suggestions through counseling, academic performance, exposure activities, and the user's own goals.

ADMIN REVIEW NOTE
This is an automatically prepared draft. It must be reviewed and edited by an authorized administrator before publication. It is not a clinical diagnosis.`;
}

export async function generateAiDraft(username: string, scores: Scores) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return fallbackReport(username, scores);

  const instructions =
    process.env.AI_REPORT_INSTRUCTIONS ||
    "Write a balanced, age-appropriate psychometric report. Avoid diagnoses and deterministic claims. Include RIASEC, OCEAN, HBDI, EQ, strengths, development areas, and suggested career directions. State that results require professional review.";

  const response = await fetch(
    `${process.env.GROK_BASE_URL || "https://api.x.ai/v1"}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROK_MODEL || "grok-3-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: instructions },
          {
            role: "user",
            content: `Create a draft report for ${username} from these scores:\n${summarizeScores(scores)}`,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    return `${fallbackReport(username, scores)}\n\nAI provider error: ${response.status}. The administrator can retry after checking configuration.`;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || fallbackReport(username, scores);
}
