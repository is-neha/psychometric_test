import Link from "next/link";
import { addQuestionAction } from "@/app/actions";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

export default async function QuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUser(Role.ADMIN);
  const { id } = await params;
  const test = await db.questionnaire.findUnique({
    where: { id },
    include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } } },
  });
  if (!test) notFound();
  const firstSection = test.sections[0];
  return <Shell username={admin.username} role={admin.role}>
    <Link href="/admin" className="text-sm font-semibold text-emerald-700">Back to admin</Link>
    <h1 className="mt-5 text-3xl font-bold">{test.title}</h1><p className="mt-2 text-slate-500">{test.audience} · Version {test.version}</p>
    {firstSection && <form action={addQuestionAction} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-bold">Add question to {firstSection.title}</h2>
      <input type="hidden" name="questionnaireId" value={test.id} /><input type="hidden" name="sectionId" value={firstSection.id} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <input name="model" required placeholder="Model, e.g. RIASEC" className="rounded-xl border border-slate-200 px-4 py-3" />
        <input name="trait" placeholder="Trait measured" className="rounded-xl border border-slate-200 px-4 py-3" />
      </div>
      <textarea name="text" required placeholder="Question text" className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3" />
      <textarea name="options" required placeholder={'One option per line:\nA|Option text|{"RIASEC":{"Realistic":3}}|Admin-only note'} className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm" />
      <button className="mt-4 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white">Add question</button>
    </form>}
    <div className="mt-8 space-y-8">{test.sections.map((section) => <section key={section.id}><h2 className="text-xl font-bold">{section.title}</h2><div className="mt-4 space-y-3">{section.questions.map((question, index) => (
      <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">{index + 1}. {question.text}</p><p className="mt-1 text-xs font-bold text-emerald-700">{question.model} · {question.trait}</p>
        <div className="mt-3 space-y-2">{question.options.map((option) => <div key={option.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{option.label}.</strong> {option.text}<span className="ml-2 text-xs text-slate-400">{option.scoringJson}</span></div>)}</div>
      </div>
    ))}</div></section>)}</div>
  </Shell>;
}
