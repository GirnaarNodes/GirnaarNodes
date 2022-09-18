const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Girnaar Contracts", () => {
    before(async () => {
        [owner, dApp0, dApp1, dApp2, user1, user2, user3, ...users] = await ethers.getSigners();

        mMaticContract = await ethers.getContractFactory("mMatic");
        mMatic = await mMaticContract.deploy();
        await mMatic.deployed();

        GirnaarPolygon = await ethers.getContractFactory("GirnaarPolygon");
        PG = await GirnaarPolygon.deploy(mMatic.address, 0, 0);
        await PG.deployed();

        // GirnaarEthereum = await ethers.getContractFactory("GirnaarEthereum");
        // EG = await GirnaarEthereum.deploy();
        // await EG.deployed();
    });

    describe("Test Cases", () => {
        it("Should set the right owner in mMatic", async () => {
            expect(await mMatic.owner()).to.equal(owner.address);
        });

        it("Whitelisting Girnaar contract for mMatic minting", async () => {
            await expect(mMatic.connect(user1).mint(user1.address, 100)).to.be.revertedWith("not whitelisted");

            await mMatic.addToWhitelist(PG.address);
        });

        it("Registering DApp", async () => {
            await PG.registerDApp(
                dApp0.address,
                0,
                [
                    ethers.utils.parseUnits("10", 18),
                    ethers.utils.parseUnits("30", 18),
                    ethers.utils.parseUnits("50", 18),
                ],
                [30, 90, 180]
            );

            await PG.registerDApp(
                dApp1.address,
                0,
                [
                    ethers.utils.parseUnits("200", 18),
                    ethers.utils.parseUnits("400", 18),
                    ethers.utils.parseUnits("500", 18),
                    ethers.utils.parseUnits("1000", 18),
                ],
                [30, 90, 180, 365]
            );

            await PG.registerDApp(
                dApp2.address,
                0,
                [
                    ethers.utils.parseUnits("50", 18),
                    ethers.utils.parseUnits("70", 18),
                    ethers.utils.parseUnits("100", 18),
                ],
                [30, 60, 180]
            );

            expect(await PG.dAppId()).to.equal(3);

            expect((await PG.dApp(0)).rewardWallet).to.equal(dApp0.address);
            expect((await PG.dApp(1)).rewardWallet).to.equal(dApp1.address);
            expect((await PG.dApp(2)).rewardWallet).to.equal(dApp2.address);

            expect((await PG.dAppPlan(0, 0)).price).to.equal(ethers.utils.parseUnits("10", 18));
            expect((await PG.dAppPlan(0, 1)).price).to.equal(ethers.utils.parseUnits("30", 18));
            expect((await PG.dAppPlan(0, 2)).price).to.equal(ethers.utils.parseUnits("50", 18));

            expect((await PG.dAppPlan(1, 0)).price).to.equal(ethers.utils.parseUnits("200", 18));
            expect((await PG.dAppPlan(1, 1)).price).to.equal(ethers.utils.parseUnits("400", 18));
            expect((await PG.dAppPlan(1, 2)).price).to.equal(ethers.utils.parseUnits("500", 18));
            expect((await PG.dAppPlan(1, 3)).price).to.equal(ethers.utils.parseUnits("1000", 18));

            expect((await PG.dAppPlan(2, 0)).price).to.equal(ethers.utils.parseUnits("50", 18));
            expect((await PG.dAppPlan(2, 1)).price).to.equal(ethers.utils.parseUnits("70", 18));
            expect((await PG.dAppPlan(2, 2)).price).to.equal(ethers.utils.parseUnits("100", 18));

            expect((await PG.dAppPlan(0, 0)).validity).to.equal(30);
            expect((await PG.dAppPlan(0, 1)).validity).to.equal(90);
            expect((await PG.dAppPlan(0, 2)).validity).to.equal(180);

            expect((await PG.dAppPlan(1, 0)).validity).to.equal(30);
            expect((await PG.dAppPlan(1, 1)).validity).to.equal(90);
            expect((await PG.dAppPlan(1, 2)).validity).to.equal(180);
            expect((await PG.dAppPlan(1, 3)).validity).to.equal(365);

            expect((await PG.dAppPlan(2, 0)).validity).to.equal(30);
            expect((await PG.dAppPlan(2, 1)).validity).to.equal(60);
            expect((await PG.dAppPlan(2, 2)).validity).to.equal(180);
        });

        it("Removing Subscription Plans", async () => {
            await PG.removeSubPlan(2, 0);
            await PG.removeSubPlan(2, 1);
            await PG.removeSubPlan(2, 2);

            expect((await PG.dAppPlan(2, 0)).live).to.equal(false);
            expect((await PG.dAppPlan(2, 1)).live).to.equal(false);
            expect((await PG.dAppPlan(2, 2)).live).to.equal(false);
        });

        it("Updating Subscription Plans", async () => {
            await PG.addSubPlans(2, [ethers.utils.parseUnits("50", 18), ethers.utils.parseUnits("100", 18)], [60, 180]);

            expect((await PG.dAppPlan(2, 3)).price).to.equal(ethers.utils.parseUnits("50", 18));
            expect((await PG.dAppPlan(2, 4)).price).to.equal(ethers.utils.parseUnits("100", 18));

            expect((await PG.dAppPlan(2, 3)).validity).to.equal(60);
            expect((await PG.dAppPlan(2, 4)).validity).to.equal(180);
        });

        it("Subscribe", async () => {
            await expect(
                PG.connect(user1).subscribe(3, 0, { value: ethers.utils.parseUnits("30", 18) })
            ).to.be.revertedWith("dApp not live");
            await expect(
                PG.connect(user1).subscribe(2, 1, { value: ethers.utils.parseUnits("29", 18) })
            ).to.be.revertedWith("plan not live");

            await PG.connect(user1).subscribe(0, 1, { value: ethers.utils.parseUnits("30", 18) });

            expect((await PG.dApp(0)).balance).to.equal(ethers.utils.parseUnits("30", 18));
            expect((await PG.userInfo(user1.address, 0, 1)).planAmount).to.equal(ethers.utils.parseUnits("30", 18));
            validityTill =
                (await ethers.provider.getBlock("latest")).timestamp +
                parseInt((await PG.dAppPlan(0, 1)).validity) * 86400;
            expect((await PG.userInfo(user1.address, 0, 1)).planValidity).to.equal(validityTill);
            expect(await mMatic.balanceOf(user1.address)).to.equal(ethers.utils.parseUnits("30", 18));
            expect(ethers.utils.formatEther(await waffle.provider.getBalance(PG.address))).to.equal("30.0");
        });

        it("Withdraw MATIC for Bridging and Staking", async () => {
            expect(ethers.utils.formatEther(await waffle.provider.getBalance(PG.address))).to.equal("30.0");

            await PG.withdraw(owner.address, ethers.utils.parseUnits("30", 18));

            expect(ethers.utils.formatEther(await waffle.provider.getBalance(PG.address))).to.equal("0.0");
        });

        it("Trying to Resubscribe to Same Plan", async () => {
            await expect(
                PG.connect(user1).subscribe(0, 1, { value: ethers.utils.parseUnits("30", 18) })
            ).to.be.revertedWith("plan is active");

            await hre.network.provider.request({
                method: "evm_increaseTime",
                params: [20 * 86400],
            });

            await expect(
                PG.connect(user1).subscribe(0, 1, { value: ethers.utils.parseUnits("30", 18) })
            ).to.be.revertedWith("plan is active");
        });

        it("Renewing after ~20 days and Checking New Validity", async () => {
            await PG.connect(user1).renewSubscription(0, 1);

            expect((await PG.userInfo(user1.address, 0, 1)).planValidity).to.equal(validityTill + 90 * 86400);
        });

        it("Trying to Unsubscribe", async () => {
            await expect(PG.connect(user1).unsubscribe(0, 1)).to.be.revertedWith("plan is active");

            await hre.network.provider.request({
                method: "evm_increaseTime",
                params: [160 * 86400],
            });

            await expect(PG.connect(user1).unsubscribe(0, 1)).to.be.revertedWith(
                "not enough balance, come back after some time"
            );
        });

        it("Deposit", async () => {
            await owner.sendTransaction({
                to: PG.address,
                value: ethers.utils.parseEther("10000.0"),
            });
        });

        it("Unsubscribe", async () => {
            await PG.connect(user1).unsubscribe(0, 1);

            expect(await mMatic.balanceOf(user1.address)).to.equal(0);
            expect(ethers.utils.formatEther(await waffle.provider.getBalance(PG.address))).to.equal("9970.0");
        });

        it("Setting Fees", async () => {
            await PG.setCancellationFees(1000); // 10%
            await PG.setDAppCancellationFees(1, 2000); // 20%
        });

        it("Cancellation", async () => {
            await PG.connect(user2).subscribe(1, 1, { value: ethers.utils.parseUnits("400", 18) });
            expect(await mMatic.balanceOf(user2.address)).to.equal(ethers.utils.parseUnits("400", 18));
            expect((await PG.dApp(1)).balance).to.equal(ethers.utils.parseUnits("400", 18));

            await PG.connect(user2).cancelSubscription(1, 1);

            expect(await mMatic.balanceOf(user2.address)).to.equal(0);
            expect((await PG.dApp(1)).balance).to.equal(ethers.utils.parseUnits("80", 18));
            expect((await PG.userInfo(user2.address, 1, 1)).planAmount).to.equal(0);
        });

        it("Reward Distribution", async () => {
            await PG.distributeDAppRewards(
                [0, 1],
                [ethers.utils.parseUnits("10", 18), ethers.utils.parseUnits("40", 18)],
                { value: ethers.utils.parseUnits("50", 18) }
            );

            expect((await PG.dApp(0)).paid).to.equal(ethers.utils.parseUnits("10", 18));
            expect((await PG.dApp(1)).paid).to.equal(ethers.utils.parseUnits("40", 18));
            expect(await PG.lastRewardDistribution()).to.equal((await ethers.provider.getBlock("latest")).timestamp);
        });
    });
});
