import { setDeploymentAddress } from '../utils/helpers'

const { ethers, upgrades, network } = require('hardhat')

const contractName = 'CopyableParlayAMM'

async function main() {
	// Optimism Goerli copyableParlayAMM address
	const deployedProxyAddress = '0x407085F8a5C4B9ED06d4b18e7A14d266b3C64EaB'

	const CopyableParlayAMM = await ethers.getContractFactory(contractName)
	console.log(`Upgrading ${contractName}...`)

	await upgrades.upgradeProxy(deployedProxyAddress, CopyableParlayAMM)
	console.log(`${contractName} upgraded`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
