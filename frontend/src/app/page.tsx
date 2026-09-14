import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="grid-paper border-b border-line">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              Lost something on campus? Someone may have already found it.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/70">
              Report what you lost or found. We compare every new post against
              open reports and surface likely matches automatically, so you
              don&apos;t have to scroll through every listing yourself.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/posts/create"
                className="bg-blueprint px-5 py-3 text-sm font-semibold text-white hover:bg-blueprint-deep"
              >
                Report an item
              </Link>
              <Link
                href="/posts"
                className="border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-ink/40"
              >
                Browse open reports
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="border-l-4 border-flag-rust pl-4">
            <p className="font-mono text-xs text-ink/50">Step 1</p>
            <h2 className="mt-2 font-semibold text-ink">Post what happened</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Lost your wallet near the library, or found a set of keys by the
              cafeteria? Post it with a category, location, and time.
            </p>
          </div>
          <div className="border-l-4 border-flag-amber pl-4">
            <p className="font-mono text-xs text-ink/50">Step 2</p>
            <h2 className="mt-2 font-semibold text-ink">We check for matches</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Every lost report is compared against found reports (and vice
              versa) using description similarity, not just keyword search.
            </p>
          </div>
          <div className="border-l-4 border-blueprint pl-4">
            <p className="font-mono text-xs text-ink/50">Step 3</p>
            <h2 className="mt-2 font-semibold text-ink">Claim it, get it back</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Found a likely match? Submit a claim. The finder reviews it and
              approves the handoff - both posts close automatically.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
