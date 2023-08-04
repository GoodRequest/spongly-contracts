// The Open Zeppelin upgrades plugin adds the `upgrades` property
// to the Hardhat Runtime Environment.
import { ethers, network, upgrades } from 'hardhat'

import { setDeploymentAddress } from '../utils/helpers'

const contractName = 'CopyableSportsAMM'

const OP_GOERLI_SPORT_MARKETS_AMM_ADDRESS = '0x7465c5d60d3d095443CF9991Da03304A30D42Eae'
const OP_GOERLI_SUSD_ADDRESS = '0xE1ceaa829525a08C1d39A5CEBe4b42aF58d77198'

const maxAllowedPegSlippagePercentage = BigInt(2e16) // 0.02 ETH

async function main() {
	// Obtain reference to contract and ABI.
	const CopyableSportsAMM = await ethers.getContractFactory(contractName)
	console.log(`Deploying ${contractName} to`, network.name)

	// Get the first account from the list of 20 created for you by Hardhat
	const [owner] = await ethers.getSigners()

	// Deploy logic contract using the proxy pattern.
	const copyableSportsAMM = await upgrades.deployProxy(
		CopyableSportsAMM,

		// Since the logic contract has an initialize() function
		// we need to pass in the arguments to the initialize()
		// function here.
		[owner.address, OP_GOERLI_SPORT_MARKETS_AMM_ADDRESS, OP_GOERLI_SUSD_ADDRESS, maxAllowedPegSlippagePercentage],

		// We don't need to expressly specify this
		// as the Hardhat runtime will default to the name 'initialize'
		{ initializer: 'initialize' }
	)

	await copyableSportsAMM.deployed()

	console.log(`${contractName} deployed to:`, copyableSportsAMM.address)

	// store the contract address in the deployment addresses json
	setDeploymentAddress(contractName, copyableSportsAMM.address, network.name)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
