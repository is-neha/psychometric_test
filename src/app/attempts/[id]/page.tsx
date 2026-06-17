import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(Role.USER);
  const { id } = await params;
  const attempt = await db.attempt.findFirst({ where: { id, userId: user.id }, include: { questionnaire: true, report: true } });
  if (!attempt) notFound();
  const published = attempt.report?.status === "PUBLISHED";
  return <Shell username={user.username} role={user.role}>
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">Back to dashboard</Link>
      <div className="mt-5 rounded-3xl bg-emerald-950 p-8 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">{published ? "Report ready" : "Submitted successfully"}</p>
        <h1 className="mt-3 text-3xl font-bold">{attempt.questionnaire.title}</h1><p className="mt-3 text-emerald-100/70">Attempt submitted {attempt.submittedAt?.toLocaleString()}</p>
      </div>
      {published ? <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Administrator-approved report</h2><p className="mt-1 text-sm text-slate-500">Published {attempt.report?.publishedAt?.toLocaleString()}</p></div><a href={`/api/reports/${attempt.id}/pdf`} className="rounded-xl bg-emerald-900 px-5 py-3 text-center font-semibold text-white">Download PDF</a></div>
        <div className="mt-7 whitespace-pre-wrap text-sm leading-7 text-slate-700">{attempt.report?.adminContent}</div>
      </section> : <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-7"><h2 className="font-bold text-amber-950">Your report is under review</h2><p className="mt-2 text-sm leading-6 text-amber-900">An administrator can see your responses and score analysis. The final report will appear here only after review and publication.</p></section>}
    </div>
  </Shell>;
}
