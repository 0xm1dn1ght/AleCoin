import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ClaimView } from "./claim-view";

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <p className="p-10 text-center text-muted">Загрузка…</p>
        </>
      }
    >
      <ClaimView />
    </Suspense>
  );
}
