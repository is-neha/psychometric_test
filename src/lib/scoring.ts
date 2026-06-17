type ScoreMap = Record<string, Record<string, number>>;

export function calculateScores(scoringSnapshots: string[]) {
  const totals: ScoreMap = {};
  const counts: ScoreMap = {};

  for (const snapshot of scoringSnapshots) {
    const mapping = JSON.parse(snapshot) as ScoreMap;
    for (const [model, traits] of Object.entries(mapping)) {
      totals[model] ??= {};
      counts[model] ??= {};
      for (const [trait, value] of Object.entries(traits)) {
        totals[model][trait] = (totals[model][trait] || 0) + value;
        counts[model][trait] = (counts[model][trait] || 0) + 1;
      }
    }
  }

  const normalized: ScoreMap = {};
  for (const [model, traits] of Object.entries(totals)) {
    normalized[model] = {};
    const max = Math.max(...Object.values(traits), 1);
    for (const [trait, value] of Object.entries(traits)) {
      if (model === "OCEAN" || model === "EQ") {
        normalized[model][trait] = Math.round(
          (value / Math.max(counts[model][trait] * 5, 1)) * 100,
        );
      } else {
        normalized[model][trait] = Math.round((value / max) * 100);
      }
    }
  }
  return normalized;
}

export function summarizeScores(scores: ScoreMap) {
  return Object.entries(scores)
    .map(([model, traits]) => {
      const ranked = Object.entries(traits).sort((a, b) => b[1] - a[1]);
      return `${model}: ${ranked.map(([trait, score]) => `${trait} ${score}%`).join(", ")}`;
    })
    .join("\n");
}
