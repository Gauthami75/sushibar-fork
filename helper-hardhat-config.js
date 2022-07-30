const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
        daiToken: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        daiWhale: "0xad0135af20fa82e106607257143d0060a7eb5cbf",
        wethWhale: "0x06920c9fc643de77b99cb7670a944ad31eaaa260",
    },
    4: {
        name: "rinkeby",
        dai: "0xFab46E002BbF0b4509813474841E0716E6730136", // https://erc20faucet.com/
        wbtc: "0x577D296678535e4903D59A4C929B718e1D575e0A", // https://rinkeby.etherscan.io/token/0x577d296678535e4903d59a4c929b718e1d575e0a#writeContract
    },
}

const developmentChains = ["hardhat", "localhost", "rinkeby"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}
