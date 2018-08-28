pragma solidity ^0.4.24;

import "./Suspendable.sol";
import "./SafeMath.sol";

contract Remittance is Suspendable {
    using SafeMath for uint256;

    uint256 value;
    uint256 public maxDeltaBlocks;  

    struct Deposit {
        uint256 amount;
        uint256 limit;
    }
    mapping(bytes32 => Deposit) public deposits;

    event LogRemittanceCreation(address indexed owner, uint256 maxDeltaBlocks);
    event LogRemittanceDeposit(bytes32 hash, address indexed sender, uint256 indexed deposit, uint256 indexed blockLimit);
    event LogRemittanceWithdraw(bytes32 hash, address indexed caller, uint256 indexed amount);
    event LogRemittanceClaim(address indexed caller, uint256 indexed amount);

    constructor(uint256 _maxDeltaBlocks) public {
//        hash = keccak256(abi.encodePacked(timestamp, address(this), _receiverHash, _exchangeShopHash));
        maxDeltaBlocks = _maxDeltaBlocks;
        emit LogRemittanceCreation(msg.sender, maxDeltaBlocks);
    }

    function deposit(bytes32 hash, uint256 deltaBlocks) public payable onlyOwner whenNotSuspended {
        require(0 < deltaBlocks && deltaBlocks <= maxDeltaBlocks, "deposit: deltaBlock out of range");
        require(msg.value != 0, "deposit: value cannot be zero");

        Deposit storage dep = deposits[hash];
        dep.amount  = msg.value;
        dep.limit   = block.number + deltaBlocks;
        
        emit LogRemittanceDeposit(hash, msg.sender, dep.amount, dep.limit);
    }

    function whitdraw(bytes32 receiverHash, bytes32 exchangeShopHash) public whenNotSuspended {
        bytes32 hash = makeHash(receiverHash, exchangeShopHash, msg.sender);
        
        Deposit storage dep = deposits[hash];

        require(dep.amount > 0, "withdraw: no deposit available");
        require(block.number <= dep.limit, "withdraw: block.number greater than limit");

        uint256 amount = dep.amount;
        dep.amount = 0;

        emit LogRemittanceWithdraw(hash, msg.sender, amount);
        
        msg.sender.transfer(amount);
    }
    
    function claim(bytes32 hash) public onlyOwner whenNotSuspended {
        Deposit storage dep = deposits[hash];

        require(dep.amount > 0 , "claim: no deposit");
        require(block.number > dep.limit, "claim: block.number less than limit");
        
        uint256 amount = dep.amount;
        dep.amount = 0;

        emit LogRemittanceClaim(msg.sender, amount);

        msg.sender.transfer(amount);
    }

    function makeHash(bytes32 _receiverHash, bytes32 _exchangeShopHash, address exchangeShop) public constant returns(bytes32 madeHash) {
        return keccak256(abi.encodePacked(address(this), _receiverHash, _exchangeShopHash, exchangeShop));
    }

}
