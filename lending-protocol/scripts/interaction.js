const { ethers } = require("hardhat");

async function main() {
    const [user] = await ethers.getSigners();
    console.log("User address:", user.address);

    const daiAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // TestDAI
    const lendingPoolAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // LendingPool

    const DAI = await ethers.getContractAt("TestToken", daiAddress);
    const LendingPool = await ethers.getContractAt("LendingPool", lendingPoolAddress);

    const depositAmount = ethers.utils.parseUnits("100", 18);
    const borrowAmount = ethers.utils.parseUnits("5", 18);

    const showBalances = async () => {
        const userDAI = await DAI.balanceOf(user.address);
        const poolDAI = await DAI.balanceOf(lendingPoolAddress);
        console.log("User DAI Balance:", ethers.utils.formatUnits(userDAI, 18));
        console.log("LendingPool DAI Balance:", ethers.utils.formatUnits(poolDAI, 18));
    };

    console.log("\n--- Before Deposit ---");
    await showBalances();

    // Approve LendingPool to spend user's DAI
    console.log("\nApproving LendingPool...");
    await DAI.connect(user).approve(lendingPoolAddress, depositAmount);

    // Deposit DAI
    console.log("Depositing...");
    try {
        const txDeposit = await LendingPool.connect(user).deposit(depositAmount);
        await txDeposit.wait();
        console.log("Deposit TX Hash:", txDeposit.hash);
    } catch (err) {
        console.error("Deposit failed:", err.message);
        return;
    }

    console.log("\n--- After Deposit ---");
    await showBalances();

    // Borrow DAI
    console.log("\nBorrowing...");
    try {
        const txBorrow = await LendingPool.connect(user).borrow(borrowAmount);
        await txBorrow.wait();
        console.log("Borrow TX Hash:", txBorrow.hash);
    } catch (err) {
        console.error("Borrow failed:", err.message);
        return;
    }

    console.log("\n--- After Borrow ---");
    await showBalances();

    // Withdraw DAI
    console.log("\nWithdrawing...");
    try {
        const txWithdraw = await LendingPool.connect(user).withdraw(depositAmount);
        await txWithdraw.wait();
        console.log("Withdraw TX Hash:", txWithdraw.hash);
    } catch (err) {
        console.error("Withdraw failed:", err.message);
        return;
    }

    console.log("\n--- Final Balances ---");
    await showBalances();
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});
