export const CONTRACT_ADDRESS = "0x44e8b28c3b059EeAb4C84d78bffe1808067997b5";

export const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function claimReward(address to, uint256 amount, uint256 nonce, bytes signature)",
  "function usedNonces(uint256 nonce) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event RewardClaimed(address indexed to, uint256 amount, uint256 nonce)",
] as const;

export const NETWORK = {
  chainId: 80002,
  chainIdHex: "0x13882",
  chainName: "Polygon Amoy Testnet",
  rpcUrl: "https://polygon-amoy.g.alchemy.com/v2/alch__BseOViqmTEQINk_lYPHs",
  blockExplorerUrl: "https://amoy.polygonscan.com",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
};

export const BASE_PATH = "/AleCoin";
