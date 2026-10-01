import { JsonRpcProvider } from "ethers";
import { NETWORK } from "./contract";

export function createReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(NETWORK.rpcUrl, NETWORK.chainId, { staticNetwork: true });
}
