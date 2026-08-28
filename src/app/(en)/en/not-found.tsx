import Link from "next/link";

export default function EnglishNotFound() {
  return <main className="grid flex-1 place-items-center px-5 py-20 text-center" id="main-content"><div><p className="text-label font-semibold text-corporate-blue">404</p><h1 className="mt-3 text-heading-xl font-semibold">Page not found</h1><p className="mx-auto mt-4 max-w-xl text-body-lg text-text-secondary">The address may be incorrect or the page may have moved.</p><Link className="mt-8 inline-flex min-h-12 items-center rounded-control bg-corporate-blue px-6 font-semibold text-white no-underline hover:bg-brand-navy" href="/en/">Return to Home</Link></div></main>;
}
