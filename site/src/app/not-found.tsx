import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-sm px-6 py-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Страница не найдена</h1>
          <p className="mt-2 text-muted">Такой страницы на сайте нет.</p>
          <Link href="/" className="mt-6 inline-block text-amber hover:underline">
            На главную
          </Link>
        </Panel>
      </main>
    </>
  );
}
