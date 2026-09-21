// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract AleCoin is ERC20, Ownable, EIP712 {
    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address to,uint256 amount,uint256 nonce)");

    mapping(uint256 => bool) public usedNonces;

    event RewardClaimed(address indexed to, uint256 amount, uint256 nonce);

    constructor(uint256 initialSupply, address initialOwner)
        ERC20("AleCoin", "ALE")
        Ownable(initialOwner)
        EIP712("AleCoin", "1")
    {
        _mint(initialOwner, initialSupply);
    }

    function claimReward(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(!usedNonces[nonce], "AleCoin: nonce already used");

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == owner(), "AleCoin: invalid signature");

        usedNonces[nonce] = true;
        _transfer(owner(), to, amount);

        emit RewardClaimed(to, amount, nonce);
    }
}
