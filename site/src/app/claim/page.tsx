import { Suspense } from "react";
import { ClaimView } from "./claim-view";

export default function ClaimPage() {
  return (
    <Suspense fallback={<p>Загрузка…</p>}>
      <ClaimView />
    </Suspense>
  );
}
