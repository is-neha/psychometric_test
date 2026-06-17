import Link from "next/link";
import { generateDraftAction, saveReportAction } from "@/app/actions";
import { ScoreGrid } from "@/components/ScoreGrid";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

export default async function AdminAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUser(Role.ADMIN);
  const { id } = await params;
  const attempt = await db.attempt.findUnique({
    where: { id },
    include: {
      user: true,
      questionnaire: true,
      report: true,
      responses: { include: { option: true, question: true } },
    },
  });
  if (!attempt) notFound();
  const scores = attempt.scoresJson ? JSON.parse(attempt.scoresJson) : {};
  return <Shell username={admin.username} role={admin.role}>
    <Link href={`/admin/users/${attempt.userId}`} className="text-sm font-semibold text-emerald-700">Back to {attempt.user.username}</Link>
    <div className="mt-5"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">User response review</p><h1 className="mt-2 text-3xl font-bold">{attempt.user.username}</h1><p className="mt-2 text-slate-500">{attempt.questionnaire.title} · {attempt.submittedAt?.toLocaleString()}</p></div>
    <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Score analysis</h2><ScoreGrid scores={scores} /></section>
    <section className="mt-10"><h2 className="text-xl font-bold">Question-by-question responses</h2>
      <div className="mt-4 space-y-3">{attempt.responses.map((response, index) => (
        <div key={response.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold">{index + 1}. {response.questionText}</p><p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"><strong>Selected:</strong> {response.optionText}</p>
          <p className="mt-2 text-xs text-slate-500"><strong>Admin interpretation:</strong> {response.option.adminNote || "None"} · {response.scoringSnapshot}</p>
        </div>
      ))}</div>
    </section>
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Final report</h2><p className="mt-1 text-sm text-slate-500">AI creates a draft. An administrator must edit and publish it.</p></div>
        <form action={generateDraftAction}><input type="hidden" name="attemptId" value={attempt.id} /><button className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">{attempt.report ? "Regenerate AI draft" : "Generate AI draft"}</button></form>
      </div>
      {attempt.report ? <form action={saveReportAction} className="mt-5"><input type="hidden" name="attemptId" value={attempt.id} />
        <textarea name="content" defaultValue={attempt.report.adminContent || attempt.report.aiDraft || ""} className="min-h-[520px] w-full rounded-xl border border-slate-200 p-4 font-mono text-sm leading-6" />
        <div className="mt-4 flex flex-wrap gap-3"><button name="intent" value="review" className="rounded-xl border border-emerald-800 px-5 py-3 font-semibold text-emerald-900">Save reviewed draft</button><button name="intent" value="publish" className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Publish to user</button>
          {attempt.report.status === "PUBLISHED" && <a href={`/api/reports/${attempt.id}/pdf`} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold">Download PDF</a>}
        </div>
      </form> : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No report draft yet. Grok will be used when `GROK_API_KEY` is set; otherwise the system creates a structured local draft.</p>}
    </section>
  </Shell>;
}
