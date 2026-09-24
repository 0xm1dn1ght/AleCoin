import type { Metadata } from "next";
import { AdminForm } from "./admin-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main>
      <h1>AleCoin — выдача наград</h1>
      <AdminForm />
    </main>
  );
}
