import { startAttemptAction } from "@/app/actions";
import { Shell } from "@/components/Shell";
import { TestWizard } from "@/components/TestWizard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("USER");
  if (!user.consentAt) redirect("/dashboard");
  const { id } = await params;
  
  const test = await db.questionnaire.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!test) notFound();

  const attempt = await db.attempt.findFirst({
    where: { userId: user.id, questionnaireId: test.id, status: "IN_PROGRESS" },
    include: { responses: true },
  });

  if (!attempt) {
    return (
      <Shell username={user.username} role={user.role}>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            {test.audience}
          </p>
          <h1 className="mt-2 text-3xl font-bold dark:text-slate-50">{test.title}</h1>
          <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">{test.description}</p>
          
          <form action={async () => {
            "use server";
            await startAttemptAction(test.id);
            revalidatePath(`/tests/${test.id}`);
          }}>
            <button className="mt-8 rounded-xl bg-sky-700 dark:bg-slate-700 px-6 py-4 font-bold text-white hover:bg-sky-600 dark:hover:bg-slate-600 shadow-sm transition-colors">
              Start Assessment
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  const initialResponses = attempt.responses.reduce((acc, r) => {
    acc[r.questionId] = r.optionId;
    return acc;
  }, {} as Record<string, string>);

  return (
    <Shell username={user.username} role={user.role}>
      <TestWizard attemptId={attempt.id} questionnaire={test} initialResponses={initialResponses} />
    </Shell>
  );
}
