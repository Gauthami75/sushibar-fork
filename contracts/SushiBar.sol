// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "hardhat/console.sol";

// SushiBar is the coolest bar in town. You come in with some Sushi, and leave with more! The longer you stay, the more Sushi you get.
//
// This contract handles swapping to and from xSushi, SushiSwap's staking token.
contract SushiBar is ERC20("SushiBar", "xSUSHI") {
    using SafeMath for uint256;
    IERC20 public sushi;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }
    // Define mapping
    mapping(address => Stake) userStake;

    // Define the Sushi token contract
    constructor(IERC20 _sushi) public {
        sushi = _sushi;
    }

    // Enter the bar. Pay some SUSHIs. Earn some shares.
    // Locks Sushi and mints xSushi
    function enter(uint256 _amount) public {
        // Gets the amount of Sushi locked in the contract
        uint256 totalSushi = sushi.balanceOf(address(this));
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // If no xSushi exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSushi == 0) {
            _mint(msg.sender, _amount);
        }
        // Calculate and mint the amount of xSushi the Sushi is worth. The ratio will change overtime, as xSushi is burned/minted and Sushi deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSushi);
            _mint(msg.sender, what);
        }
        // update the mapping
        userStake[msg.sender].timestamp = block.timestamp;
        userStake[msg.sender].amount = _amount;
        // Lock the Sushi in the contract
        sushi.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SUSHIs.
    // Unlocks the staked + gained Sushi and burns xSushi
    function leave(uint256 _share) public {
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sushi the xSushi is worth
        uint256 what = _share.mul(sushi.balanceOf(address(this))).div(totalShares);
        // check how much user can unlock based on the day they left the bar
        uint256 unlock = _unlock(userStake[msg.sender].amount);
        // check if unlock is greater than 0
        require(what > 0 && what <= unlock, "Unable to unstake at this time");
        // Now calculate the tax on your tokens
        uint256 tax = _tax(what);
        // Send the tax to the reward fund, we will treat out contract address as reward pool
        // sushi.transfer(address(this), tax);

        // calculate the final amount and sent to the recipient
        uint256 finalAmount = unlock.sub(tax);
        // unlock the Sushi in the contract
        sushi.transfer(msg.sender, finalAmount);
        // update the mapping
        userStake[msg.sender].amount -= unlock;
        _burn(msg.sender, unlock);
    }

    // It calculates the sushi that can be unlocked based on the day they requested
    function _unlock(uint256 _what) internal view returns (uint256) {
        if (userStake[msg.sender].amount == 0) {
            return 0;
        }
        // If the user has staked, calculate the amount they can unstake
        else {
            uint256 time = block.timestamp - userStake[msg.sender].timestamp;
            if (time < 2 * 24 * 60 * 60) {
                return 0;
            } else if (time < 4 * 24 * 60 * 60) {
                return _what.mul(25).div(100);
            } else if (time < 6 * 24 * 60 * 60) {
                return _what.mul(50).div(100);
            } else if (time < 8 * 24 * 60 * 60) {
                return _what.mul(75).div(100);
            } else {
                return _what;
            }
        }
    }

    // It calculates the tax on the sushi that is being unstaked
    function _tax(uint256 _unlocked) internal view returns (uint256) {
        // If the user has not staked, return 0
        if (userStake[msg.sender].amount == 0) {
            return 0;
        }
        // If the user has staked, calculate the amount they can unstake
        else {
            uint256 time = block.timestamp - userStake[msg.sender].timestamp;
            if (time < 2 * 24 * 60 * 60) {
                return 0;
            } else if (time < 4 * 24 * 60 * 60) {
                return _unlocked.mul(75).div(100);
            } else if (time < 6 * 24 * 60 * 60) {
                return _unlocked.mul(50).div(100);
            } else if (time < 8 * 24 * 60 * 60) {
                return _unlocked.mul(25).div(100);
            } else {
                return 0;
            }
        }
    }
}
