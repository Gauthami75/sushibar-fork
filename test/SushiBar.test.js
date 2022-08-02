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

        sushi.mint(alice.address, "100")
        sushi.mint(bob.address, "100")
        sushi.mint(carol.address, "100")
    })

    it("should not allow enter if not enough approve", async function () {
        await expect(bar.enter("100")).to.be.revertedWith(
            "ERC20: transfer amount exceeds allowance"
        )
        await sushi.approve(bar.address, "50")
        await expect(bar.enter("100")).to.be.revertedWith(
            "ERC20: transfer amount exceeds allowance"
        )
        await sushi.approve(bar.address, "100")
        await bar.enter("100")
        expect(await bar.balanceOf(alice.address)).to.equal("100")
    })

    it("should not allow withraw more than what you have", async function () {
        await sushi.approve(bar.address, "100")
        await bar.enter("100")
        await expect(bar.leave("200")).to.be.revertedWith("ERC20: burn amount exceeds balance")
    })

    it("should work with more than one participant", async function () {
        await sushi.approve(bar.address, "100")
        await sushi.connect(bob).approve(bar.address, "100", { from: bob.address })
        // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
        await bar.enter("20")
        await bar.connect(bob).enter("10", { from: bob.address })
        expect(await bar.balanceOf(alice.address)).to.equal("20")
        expect(await bar.balanceOf(bob.address)).to.equal("10")
        expect(await sushi.balanceOf(bar.address)).to.equal("30")
        // SushiBar get 20 more SUSHIs from an external source.
        await sushi.connect(carol).transfer(bar.address, "20", { from: carol.address })
        // Alice deposits 10 more SUSHIs. She should receive 10*30/50 = 6 shares.
        await bar.enter("10")
        expect(await bar.balanceOf(alice.address)).to.equal("26")
        expect(await bar.balanceOf(bob.address)).to.equal("10")
        // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
        await bar.connect(bob).leave("5", { from: bob.address })
        expect(await bar.balanceOf(alice.address)).to.equal("26")
        expect(await bar.balanceOf(bob.address)).to.equal("5")
        expect(await sushi.balanceOf(bar.address)).to.equal("52")
        expect(await sushi.balanceOf(alice.address)).to.equal("70")
        expect(await sushi.balanceOf(bob.address)).to.equal("98")
    })
})
