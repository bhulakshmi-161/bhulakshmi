// const { ethers } = require("hardhat");
// const { expect } = require("chai");
// const { AddressLookupTableInstruction } = require("@solana/web3.js");


// // these are deployed contract Addresses
// // TestDAI deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// // TestUSDC deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
// // LendingPool deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

// describe("LendingPool Contract", function () {
//   let lendingPool;
//   let dai;
//   let borrower;

//   beforeEach(async function () {
//     // Get signers
//     const [owner, user1] = await ethers.getSigners();
//     borrower = user1;

//     // Deploy TestDAI contract
//     const TestToken = await ethers.getContractFactory("TestToken");
//     dai = await TestToken.deploy("Test DAI", "DAI", 18);
//     await dai.deployed();

//     // Deploy LendingPool contract
//     const LendingPool = await ethers.getContractFactory("LendingPool");
//     lendingPool = await LendingPool.deploy();
//     await lendingPool.deployed();

//     // Transfer some DAI to borrower for testing
//     await dai.transfer(borrower.address, ethers.utils.parseUnits("1000", 18));
//   });

//   it("should allow borrower to deposit DAI into the LendingPool", async function () {
//     const depositAmount = ethers.utils.parseUnits("500", 18);
//     await dai.connect(borrower).approve(lendingPool.address, depositAmount);
//     await lendingPool.connect(borrower).deposit(dai.address, depositAmount);

//     const balance = await lendingPool.balanceOf(borrower.address, dai.address);
//     expect(balance).to.equal(depositAmount);
//   });

//   it("should allow borrower to borrow DAI", async function () {
//     const borrowAmount = ethers.utils.parseUnits("300", 18);
//     await lendingPool.connect(borrower).borrow(dai.address, borrowAmount);

//     const balance = await dai.balanceOf(borrower.address);
//     expect(balance).to.equal(borrowAmount);
//   });

//   it("should allow borrower to repay DAI", async function () {
//     const repayAmount = ethers.utils.parseUnits("300", 18);
//     await dai.connect(borrower).approve(lendingPool.address, repayAmount);
//     await lendingPool.connect(borrower).repay(dai.address, repayAmount);

//     const balance = await dai.balanceOf(borrower.address);
//     expect(balance).to.equal(ethers.utils.parseUnits("700", 18));
//   });
// });
