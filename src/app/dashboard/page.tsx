import Link from "next/link";
import { ConsentModal } from "@/components/ConsentModal";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    const [users, tests, attempts, drafts] = await Promise.all([
      db.user.count({ where: { role: "USER" } }),
      db.questionnaire.count(),
      db.attempt.count({ where: { status: "SUBMITTED" } }),
      db.report.count({ where: { status: { not: "PUBLISHED" } } }),
    ]);
    return (
      <Shell username={user.username} role={user.role}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Administration</p><h1 className="mt-2 text-3xl font-bold">Overview</h1></div>
          <Link href="/admin" className="rounded-xl bg-emerald-900 px-5 py-3 text-center font-semibold text-white">Open admin workspace</Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Users", users], ["Questionnaires", tests], ["Submitted attempts", attempts], ["Reports awaiting publication", drafts]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></div>
          ))}
        </div>
      </Shell>
    );
  }

  const [questionnaires, attempts] = await Promise.all([
    db.questionnaire.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    db.attempt.findMany({ where: { userId: user.id }, include: { questionnaire: true, report: true }, orderBy: { startedAt: "desc" } }),
  ]);
  return (
    <Shell username={user.username} role={user.role}>
      {!user.consentAt && <ConsentModal />}
      <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Your assessments</p><h1 className="mt-2 text-3xl font-bold">Hello, {user.username}</h1><p className="mt-2 text-slate-500">Take a new assessment or revisit your previous attempts and published reports.</p></div>
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {questionnaires.map((test) => (
          <div key={test.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{test.audience}</span>
            <h2 className="mt-4 text-xl font-bold">{test.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{test.description}</p>
            <Link href={`/tests/${test.id}`} className="mt-5 inline-block rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Start new attempt</Link>
          </div>
        ))}
      </section>
      <section className="mt-10"><h2 className="text-xl font-bold">Previous history</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {attempts.length === 0 ? <p className="p-6 text-slate-500">No attempts yet.</p> : attempts.map((attempt) => (
            <Link key={attempt.id} href={`/attempts/${attempt.id}`} className="flex items-center justify-between border-b border-slate-100 p-5 last:border-0 hover:bg-slate-50">
              <div><p className="font-semibold">{attempt.questionnaire.title}</p><p className="mt-1 text-xs text-slate-500">{attempt.submittedAt?.toLocaleString() || "In progress"}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${attempt.report?.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{attempt.report?.status === "PUBLISHED" ? "Report published" : "Under review"}</span>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
