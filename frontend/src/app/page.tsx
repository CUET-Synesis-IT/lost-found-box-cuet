import { AuthControls } from "@/components/auth/auth-controls";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">MVP</p>
          <AuthControls />
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          CUET Lost and Found Box
        </h1>
        <p className="mt-4 text-slate-600">
          The application is running. Sign in with a CUET institutional account
          to verify the authentication flow.
        </p>
      </section>
    </main>
  );
}
