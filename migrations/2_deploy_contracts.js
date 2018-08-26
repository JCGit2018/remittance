var SafeMath       = artifacts.require("./SafeMath.sol");
var Remittance       = artifacts.require("./Remittance.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(SafeMath);
    deployer.link(SafeMath, Remittance);

    let owner = accounts[1];
    let beneficiaryHash   = web3.sha3("beneficiarySecret");
    let exchangeShopHash  = web3.sha3("exchangeShopSecret");
    const GAS_LIMIT = 2000000;

  	deployer.deploy(Remittance, beneficiaryHash, exchangeShopHash, { from: owner, gas: GAS_LIMIT });
};
