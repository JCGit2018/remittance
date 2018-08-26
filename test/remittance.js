Promise = require("bluebird");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

web3.eth.expectedExceptionPromise = require("../utils/expectedException.js");

// Import the smart contracts
const Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {
    const MAX_GAS = 3000000;
    const AMOUNT = web3.toWei(0.007, 'ether'); // deposit value

    const EXCHANGE_SHOP_HASH = web3.sha3("exchangeShopSecret");
    const BENEFICIARY_HASH   = web3.sha3("beneficiarySecret");

    console.log(accounts);

    var shop;
    var owner;
    before("check accounts number", function() {
        assert.isAtLeast(accounts.length, 2, "not enough accounts");
        [owner, shop] = accounts;
        console.log("Owner  " + owner);
        console.log("Shop   " + shop);
    });

    describe("Migration", function() {
        var instance;
        before("should deploy Remittance and get the instance", function() {
            return Remittance.new(BENEFICIARY_HASH, EXCHANGE_SHOP_HASH, { from: owner, gas: MAX_GAS })
                .then(function(_instance) {
                    instance = _instance;
                });
        });
        it("should start with proper values", function() {
           return instance.owner()
                .then(_owner => {
                    assert.strictEqual(
                        _owner,
                        owner,
                        "should have creation owner");
                });
        });
    });

    // in this way we can speed up test for wrong parameters?
/*
    describe("deposit parameters ", function() {
        var instance;
        before("should deploy Remittance and get the instance", function() {
            return Remittance.new(BENEFICIARY_HASH, BENEFICIARY_HASH, { from: owner, gas: MAX_GAS })
                .then(function(_instance) {
                    instance = _instance;
                });
        });

        it("should fail if the value is zero", function() {
            return instance.deposit.call({sender: owner, value: 0, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the sender is not the owner ", function() {
            return instance.deposit.call({sender: shop, value: AMOUNT, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });
    });
*/

    describe("deposit", function() {
        var instance;
        before("should deploy Remittance and get the instance", function() {
            return Remittance.new(BENEFICIARY_HASH, EXCHANGE_SHOP_HASH, { from: owner, gas: MAX_GAS })
                .then(function(_instance) {
                    instance = _instance;
                });
        });

        it("should fail if the value is zero", function() {
            return instance.deposit.call({sender: owner, value: 0, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the sender is not the owner ", function() {
            return instance.deposit.call({sender: shop, value: AMOUNT, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should deposit eth ", function() {
            return instance.deposit({sender: owner, value: AMOUNT, gas: MAX_GAS})
                .then(txObject => {
                    assert.equal(txObject.logs.length, 1, "should have received 1 event");
                    assert.equal(txObject.logs[0].event, "LogRemittanceDeposit", "should be LogRemittanceDeposit event");
                    assert.equal(txObject.logs[0].args.sender, owner, "sender should be the owner");
                    assert.equal(txObject.logs[0].args.deposit, AMOUNT, "should be the deposit value");
                });
        });
    });

    describe("withdraw", function() {
        var instance;
        before("should deploy Remittance and get the instance", function() {
            return Remittance.new(BENEFICIARY_HASH, EXCHANGE_SHOP_HASH, { from: owner, gas: MAX_GAS })
                .then(function(_instance) {
                    instance = _instance;
                });
        });

        it("should fail if the benficiary hash is wrong ", function() {
            return instance.whitdraw.call(0, EXCHANGE_SHOP_HASH, {sender: shop, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should fail if the shop hash is wrong ", function() {
            return instance.whitdraw.call(BENEFICIARY_HASH, 0, {sender: shop, gas: MAX_GAS})
                .catch(error  =>  {
                    assert.include(error.message, "VM Exception while processing transaction: revert");
                });
        });

        it("should withdraw eth ", function() {
            //return instance.split(first, second, {sender: owner, value: AMOUNT, gas: MAX_GAS})
            //    .then(() => function() {
            //        return instance.withdraw(credit, {sender: first, gas: MAX_GAS});
            //    })
            return instance.deposit({sender: owner, value: AMOUNT, gas: MAX_GAS})
                .then(() => {
                    return instance.whitdraw(BENEFICIARY_HASH, EXCHANGE_SHOP_HASH, {sender: shop, gas: MAX_GAS})
                })
                .then(txObject => {
                    assert.equal(txObject.logs.length, 1, "should have received 1 event");
                    assert.equal(txObject.logs[0].event, "LogRemittanceWithdraw", "should be LogRemittanceWithdraw event");
                    assert.equal(txObject.logs[0].args.caller, shop, "should be the shop ");
                    assert.equal(txObject.logs[0].args.amount.toString(10), "" + AMOUNT, "should be the whole deposit value");
                    return instance.credit(first)
                }).catch(function(error) {
                    console.log("ERROR:  " + error.message);
                });;
        });
    });
});
