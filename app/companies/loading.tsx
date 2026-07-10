export default function Loading() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12" aria-busy="true">
      <p className="eyebrow">Harness Moat Assessor</p>
      <div className="mt-3 h-9 w-48 rounded-sharp bg-line/40 animate-pulse" />
      <div className="mt-10 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel p-4">
            <div className="h-5 w-40 rounded-sharp bg-line/40 animate-pulse" />
            <div className="mt-3 h-3 w-64 rounded-sharp bg-line/30 animate-pulse" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading companies…</span>
    </main>
  );
}
