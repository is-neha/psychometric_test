export function ScoreGrid({ scores }: { scores: Record<string, Record<string, number>> }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {Object.entries(scores).map(([model, traits]) => (
        <div key={model} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-emerald-950">{model}</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(traits).sort((a, b) => b[1] - a[1]).map(([trait, score]) => (
              <div key={trait}>
                <div className="mb-1 flex justify-between text-sm"><span>{trait}</span><strong>{score}%</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${score}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
