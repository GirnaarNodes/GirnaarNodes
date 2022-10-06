// const MaticPlasmaClient = require("@maticnetwork/maticjs").default;
// const { MaticPoSClient } = require("@maticnetwork/maticjs");
const { POSClient, use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require("@maticnetwork/maticjs-ethers");
const { providers, Wallet } = require("ethers");
const { ethers } = require("hardhat");

// install web3 plugin
use(Web3ClientPlugin);

// const Network = require("@maticnetwork/meta/network");

const privateKey = "54647a2110a79a83dd21929525bb46ea892b4ca91b2e9424cf875f1a3dbf1cc0";
const userAddress = "0xFfbb6e8a616A0De66C2d58008dbC427B00C7E750";

const parentRPC = "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
const childRPC = "https://rpc-mumbai.maticvigil.com/v1/14219e640fdcae91ca55b56d55437cc4e8d3667e";

const parentProvider = new providers.JsonRpcProvider(parentRPC);
const childProvider = new providers.JsonRpcProvider(childRPC);


async function main() {
    const posClient = new POSClient();

    await posClient.init({
        network: "testnet", // 'testnet' or 'mainnet'
        version: "mumbai", // 'mumbai' or 'v1'
        parent: {
            provider: new Wallet(privateKey, parentProvider),
            defaultConfig: {
                from: userAddress,
            },
        },
        child: {
            provider: new Wallet(privateKey, childProvider),
            defaultConfig: {
                from: userAddress,
            },
        },
    });

    const parentERC20Token = posClient.erc20("0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae", true);
    const childERC20Token = posClient.erc20("0x0000000000000000000000000000000000001010");

    // get balance of user
    const parentBalance = await parentERC20Token.getBalance(userAddress);
    console.log("Parent MATIC Balance: " + ethers.utils.formatEther(parentBalance));

    const childBalance = await childERC20Token.getBalance(userAddress);
    console.log("Child MATIC Balance: " + ethers.utils.formatEther(childBalance));

    // approve max
    // const approveResult = await parentERC20Token.approveMax();

    // const approveTxHash = await approveResult.getTransactionHash();
    // console.log("Approve Hash: " + approveTxHash);

    //deposit 100 to user address
    // const result = await parentERC20Token.deposit(ethers.utils.parseEther("0.1").toHexString(), userAddress);

    // const txHash = await result.getTransactionHash();
    // console.log("txHash: " + txHash);

    // txHash = "0xebc7e3e0fbf0dffc2cda41b1ed3dd626eeee7cf7b7e2f56e04bfc9a0cbf70946";
    txHash = "0x64ff21ccca7f0a6824852ea947e4fd131d4823769574cd39d16ceca875c1babf";

    // const txReceipt = await result.getReceipt();
    // console.log("txReceipt: " + txReceipt);

    const isDeposited = await posClient.isDeposited(txHash);
    console.log("isDeposited: " + isDeposited);

    // const isCheckPointed = await posClient.isCheckPointed(txHash);
    // console.log("isCheckPointed: " + isCheckPointed);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// goerli (MATIC) approve ERC20 Predicate (0xdD6596F2029e6233DEFfaCa316e6A95217d4Dc34):  https://goerli.etherscan.io/tx/0x0d79323f44910bdffef2b0960170b04988e12f726678e4d948cd580f5f3fc90c
// goerli (MATIC) deposit:  https://goerli.etherscan.io/tx/0xebc7e3e0fbf0dffc2cda41b1ed3dd626eeee7cf7b7e2f56e04bfc9a0cbf70946
// mumbai (WETH): comes from zero address



/*

[0]:  000000000000000000000000ffbb6e8a616a0de66c2d58008dbc427b00c7e750
[1]:  000000000000000000000000499d11e0b6eac7c0593d8fb292dcbbf815fb29ae
[2]:  0000000000000000000000000000000000000000000000000000000000000060
[3]:  0000000000000000000000000000000000000000000000000000000000000020
[4]:  000000000000000000000000000000000000000000000000016345785d8a0000

      000000000000000000000000000000000000000000000000016345785d8a0000

[0]:  000000000000000000000000307bd76402565831d307e982423cee1a9dc33fc5
[1]:  000000000000000000000000123455d0f27e9e6c4447322524d6f2acd22f340a
[2]:  0000000000000000000000000000000000000000000000000000000000000060
[3]:  0000000000000000000000000000000000000000000000000000000000000020
[4]:  0000000000000000000000000000000000000000000000000de0b6b3a7640000

[0]:  000000000000000000000000d953a6c53b8c3ab5a501b945e874c01d1a9e78a0
[1]:  000000000000000000000000123455d0f27e9e6c4447322524d6f2acd22f340a
[2]:  0000000000000000000000000000000000000000000000000000000000000060
[3]:  0000000000000000000000000000000000000000000000000000000000000020
[4]:  0000000000000000000000000000000000000000000000000de0b6b3a7640000

[0]:  00000000000000000000000006ca3be12f950d8d9637c100dcbd4451b01f4d22
[1]:  000000000000000000000000123455d0f27e9e6c4447322524d6f2acd22f340a
[2]:  0000000000000000000000000000000000000000000000000000000000000060
[3]:  0000000000000000000000000000000000000000000000000000000000000020
[4]:  0000000000000000000000000000000000000000000000000de0b6b3a7640000

*/
