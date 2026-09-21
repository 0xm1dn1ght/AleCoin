import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AleCoinModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", 1_000_000n * 10n ** 18n);
  const initialOwner = m.getParameter("initialOwner");

  const token = m.contract("AleCoin", [initialSupply, initialOwner]);

  return { token };
});
