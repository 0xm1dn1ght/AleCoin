// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AleCoin is ERC20, Ownable {
    constructor(uint256 initialSupply, address initialOwner)
        ERC20("AleCoin", "ALE")
        Ownable(initialOwner)
    {
        _mint(initialOwner, initialSupply);
    }
}
