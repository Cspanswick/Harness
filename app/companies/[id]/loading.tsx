export default function Loading() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12" aria-busy="true">
      <div className="h-4 w-24 rounded-sharp bg-line/40 animate-pulse" />
      <div className="mt-8 h-10 w-64 rounded-sharp bg-line/40 animate-pulse" />
      <div className="mt-8 panel p-6">
        <div className="h-6 w-32 rounded-sharp bg-line/40 animate-pulse" />
        <div className="mt-4 h-5 w-full rounded-sharp bg-line/30 animate-pulse" />
      </div>
      <div className="mt-6 panel p-6">
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full rounded-sharp bg-line/30 animate-pulse" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading assessment…</span>
    </main>
  );
}
