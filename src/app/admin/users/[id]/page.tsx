import Link from "next/link";
import { deleteUserHistoryAction } from "@/app/actions";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUser(Role.ADMIN);
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: { attempts: { include: { questionnaire: true, report: true, _count: { select: { responses: true } } }, orderBy: { startedAt: "desc" } } },
  });
  if (!user) notFound();
  return <Shell username={admin.username} role={admin.role}>
    <Link href="/admin" className="text-sm font-semibold text-emerald-700">Back to admin</Link>
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold">{user.username}</h1><p className="mt-2 text-slate-500">Consent: {user.consentAt ? user.consentAt.toLocaleString() : "Not accepted"}</p></div>
      <form action={deleteUserHistoryAction}><input type="hidden" name="userId" value={user.id} /><button className="rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700">Delete all history</button></form>
    </div>
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {user.attempts.length === 0 ? <p className="p-6 text-slate-500">No attempts.</p> : user.attempts.map((attempt) => (
        <Link key={attempt.id} href={`/admin/attempts/${attempt.id}`} className="flex justify-between border-b border-slate-100 p-5 last:border-0 hover:bg-slate-50">
          <div><p className="font-semibold">{attempt.questionnaire.title}</p><p className="mt-1 text-xs text-slate-500">{attempt.submittedAt?.toLocaleString()} · {attempt._count.responses} responses</p></div>
          <span className="text-xs font-bold text-emerald-700">{attempt.report?.status || "NO REPORT"}</span>
        </Link>
      ))}
    </div>
  </Shell>;
}
