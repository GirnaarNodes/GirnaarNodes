const { expect } = require('chai');

describe('Token contract', () => {
    before(async () => {
        [owner, user1, user2, ...users] = await ethers.getSigners();

        TokenContract = await ethers.getContractFactory('Token');
        Token = await TokenContract.deploy();
        await Token.deployed();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async function () {
        });

        it('Should assign the total supply of tokens to the owner', async () => {
        });
    });

    describe('Transactions', () => {
        it('Should transfer tokens between accounts', async () => {
        });
    });
});
