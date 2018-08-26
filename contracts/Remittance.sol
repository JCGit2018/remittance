pragma solidity ^0.4.24;

import "./Suspendable.sol";
import "./SafeMath.sol";

contract Remittance is Suspendable {
    using SafeMath for uint256;

    bytes32 hash;
    uint    timestamp;
    uint256 value;

    event LogRemittanceCreation(address indexed owner);
    event LogRemittanceDeposit(address indexed sender, uint256 deposit);
    event LogRemittanceWithdraw(address caller, uint256 indexed amount);


    constructor(bytes32 _receiverHash, bytes32 _exchangeShopHash) public {
        timestamp = block.timestamp;
        hash = keccak256(abi.encodePacked(timestamp, address(this), _receiverHash, _exchangeShopHash));

        emit LogRemittanceCreation(msg.sender);
    }

    function deposit() public payable onlyOwner whenNotSuspended {
        require(msg.value != 0, "deposit: value cannot be zero");

        value = msg.value;

        emit LogRemittanceDeposit(msg.sender, value);
    }

    function whitdraw(bytes32 _receiverHash, bytes32 _exchangeShopHash) public payable whenNotSuspended {

        bytes32 check = keccak256(abi.encodePacked(timestamp, address(this), _receiverHash, _exchangeShopHash));

        require(hash == check, "whitdraw: invalid hash"); // check the hash before checking value
        require(value >0 , "whitdraw: no deposit");

        uint256 amount = value;
        value = 0;

        emit LogRemittanceWithdraw(msg.sender, amount);
        
        msg.sender.transfer(amount);
    }

}