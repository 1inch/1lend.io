const etherlime = require('etherlime');
const OneLend = require('../build/OneLend.json');

const defaultConfigs = {
    gasPrice: 10000000000,
    etherscanApiKey: ''
};

const deploy = async (network, secret) => {

    const deployer = new etherlime.InfuraPrivateKeyDeployer(process.env.PRIVATE_KEY, 'mainnet', process.env.INFURA_KEY, defaultConfigs);
    const contract = await deployer.deployAndVerify(
        OneLend,
        false
    );
};

module.exports = {
    deploy
};
