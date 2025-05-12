const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const TestDAI = await hre.ethers.getContractFactory("TestToken");
  const dai = await TestDAI.deploy("Test DAI", "TDAI");
  await dai.deployed();

  const TestUSDC = await hre.ethers.getContractFactory("TestToken");
  const usdc = await TestUSDC.deploy("Test USDC", "TUSDC");
  await usdc.deployed();

  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const pool = await LendingPool.deploy(dai.address, usdc.address);
  await pool.deployed();

  console.log("TestDAI deployed to:", dai.address);
  console.log("TestUSDC deployed to:", usdc.address);
  console.log("LendingPool deployed to:", pool.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
