import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers, network, upgrades } from 'hardhat'
import { expect } from 'chai'

import { getDeploymentAddress } from '../../scripts/utils/helpers'

// get the addresses of the deployed contracts
const PARLAY_MARKETS_AMM_ADDRESS = getDeploymentAddress('ParlayMarketsAMM', network.name)
const PROXY_SUSD_ADDRESS = getDeploymentAddress('ProxysUSD', network.name)
const maxAllowedPegSlippagePercentage = BigInt(2e16) // 0.02 ETH

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

			// Since the logic contract has an initialize() function
			// we need to pass in the arguments to the initialize()
			// function here.
			[
				owner.address,
				PARLAY_MARKETS_AMM_ADDRESS,
				PROXY_SUSD_ADDRESS,
				maxAllowedPegSlippagePercentage
			],

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

			expect(await copyableParlayAMM.getOwner()).to.equal(await owner.getAddress())
		})
	})
})
