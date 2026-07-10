import Link from "next/link";

const LAYERS = [
  { n: 1, name: "Instruction", kind: "flow", swatch: "bg-layer-1" },
  { n: 2, name: "Context", kind: "flow", swatch: "bg-layer-2" },
  { n: 3, name: "Control", kind: "stock", swatch: "bg-layer-3" },
  { n: 4, name: "Evaluation", kind: "stock", swatch: "bg-layer-4" },
  { n: 5, name: "Learning loop", kind: "stock", swatch: "bg-layer-5" },
] as const;

export default function Home() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <p className="eyebrow">The Harness Moat Model</p>

      <h1 className="mt-4 font-serif text-4xl sm:text-5xl leading-tight text-ink">
        Every rival rents the same intelligence.
        <br />
        The harness is what differs.
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
        Assess where a company&rsquo;s value actually sits across the five
        layers &mdash; and whether it is monetised as stock that accumulates, or
        flow that is consumed and must be re-earned every month.
      </p>

      <section className="mt-12 panel p-6">
        <p className="eyebrow">The five layers, weak &rarr; strong</p>
        <ul className="mt-4 flex flex-col gap-3">
          {LAYERS.map((layer) => (
            <li key={layer.n} className="flex items-center gap-4">
              <span
                aria-hidden
                className={`${layer.swatch} h-6 w-6 shrink-0 rounded-sharp`}
              />
              <span className="font-mono text-xs text-ink-soft w-6">
                L{layer.n}
              </span>
              <span className="flex-1 text-ink">{layer.name}</span>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-sharp border-[1.5px] ${
                  layer.kind === "flow"
                    ? "border-layer-1 text-layer-1"
                    : "border-layer-5 text-layer-5"
                }`}
              >
                {layer.kind}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 max-w-xl text-ink-soft leading-relaxed">
        Flow businesses must out-innovate everyone forever. Stock businesses get
        stronger by existing. Moats are made of stock.
      </p>

      <Link
        href="/companies"
        className="mt-10 inline-block bg-accent text-paper font-medium px-6 py-3 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink"
      >
        View assessments
      </Link>
    </main>
  );
}
