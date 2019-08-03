const Pool = artifacts.require('Pool');



module.exports = async function (deployer, network, accounts) {
  const DECIMAL_MULTIPLIER = web3.utils.toBN("1000000000000000000");
  const operator = accounts[0];

  console.log(network);


  await deployer.deploy(Pool, "0x0000000000000000000000000000000000000000");
  const pool = await Pool.deployed();

};
