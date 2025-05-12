// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LendingPool {
    IERC20 public collateralToken;
    IERC20 public borrowToken;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrowings;

    constructor(address _collateral, address _borrowToken) {
        collateralToken = IERC20(_collateral);
        borrowToken = IERC20(_borrowToken);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Zero amount");
        collateralToken.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }

    function borrow(uint256 amount) external {
        require(deposits[msg.sender] > 0, "No collateral");
        uint256 collateralValue = deposits[msg.sender];
        require(collateralValue * 100 / 150 >= amount, "Not enough collateral");

        require(borrowToken.balanceOf(address(this)) >= amount, "Insufficient pool balance");
        borrowings[msg.sender] += amount;
        borrowToken.transfer(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(borrowings[msg.sender] >= amount, "Repaying too much");
        borrowToken.transferFrom(msg.sender, address(this), amount);
        borrowings[msg.sender] -= amount;
    }

    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "Not enough deposit");

        uint256 remainingCollateral = deposits[msg.sender] - amount;
        require(remainingCollateral * 100 / 150 >= borrowings[msg.sender], "Collateral too low");

        deposits[msg.sender] -= amount;
        collateralToken.transfer(msg.sender, amount);
    }

    function getCollateralBalance(address user) external view returns (uint256) {
        return deposits[user];
    }

    function getBorrowedAmount(address user) external view returns (uint256) {
        return borrowings[user];
    }
}
