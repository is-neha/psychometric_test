import { acceptConsentAction } from "@/app/actions";

export function ConsentModal() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-w-xl rounded-3xl bg-white p-7 shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Consent required
        </p>
        <h2 className="text-2xl font-bold text-slate-950">Before you begin</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p>Your answers and test history will be stored so authorized administrators can review them and prepare a report.</p>
          <p>This assessment describes preferences and tendencies. It is not a medical diagnosis and should not be the only basis for education or career decisions.</p>
          <p>An administrator may delete your response history. Published reports are visible to you and can be downloaded as PDF.</p>
        </div>
        <form action={acceptConsentAction} className="mt-6">
          <button className="w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
            I understand and consent
          </button>
        </form>
      </div>
    </div>
  );
}
