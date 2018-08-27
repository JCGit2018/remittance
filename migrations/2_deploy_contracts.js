var SafeMath       = artifacts.require("./SafeMath.sol");
var Remittance       = artifacts.require("./Remittance.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(SafeMath);
    deployer.link(SafeMath, Remittance);

    let owner = accounts[1];
    let beneficiaryHash    = web3.sha3("beneficiarySecret");
    let exchangeShopHash   = web3.sha3("exchangeShopSecret");
    
    const GAS_LIMIT        = 2000000;
    const MAX_DELTA_BLOCKS = 100;

  	deployer.deploy(Remittance, beneficiaryHash, exchangeShopHash, MAX_DELTA_BLOCKS, { from: owner, gas: GAS_LIMIT });
};
