Promise = require("bluebird");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

web3.eth.expectedExceptionPromise = require("../utils/expectedException.js");

// Import the smart contracts
const Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {
    const MAX_GAS = 3000000;
    const AMOUNT = web3.toWei(0.007, 'ether'); // deposit value

    const EXCHANGE_HASH = web3.sha3("exchangeSecret");
    const BENEFICIARY_HASH   = web3.sha3("beneficiarySecret");
    const MAX_DELTA_BLOCKS   = 100;

    console.log(accounts);

    var exchange;
    var owner;
    before("check accounts number", function() {
        assert.isAtLeast(accounts.length, 2, "not enough accounts");
        [owner, exchange] = accounts;
    });

    describe("Try migration", function() {
        var instance;
        before("should deploy Remittance and get the instance", function() {
            return Remittance.new(MAX_DELTA_BLOCKS, { from: owner, gas: MAX_GAS })
                .then(function(_instance) {
                    instance = _instance;
                });
        });
        it("should start with proper values", function() {
           return instance.maxDeltaBlocks()
                .then(_maxDeltaBlocks => {
                    assert.equal(
                        _maxDeltaBlocks.toString(10),
                        "" + MAX_DELTA_BLOCKS,
                        "should have MAX_DELTA_BLOCKS");
                });
        });
    });

    describe("Try  makeHash", function() {
        var instance;
        var rightHash;
        before("should deploy Remittance, get the instance and right hash", function() {
            return Remittance.new(MAX_DELTA_BLOCKS, { from: owner, gas: MAX_GAS })
                .then(_instance => {
                    instance = _instance;
                    return instance.makeHash(BENEFICIARY_HASH, EXCHANGE_HASH, exchange);
                }).then(_hash => {
                    rightHash = _hash;
                });
        });

        it("should fails if provide wrong parameter for evaluate hash", function() {
            return instance.makeHash(web3.sha3(""), EXCHANGE_HASH, exchange)
                .then(_hash => {
                    assert.notEqual(_hash, rightHash, "Beneficiary hash is ignored in hash calculation");
                    return instance.makeHash(BENEFICIARY_HASH, web3.sha3(""), exchange);
                })
                .then(_hash => {
                    assert.notEqual(_hash, rightHash, "Exchange hash is ignored in hash calculation");
                    return instance.makeHash(BENEFICIARY_HASH, EXCHANGE_HASH, 0);
                    assert.notEqual(_hash, rightHash, "Exchange address is ignored in hash calculation");
                });
        });
    });
    

    describe("Try  deposit", function() {
        const deltaBlocks = 1;

        var instance;
        var rightHash;
        before("should deploy Remittance, get the instance and right hash", function() {
            return Remittance.new(MAX_DELTA_BLOCKS, { from: owner, gas: MAX_GAS })
                .then(_instance => {
                    instance = _instance;
                    return instance.makeHash(BENEFICIARY_HASH, EXCHANGE_HASH, exchange);
                }).then(_hash => {
                    rightHash = _hash;
                });
        });

        it("should fail if the value is zero", function() {
            return instance.deposit.call(rightHash, deltaBlocks, {from: owner, value: 0, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the deltaBlocks is zero", function() {
            return instance.deposit.call(rightHash, 0, {from: owner, value: 0, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the deltaBlocks greater than limit is zero", function() {
            return instance.deposit.call(rightHash, MAX_DELTA_BLOCKS + 1, {from: owner, value: 0, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the sender is not the owner ", function() {
            return instance.deposit.call(rightHash, deltaBlocks, {from: exchange, value: AMOUNT, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should deposit eth ", function() {
            return instance.deposit(rightHash, deltaBlocks, {from: owner, value: AMOUNT, gas: MAX_GAS})
                .then(txObject => {
                    assert.equal(txObject.logs.length, 1, "should have received 1 event");
                    assert.equal(txObject.logs[0].event, "LogRemittanceDeposit", "should be LogRemittanceDeposit event");
                    assert.equal(txObject.logs[0].args.sender, owner, "sender should be the owner");
                    assert.equal(txObject.logs[0].args.deposit, AMOUNT, "should be the deposit value");
                });
        });
    });

    describe("Try withdraw", function() {
        const deltaBlocks = 20;

        var instance;
        var hash;
        before("should deploy Remittance, get the instance and deposit some amount", function() {
            return Remittance.new(MAX_DELTA_BLOCKS, { from: owner, gas: MAX_GAS })
                .then(_instance => {
                    instance = _instance;
                    return instance.makeHash(BENEFICIARY_HASH, EXCHANGE_HASH, exchange);
                }).then(_hash => {
                    hash = _hash;
                    return instance.deposit(hash, deltaBlocks, {from: owner, value: AMOUNT, gas: MAX_GAS})
                });
        });

        it("should fail if the benficiary hash is wrong ", function() {
            return instance.whitdraw.call(web3.sha3(""), EXCHANGE_HASH, {from: exchange, gas: MAX_GAS})
                .catch(error => {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the exchange hash is wrong ", function() {
            return instance.whitdraw.call(BENEFICIARY_HASH, web3.sha3(""), {from: exchange, gas: MAX_GAS})
                .catch(error => {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the exchange address is wrong ", function() {
            return instance.whitdraw.call(BENEFICIARY_HASH, EXCHANGE_HASH, {from: owner, gas: MAX_GAS})
                .catch(error => {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should withdraw eth ", function() {
            let deposit;
            return instance.deposits(hash)
                .then(_deposit => {
                    deposit = _deposit;
                    return instance.whitdraw(BENEFICIARY_HASH, EXCHANGE_HASH, {from: exchange, gas: MAX_GAS})
                })
                .then(txObject => {
                    assert.equal(txObject.logs.length, 1, "should have received 1 event");
                    assert.equal(txObject.logs[0].event, "LogRemittanceWithdraw", "should be LogRemittanceWithdraw event");
                    assert.equal(txObject.logs[0].args.caller, exchange, "should be the exchange ");
                    assert.equal(txObject.logs[0].args.amount.toString(10), "" + deposit[0].toString(10), "should be the whole deposit value");
                });
        });

        it("should fails if eth in deposit", function() {
            return instance.deposits(hash)
                .then(deposit => {
                    assert.equal(deposit[0].toString(10), "0", "should have no deposit");
                });
        });

        it("should fails if deposit is available ", function() {
            return web3.eth.expectedExceptionPromise(function() {
                    return instance.whitdraw(BENEFICIARY_HASH, EXCHANGE_HASH, {from: exchange, gas: MAX_GAS})
                }, MAX_GAS)
        });
    });

    describe("Try claim", function() {
        const deltaBlocks = 2;

        var instance;
        var hash;
        before("should deploy Remittance, get the instance and deposit some amount", function() {
            return Remittance.new(MAX_DELTA_BLOCKS, { from: owner, gas: MAX_GAS })
                .then(_instance => {
                    instance = _instance;
                    return instance.makeHash(BENEFICIARY_HASH, EXCHANGE_HASH, exchange);
                }).then(_hash => {
                    hash = _hash;
                    return instance.deposit(hash, deltaBlocks, {from: owner, value: AMOUNT, gas: MAX_GAS})
                });
        });

        it("should fail if the block is not expired ", function() {
            return web3.eth.expectedExceptionPromise(function() {
                    return instance.claim(hash, {from: owner, gas: MAX_GAS})
                }, MAX_GAS)
        });

        it("should fail if the deposit is empty ", function() {
            return web3.eth.expectedExceptionPromise(function() {
                return instance.claim(web3.sha3(""), {from: owner, gas: MAX_GAS})
                }, MAX_GAS)
        });

        it("should fail if the caller is not the owner ", function() {
            return web3.eth.expectedExceptionPromise(function() {
                    return instance.claim(hash, {from: exchange, gas: MAX_GAS})
                }, MAX_GAS)
        });

        it("should fail if the value is not the deposit ", function() {
            return instance.claim(hash, {from: owner, gas: MAX_GAS})
                .then(txObject => {
                    assert.equal(txObject.logs.length, 1, "should have received 1 event");
                    assert.equal(txObject.logs[0].event, "LogRemittanceClaim", "should be LogRemittanceClaim event");
                    assert.equal(txObject.logs[0].args.caller, owner, "should be the owner ");
                    assert.equal(txObject.logs[0].args.amount.toString(10), "" + AMOUNT, "should be the whole deposit value");
                });
        });
    });
});
