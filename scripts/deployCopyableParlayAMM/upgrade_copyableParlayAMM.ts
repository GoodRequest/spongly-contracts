import { ethers, upgrades, network } from 'hardhat'

import { getDeploymentAddress } from '../utils/helpers'

const contractName = 'CopyableParlayAMM'

async function upgrade() {
	const deployedProxyAddress = getDeploymentAddress(contractName, network.name)

	const CopyableParlayAMM = await ethers.getContractFactory(contractName)
	console.log(`Upgrading ${contractName}...`)

	await upgrades.upgradeProxy(deployedProxyAddress, CopyableParlayAMM)
	console.log(`${contractName} upgraded`)
}

upgrade()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
