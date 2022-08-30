require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

task(
    "accounts",
    "👩🕵👨🙋👷 Prints the list of accounts (only for localhost)",
    async () => {
        const accounts = await ethers.getSigners();
        for (const account of accounts) {
            console.log(account.address);
        }
        console.log("👩🕵 👨🙋👷 these accounts only for localhost network.");
        console.log(
            'To see their private keys🔑🗝 when you run "npx hardhat node."'
        );
    }
);

module.exports = {
    etherscan: {
        apiKey: {
            ropsten: process.env.ethAPIKey,
            bsc: process.env.bscAPIKey,
            cronosTestnet: process.env.cronosAPIKey,
        },

        customChains: [
            {
                network: "cronosTestnet",
                chainId: 338,
                urls: {
                    apiURL: "https://api-testnet.cronoscan.com/api",
                    browserURL: "https://testnet.cronoscan.com/",
                },
            },
        ],
    },

    defaultNetwork: "hardhat",

    networks: {
        hardhat: {
            accounts: {
                accountsBalance: "1000000000000000000000000",
                count: 10,
            },
        },

        localhost: {
            url: "http://127.0.0.1:8545",
        },

        Ganache: {
            url: "http://127.0.0.1:7545",
        },

        bscTestnet: {
            url: "https://data-seed-prebsc-2-s3.binance.org:8545/",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        bscMainnet: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        rinkeby: {
            url: "https://rinkeby.infura.io/v3/" + process.env.infuraKey,
            chainId: 4,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        ropsten: {
            url: "https://ropsten.infura.io/v3/" + process.env.infuraKey,
            chainId: 3,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        mainnet: {
            url: "https://mainnet.infura.io/v3/" + process.env.infuraKey,
            chainId: 1,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        mumbai: {
            url:
                "https://rpc-mumbai.maticvigil.com/v1/" +
                process.env.maticRpcKey,
            chainId: 80001,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        polygon: {
            url:
                "https://rpc-mainnet.maticvigil.com/v1/" +
                process.env.maticRpcKey,
            chainId: 80001,
            gasPrice: 20000000000,
            accounts: [process.env.privateKey],
        },

        cronosTestnet: {
            url: "https://evm-t3.cronos.org",
            chainId: 338,
            gasPrice: 20000000000000,
            accounts: [process.env.privateKey],
        },
    },

    gasReporter: {
        // currency: "USD",
        // coinmarketcap: process.env.coinmarketcap,
        // gasPrice: 50,
        enabled: false,
    },

    solidity: {
        compilers: [
            {
                version: "0.8.16",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
        overrides: {},
    },

    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },

    mocha: {
        timeout: 2000000,
    },
};
