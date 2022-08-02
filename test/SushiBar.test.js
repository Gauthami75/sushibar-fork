const { assert, expect } = require("chai")
const { ethers, deployments, network } = require("hardhat")

describe("SushiBar", function () {
    let sushi, bar, signers, alice, bob, carol

    before(async function () {
        signers = await ethers.getSigners()
        alice = signers[0]
        bob = signers[1]
        carol = signers[2]
    })

    beforeEach(async function () {
        await deployments.fixture(["SushiBar"])
        sushi = await ethers.getContract("SushiToken")
        bar = await ethers.getContract("SushiBar")
        let amount = ethers.utils.parseEther("100")
        sushi.mint(alice.address, amount)
        sushi.mint(bob.address, amount)
        sushi.mint(carol.address, amount)
    })

    it("should not allow enter if not enough approve", async function () {
        let amount = ethers.utils.parseEther("100")
        await expect(bar.enter(amount)).to.be.revertedWith(
            "ERC20: transfer amount exceeds allowance"
        )
        await sushi.approve(bar.address, ethers.utils.parseEther("50"))
        await expect(bar.enter(amount)).to.be.revertedWith(
            "ERC20: transfer amount exceeds allowance"
        )
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)
    })

    it("should not be able to unstake", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        await expect(bar.leave(100)).to.be.revertedWith("Unable to unstake at this time")
    })

    it("should be able to unstake 25% + pay 75% tax to reward pool", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const twoDays = 2 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [twoDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("25")
        let initialBarBalance = await sushi.balanceOf(bar.address)
        await bar.leave(amountToUnstake)
        let finalAmount = amountToUnstake.sub(amountToUnstake.mul(75).div(100))

        // check alice balance
        expect(await sushi.balanceOf(alice.address)).to.equal(finalAmount)
        // check bar contract balance
        expect(await sushi.balanceOf(bar.address)).to.equal(initialBarBalance.sub(finalAmount))
    })

    it("should revert when user is unstaking more than 25%", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const twoDays = 2 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [twoDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("30")

        await expect(bar.leave(amountToUnstake)).to.be.revertedWith(
            "Unable to unstake at this time"
        )
    })

    it("should be able to unstake 50% + pay 50% tax to reward pool", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const fourDays = 4 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [fourDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("50")
        let initialBarBalance = await sushi.balanceOf(bar.address)

        await bar.leave(amountToUnstake)
        let finalAmount = amountToUnstake.sub(amountToUnstake.mul(50).div(100))
        // check alice balance
        expect(await sushi.balanceOf(alice.address)).to.equal(finalAmount)
        // check bar contract balance
        expect(await sushi.balanceOf(bar.address)).to.equal(initialBarBalance.sub(finalAmount))
    })

    it("should revert when user is unstaking more than 50%", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const fourDays = 4 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [fourDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("60")

        await expect(bar.leave(amountToUnstake)).to.be.revertedWith(
            "Unable to unstake at this time"
        )
    })

    it("should be able to unstake 75% + pay 25% tax to reward pool", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const sixDays = 6 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [sixDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("75")
        let initialBarBalance = await sushi.balanceOf(bar.address)

        await bar.leave(amountToUnstake)
        let finalAmount = amountToUnstake.sub(amountToUnstake.mul(25).div(100))
        let aliceBal = await sushi.balanceOf(alice.address)

        // check alice balance
        expect(await sushi.balanceOf(alice.address)).to.equal(finalAmount)
        // check bar contract balance
        expect(await sushi.balanceOf(bar.address)).to.equal(initialBarBalance.sub(finalAmount))
    })

    it("should revert when user is unstaking more than 75%", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const sixDays = 6 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [sixDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("85")

        await expect(bar.leave(amountToUnstake)).to.be.revertedWith(
            "Unable to unstake at this time"
        )
    })

    it("should be able to unstake 100% + pay 0% tax to reward pool", async function () {
        let amount = ethers.utils.parseEther("100")
        await sushi.approve(bar.address, amount)
        await bar.enter(amount)
        expect(await bar.balanceOf(alice.address)).to.equal(amount)

        const eightDays = 8 * 24 * 60 * 60
        await network.provider.send("evm_increaseTime", [eightDays + 1])
        await network.provider.request({ method: "evm_mine", params: [] })

        let amountToUnstake = ethers.utils.parseEther("100")
        let initialBarBalance = await sushi.balanceOf(bar.address)

        await bar.leave(amountToUnstake)
        let finalAmount = amountToUnstake
        let aliceBal = await sushi.balanceOf(alice.address)

        // check alice balance
        expect(await sushi.balanceOf(alice.address)).to.equal(finalAmount)
        // check bar contract balance
        expect(await sushi.balanceOf(bar.address)).to.equal(initialBarBalance.sub(finalAmount))
    })
})
