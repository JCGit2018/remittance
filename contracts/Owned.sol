pragma solidity ^0.4.24;

contract Owned {
    address public owner;

    event LogOwnedOwnerChanged(address indexed oldOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function changeOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "invalid owner addreess");
        require(newOwner != owner, "the owner is the same");

        address oldOwner = owner;
        owner = newOwner;

        emit LogOwnedOwnerChanged(oldOwner, newOwner);
    }
}
