import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'

const OP_GOERLI_PARLAY_MARKETS_AMM_ADDRESS = '0x0ec9D8Dac2178b041f85f60E3cF13CfaA3d23e0e'
const OP_GOERLI_PARLAY_MARKET_DATA_ADDRESS = '0x1218A1DF0Fc5934d44Ea52B298e91Fe6C9Bcee1b'

const contractName = 'CopyableParlayAMM'

describe('CopyableParlayAMM', () => {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployCopyableParlayAMMContract() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners()

		const CopyableParlayAMM = await ethers.getContractFactory(contractName)

		//  Deploy logic contract using the proxy pattern.
		const copyableParlayAMM = await upgrades.deployProxy(
			CopyableParlayAMM,

			//Since the logic contract has an initialize() function
			// we need to pass in the arguments to the initialize()
			// function here.
			[owner.address, OP_GOERLI_PARLAY_MARKETS_AMM_ADDRESS, OP_GOERLI_PARLAY_MARKET_DATA_ADDRESS],

			// We don't need to expressly specify this
			// as the Hardhat runtime will default to the name 'initialize'
			{ initializer: 'initialize' }
		)

		await copyableParlayAMM.deployed()

		return { copyableParlayAMM, owner, otherAccount }
	}

	describe('Deployment', () => {
		it('should set admin, parlayMarketsAMM, and parlayMarketData', async function () {
			const { copyableParlayAMM, owner } = await loadFixture(deployCopyableParlayAMMContract)

			expect(await copyableParlayAMM.getAdmin()).to.equal(await owner.getAddress())
		})
	})
})
