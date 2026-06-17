import Link from "next/link";
import { createAccountAction, createQuestionnaireAction, deleteUserHistoryAction, importQuestionnaireAction } from "@/app/actions";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export default async function AdminPage() {
  const admin = await requireUser(Role.ADMIN);
  const [users, questionnaires, attempts] = await Promise.all([
    db.user.findMany({ where: { role: "USER" }, include: { _count: { select: { attempts: true } } }, orderBy: { createdAt: "desc" } }),
    db.questionnaire.findMany({ include: { _count: { select: { attempts: true } } }, orderBy: { createdAt: "desc" } }),
    db.attempt.findMany({ where: { status: "SUBMITTED" }, include: { user: true, questionnaire: true, report: true }, orderBy: { submittedAt: "desc" }, take: 30 }),
  ]);
  return (
    <Shell username={admin.username} role={admin.role}>
      <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Admin workspace</p><h1 className="mt-2 text-3xl font-bold">Manage assessments and reports</h1></div>

      <section className="mt-8 grid gap-5 xl:grid-cols-3">
        <form action={createAccountAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Create account</h2>
          <div className="mt-4 space-y-3">
            <input name="username" required placeholder="Username" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            <select name="role" className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="USER">User</option><option value="ADMIN">Administrator</option></select>
            <button className="w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white">Create account</button>
          </div>
        </form>
        <form action={createQuestionnaireAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Create questionnaire</h2>
          <div className="mt-4 space-y-3">
            <input name="title" required placeholder="Questionnaire title" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            <input name="audience" required placeholder="Audience" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            <input name="section" required placeholder="First section" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            <textarea name="description" placeholder="Description" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            <button className="w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white">Create and add questions</button>
          </div>
        </form>
        <form action={importQuestionnaireAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Import Excel questionnaire</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">Headers: Questionnaire, Audience, Section, Model, Trait, Question, Option Label, Option Text, Scoring JSON, Admin Note.</p>
          <input name="file" type="file" accept=".xlsx" required className="mt-5 w-full rounded-xl border border-dashed border-slate-300 p-4 text-sm" />
          <button className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Upload Excel</button>
        </form>
      </section>

      <section className="mt-10"><h2 className="text-xl font-bold">Users</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {users.map((user) => <div key={user.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 last:border-0 sm:flex-row sm:items-center">
            <Link href={`/admin/users/${user.id}`} className="font-semibold hover:text-emerald-700">{user.username}<span className="ml-3 text-xs font-normal text-slate-500">{user._count.attempts} attempts</span></Link>
            <form action={deleteUserHistoryAction}><input type="hidden" name="userId" value={user.id} /><button className="text-sm font-semibold text-red-700">Delete response history</button></form>
          </div>)}
        </div>
      </section>

      <section className="mt-10"><h2 className="text-xl font-bold">Questionnaires</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{questionnaires.map((test) => (
          <Link key={test.id} href={`/admin/questionnaires/${test.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-500">
            <p className="font-bold">{test.title}</p><p className="mt-1 text-sm text-slate-500">{test.audience} · Version {test.version} · {test._count.attempts} attempts</p>
          </Link>
        ))}</div>
      </section>

      <section className="mt-10"><h2 className="text-xl font-bold">Recent user responses</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">{attempts.map((attempt) => (
          <Link key={attempt.id} href={`/admin/attempts/${attempt.id}`} className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 last:border-0 hover:bg-slate-50 sm:flex-row sm:items-center">
            <div><p className="font-semibold">{attempt.user.username} · {attempt.questionnaire.title}</p><p className="mt-1 text-xs text-slate-500">{attempt.submittedAt?.toLocaleString()}</p></div>
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">{attempt.report?.status || "No draft"}</span>
          </Link>
        ))}</div>
      </section>
    </Shell>
  );
}
