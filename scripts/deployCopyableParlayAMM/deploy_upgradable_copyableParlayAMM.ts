// The Open Zeppelin upgrades plugin adds the `upgrades` property
// to the Hardhat Runtime Environment.
import { ethers, network, upgrades } from 'hardhat'
import { setDeploymentAddress } from '../utils/helpers'

const contractName = 'CopyableParlayAMM'

const OP_GOERLI_PARLAY_MARKETS_AMM_ADDRESS = '0x0ec9D8Dac2178b041f85f60E3cF13CfaA3d23e0e'
const OP_GOERLI_PARLAY_MARKET_DATA_ADDRESS = '0x54822552F51cd15c09bF360958A8e417989a925b'
const OP_GOERLI_SUSD_ADDRESS = '0xE1ceaa829525a08C1d39A5CEBe4b42aF58d77198'
const REFFERER_ADDRESS = '0xF21e489f84566Bd82DFF2783C80b5fC1A9dca608'

const maxAllowedPegSlippagePercentage = BigInt(2e16) // 0.02 ETH

async function main() {
	// Obtain reference to contract and ABI.
	const CopyableParlayAMM = await ethers.getContractFactory(contractName)
	console.log(`Deploying ${contractName} to`, network.name)

	// Get the first account from the list of 20 created for you by Hardhat
	const [account1] = await ethers.getSigners()

	// Deploy logic contract using the proxy pattern.
	const copyableParlayAMM = await upgrades.deployProxy(
		CopyableParlayAMM,

		// Since the logic contract has an initialize() function
		// we need to pass in the arguments to the initialize()
		// function here.
		[
			account1.address,
			OP_GOERLI_PARLAY_MARKETS_AMM_ADDRESS,
			OP_GOERLI_PARLAY_MARKET_DATA_ADDRESS,
			OP_GOERLI_SUSD_ADDRESS,
			REFFERER_ADDRESS,
			maxAllowedPegSlippagePercentage
		],

		// We don't need to expressly specify this
		// as the Hardhat runtime will default to the name 'initialize'
		{ initializer: 'initialize' }
	)

	await copyableParlayAMM.deployed()

	console.log(`${contractName} deployed to:`, copyableParlayAMM.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
