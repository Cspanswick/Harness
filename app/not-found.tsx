import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 w-full max-w-md mx-auto px-6 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-serif text-3xl text-ink">Not found</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        That company or assessment doesn&rsquo;t exist, or you followed a stale link.
      </p>
      <Link
        href="/companies"
        className="mt-8 inline-block bg-ink text-paper font-medium px-6 py-3 rounded-sharp border-[1.5px] border-ink offset-shadow offset-shadow-hover focus-ink"
      >
        Back to companies
      </Link>
    </main>
  );
}
