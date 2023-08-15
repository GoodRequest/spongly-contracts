// The Open Zeppelin upgrades plugin adds the `upgrades` property
// to the Hardhat Runtime Environment.
import { ethers, network, upgrades } from 'hardhat'

import { getDeploymentAddress, setDeploymentAddress } from '../utils/helpers'

const contractName = 'CopyableSportsAMM'

// get the addresses of the deployed contracts
const SPORT_MARKETS_AMM_ADDRESS = getDeploymentAddress('SportMarketsAMM', network.name)
const SUSD_ADDRESS = getDeploymentAddress('ProxysUSD', network.name)

const maxAllowedPegSlippagePercentage = BigInt(2e16) // 0.02 ETH

async function main() {
	// Obtain reference to contract and ABI.
	const CopyableSportsAMM = await ethers.getContractFactory(contractName)
	console.log(`Deploying ${contractName} to`, network.name)

	// Validate if required properties are set
	if (!SPORT_MARKETS_AMM_ADDRESS || !SUSD_ADDRESS) {
		throw new Error('Missing required parameter for deployment')
	}

	// Get the first account from the list of 20 created for you by Hardhat
	const [owner] = await ethers.getSigners()

	// Deploy logic contract using the proxy pattern.
	const copyableSportsAMM = await upgrades.deployProxy(
		CopyableSportsAMM,

		// Since the logic contract has an initialize() function
		// we need to pass in the arguments to the initialize()
		// function here.
		[owner.address, SPORT_MARKETS_AMM_ADDRESS, SUSD_ADDRESS, maxAllowedPegSlippagePercentage],

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
