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

    // const result = await posClient.depositEther(ethers.utils.parseEther("0.01").toHexString(), userAddress);

    // const txHash = await result.getTransactionHash();
    // console.log("txHash: " + txHash);

    // const txReceipt = await result.getReceipt();
    // console.log("txReceipt: " + txReceipt);

    // txHash = "0x70d09b461d3727db414136e576a9d06534ebe1b785a695e5b67ab493839e1893";
    // txHash = "0x77af1032d297ed15b71548c5715cf2574701ddb50b18efbc527e1bf8fbeafc0b";
    txHash = "0x5227be52c54cbfa9c6578c4ce0b67cfcefab3184d1c6449b4cf785105996718d";

    const isDeposited = await posClient.isDeposited(txHash);
    console.log("isDeposited: " + isDeposited);

    // const isCheckPointed = await posClient.isCheckPointed(txHash);
    // console.log("isCheckPointed: " + isCheckPointed);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });



// goerli (ETH): https://goerli.etherscan.io/tx/0x70d09b461d3727db414136e576a9d06534ebe1b785a695e5b67ab493839e1893
// mumbai (WETH): comes from zero address