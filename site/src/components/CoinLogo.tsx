import Image from "next/image";
import { BASE_PATH } from "@/lib/contract";

export function CoinLogo({ size = 28 }: { size?: number }) {
  return <Image src={`${BASE_PATH}/icon.svg`} alt="" width={size} height={size} loading="eager" />;
}
