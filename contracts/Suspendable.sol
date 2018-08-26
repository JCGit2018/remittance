pragma solidity ^0.4.24;

import "./Owned.sol";

contract Suspendable is Owned {
    event LogSuspended(address indexed sender);
    event LogResumed(address indexed sender);

    bool public suspended;

    modifier whenNotSuspended() {
        require(!suspended);
        _;
    }

    modifier whenSuspended() {
        require(suspended);
        _;
    }

    function suspend() onlyOwner whenNotSuspended public {
        suspended = true;
        emit LogSuspended(msg.sender);
    }

    function resume() onlyOwner whenSuspended public {
        suspended = false;
        emit LogResumed(msg.sender);
    }
}