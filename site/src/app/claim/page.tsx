import { Suspense } from "react";
import { ClaimView } from "./claim-view";

export default function ClaimPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-muted">Загрузка…</p>}>
      <ClaimView />
    </Suspense>
  );
}
