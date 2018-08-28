pragma solidity ^0.4.24;

import "./Suspendable.sol";
import "./SafeMath.sol";

contract Remittance is Suspendable {
    using SafeMath for uint256;

    uint256 public maxDeltaBlocks; 
    uint256 public commission;
    uint256 public fees;

    struct Deposit {
        uint256 amount;
        uint256 limit;
        address payer;
    }
    mapping(bytes32 => Deposit) public deposits;

    event LogRemittanceCreation(address indexed owner, uint256 maxDeltaBlocks);
    event LogRemittanceCommissionChanged(uint256 indexed oldCommission, uint256 indexed newCommission);
    event LogRemittanceDeposit(address indexed sender, uint256 indexed deposit, uint256 indexed blockLimit);
    event LogRemittanceWithdraw(address indexed caller, uint256 indexed amount);
    event LogRemittanceClaim(address indexed caller, uint256 indexed amount);
    event LogRemittanceCollectFees(address indexed caller, uint256 fees);

    constructor(uint256 _commission, uint256 _maxDeltaBlocks) public {
        commission     = _commission;
        maxDeltaBlocks = _maxDeltaBlocks;

        emit LogRemittanceCreation(msg.sender, maxDeltaBlocks);
    }

    function setCommission(uint256 newCommission) public onlyOwner whenNotSuspended {
        require(commission != newCommission, "setCommission: new commission equal to the old one");

        uint256 oldCommission = commission;
        commission = newCommission;

        emit LogRemittanceCommissionChanged(oldCommission, newCommission);        
    }

    function deposit(bytes32 hash, uint256 deltaBlocks) public payable whenNotSuspended {
        require(0 < deltaBlocks && deltaBlocks <= maxDeltaBlocks, "deposit: deltaBlock out of range");
        require(msg.value != 0, "deposit: value cannot be zero");

        Deposit storage dep = deposits[hash];

        require(dep.payer == 0 || dep.payer == msg.sender, "deposit: value cannot be zero");

        uint256 amount = dep.amount.add(msg.value);

        // do the commission be payed for every deposit or just at withdraw? Ask a bank clerk...
        require(amount > commission, "deposit not enough to pay commission");

        dep.payer  = msg.sender;
        dep.amount = amount;
        dep.limit  = block.number + deltaBlocks; // renews the limit
        
        emit LogRemittanceDeposit(msg.sender, amount, dep.limit);
    }

    function whitdraw(bytes32 receiverHash, bytes32 exchangeShopHash) public whenNotSuspended {
        bytes32 hash = makeHash(receiverHash, exchangeShopHash, msg.sender);

        Deposit storage dep = deposits[hash];

        require(dep.amount > 0, "withdraw: no deposit available");
        require(block.number <= dep.limit, "withdraw: block.number greater than limit");

        fees = fees.add(commission);
        uint256 amount = dep.amount.sub(commission);
        dep.payer = 0; // free the deposit
        dep.amount = 0;

        emit LogRemittanceWithdraw(msg.sender, amount);
        
        msg.sender.transfer(amount);
    }
    
    function claim(bytes32 hash) public whenNotSuspended {
        Deposit storage dep = deposits[hash];

        require(msg.sender == dep.payer, "claim: msg.sender is not the deposit owner");
        require(dep.amount > 0 , "claim: no deposit");
        require(block.number > dep.limit, "claim: block.number less than limit");
        
        uint256 amount = dep.amount;
        dep.payer  = 0; // free the deposit
        dep.amount = 0;

        emit LogRemittanceClaim(msg.sender, amount);

        msg.sender.transfer(amount);
    }

    function collectFees() public onlyOwner whenNotSuspended {
        require(fees > 0, "collectFees: fee amount is zero");

        uint256 feeAmount = fees;
        fees = 0;

        emit LogRemittanceCollectFees(msg.sender, feeAmount);

        msg.sender.transfer(feeAmount);
    }

    function makeHash(bytes32 _receiverHash, bytes32 _exchangeShopHash, address exchangeShop) public constant returns(bytes32 madeHash) {
        return keccak256(abi.encodePacked(address(this), _receiverHash, _exchangeShopHash, exchangeShop));
    }

}
