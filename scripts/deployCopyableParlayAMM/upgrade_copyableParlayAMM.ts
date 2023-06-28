import { ethers, upgrades, network } from 'hardhat'

import { getDeploymentAddress } from '../utils/helpers'

const contractName = 'CopyableParlayAMM'

async function main() {
	// Optimism Goerli copyableParlayAMM address
	const deployedProxyAddress = getDeploymentAddress(contractName, network.name)

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
