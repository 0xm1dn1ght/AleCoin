import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

async function deployFixture() {
  const [owner, friend, other] = await ethers.getSigners();
  const initialSupply = ethers.parseEther("1000000");
  const token = await ethers.deployContract("AleCoin", [initialSupply, owner.address]);
  return { token, owner, friend, other, initialSupply };
}

describe("AleCoin", function () {
  describe("deployment", function () {
    it("sets name and symbol", async function () {
      const { token } = await deployFixture();
      expect(await token.name()).to.equal("AleCoin");
      expect(await token.symbol()).to.equal("ALE");
    });

    it("mints the full initial supply to the owner", async function () {
      const { token, owner, initialSupply } = await deployFixture();
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("sets the deployer-specified address as owner", async function () {
      const { token, owner } = await deployFixture();
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("standard transfers", function () {
    it("allows the owner to transfer tokens to another address", async function () {
      const { token, owner, friend } = await deployFixture();
      const amount = ethers.parseEther("100");

      await expect(token.transfer(friend.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, friend.address, amount);

      expect(await token.balanceOf(friend.address)).to.equal(amount);
    });
  });
});
