pragma solidity ^0.4.24;

import "./Suspendable.sol";
import "./SafeMath.sol";

contract Remittance is Suspendable {
    using SafeMath for uint256;

    bytes32 hash;
    uint    timestamp;
    uint256 value;
    uint256 public maxDeltaBlocks;  
    uint256 public blockLimit;  

    event LogRemittanceCreation(address indexed owner);
    event LogRemittanceDeposit(address indexed sender, uint256 indexed deposit, uint256 indexed blockLimit);
    event LogRemittanceWithdraw(address indexed caller, uint256 indexed amount, uint256 indexed blockNumber);
    event LogRemittanceClaim(address indexed caller, uint256 indexed amount, uint256 indexed blockNumber);

    constructor(bytes32 _receiverHash, bytes32 _exchangeShopHash, uint256 _maxDeltaBlocks) public {
        timestamp = block.timestamp;
        hash = keccak256(abi.encodePacked(timestamp, address(this), _receiverHash, _exchangeShopHash));
        maxDeltaBlocks = _maxDeltaBlocks;
        emit LogRemittanceCreation(msg.sender);
    }

    function deposit(uint256 deltaBlocks) public payable onlyOwner whenNotSuspended {
        require(0 < deltaBlocks && deltaBlocks <= maxDeltaBlocks, "deposit: deltaBlock out of range");
        require(msg.value != 0, "deposit: value cannot be zero");

        value = msg.value;
        blockLimit = block.number + deltaBlocks;
        
        emit LogRemittanceDeposit(msg.sender, value, blockLimit);
    }

    function whitdraw(bytes32 _receiverHash, bytes32 _exchangeShopHash) public whenNotSuspended {
        bytes32 check = keccak256(abi.encodePacked(timestamp, address(this), _receiverHash, _exchangeShopHash));

        require(hash == check, "whitdraw: invalid hash"); // check the hash before checking value
        require(block.number <= blockLimit, "withdraw: block.number greater than limit");
        require(value > 0 , "whitdraw: no deposit");

        uint256 amount = value;
        value = 0;

        emit LogRemittanceWithdraw(msg.sender, amount, block.number);
        
        msg.sender.transfer(amount);
    }
    
    function claim() public onlyOwner {
        require(block.number > blockLimit, "claim: block.number less than limit");
        require(value > 0 , "claim: no deposit");
        
        uint256 amount = value;

        value = 0;

        emit LogRemittanceClaim(msg.sender, amount, block.number);

        msg.sender.transfer(amount);
    }
}
