import "dotenv/config";
import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
  },
  networks: {
    amoy: {
      type: "http",
      chainType: "l1",
      chainId: 80002,
      url: configVariable("AMOY_RPC_URL"),
      accounts: [configVariable("AMOY_PRIVATE_KEY")],
    },
    polygon: {
      type: "http",
      chainType: "l1",
      chainId: 137,
      url: configVariable("POLYGON_RPC_URL"),
      accounts: [configVariable("POLYGON_PRIVATE_KEY")],
    },
  },
});
