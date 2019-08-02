const etherlime = require('etherlime');
const oneLend = require('../build/OneLend.json');
const ERC20Mock = require('../build/ERC20Mock.json');

const deploy = async (network, secret) => {

    let oneLendDeployer = new etherlime.EtherlimeGanacheDeployer(process.env.PRIVATE_KEY);
    let erc20MockDeployer = new etherlime.EtherlimeGanacheDeployer(process.env.PRIVATE_KEY);

    const erc20MockContract = await erc20MockDeployer.deploy(
        ERC20Mock,
        false,
        oneLendDeployer.signer.getAddress(),
        ethers.utils.parseEther('1')
    );

	const oneLendContract = await oneLendDeployer.deploy(
		oneLend,
		false
	);
};

module.exports = {
	deploy
};
