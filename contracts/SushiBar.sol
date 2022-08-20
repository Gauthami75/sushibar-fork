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
        // The amount of stake that can be unlocked is calculated based on the days left.
        uint256 stakeUnlocked = _timelock(userStake[msg.sender].amount);
        
        require(what > 0 && what <= stakeUnlocked, "Unable to unstake at this time");
        // Tax calculated based on the days.
        uint256 tax = _tax(what);
        // The tax to the reward fund is sent back to the reward pool

        // The final amount that will be recived calculated
        uint256 finalAmount = stakeUnlocked.sub(tax);
        
        sushi.transfer(msg.sender, finalAmount);
        // userStake mapping updated
        userStake[msg.sender].amount -= stakeUnlocked;
        _burn(msg.sender, stakeUnlocked);
    }

    // The amount of sushi that can be unstaked based on the number of days after its requested
    function _timelock(uint256 _what) internal view returns (uint256) {
        if (userStake[msg.sender].amount == 0) {
            return 0;
        }
        // Checking for staked for the user
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

    // tax for the sushi that has been requested for unsaking is calculated based on the day.
    function _tax(uint256 _unlocked) internal view returns (uint256) {
        // checking if the user has staked if not No tax so returns 0.
        if (userStake[msg.sender].amount == 0) {
            return 0;
        }
        // for the staked users the tax amount is calculated.
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
