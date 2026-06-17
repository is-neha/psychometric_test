import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUser()) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-lg font-bold">Psychometric Test</div>
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">Understand preferences</p>
          <h1 className="mt-5 text-5xl font-bold leading-tight">Thoughtful assessments. Human-reviewed reports.</h1>
          <p className="mt-6 text-lg leading-8 text-emerald-100/75">
            Complete assigned questionnaires, preserve every attempt, and receive reports only after administrator review.
          </p>
        </div>
        <p className="text-sm text-emerald-100/60">For guidance and reflection, not clinical diagnosis.</p>
      </section>
      <section className="grid place-items-center bg-white p-6">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold text-emerald-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Sign in to continue</h2>
          <p className="mt-3 text-slate-500">Use the username and password provided by your administrator.</p>
          {error && <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <form action={loginAction} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold">
              Username
              <input name="username" required autoComplete="username" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700" />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700" />
            </label>
            <button className="w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800">Sign in</button>
          </form>
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            Demo: <strong>admin / admin123</strong> or <strong>student / student123</strong>. Change these before deployment.
          </div>
        </div>
      </section>
    </main>
  );
}
