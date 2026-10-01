"use client";

import { useEffect } from "react";
import { watchWallet } from "@/lib/wallet";

export function WalletWatcher() {
  useEffect(() => watchWallet(() => window.location.reload()), []);
  return null;
}
