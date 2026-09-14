import { AuthControls } from "@/components/auth/auth-controls";

/** Authentication-only placeholder; dashboard features are implemented later. */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Authenticated area</h1>
          <AuthControls />
        </div>
        <p className="mt-4 text-slate-600">
          Your CUET session is active. Dashboard, posts, and claims are not implemented yet.
        </p>
      </div>
    </main>
  );
}
