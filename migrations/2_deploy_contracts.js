var SafeMath       = artifacts.require("./SafeMath.sol");
var Remittance       = artifacts.require("./Remittance.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(SafeMath);
    deployer.link(SafeMath, Remittance);

    let owner = accounts[0];
    
    const GAS_LIMIT        = 2000000;
    const MAX_DELTA_BLOCKS = 100;

  	deployer.deploy(Remittance, MAX_DELTA_BLOCKS, { from: owner, gas: GAS_LIMIT });
};
