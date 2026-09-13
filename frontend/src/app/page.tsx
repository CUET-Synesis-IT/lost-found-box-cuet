export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">
          Phase 1
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          CUET Lost and Found Box
        </h1>
        <p className="mt-4 text-slate-600">
          The frontend is running. Authentication and application features will
          be added in later phases.
        </p>
      </section>
    </main>
  );
}
