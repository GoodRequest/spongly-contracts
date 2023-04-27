const { ethers, upgrades } = require('hardhat')

const contractName = 'CopyableParlayAMM'

async function main() {
	// Optimism goerli copyableParlayAMM address
	const deployedProxyAddress = '0x3F5f42246c48cc6ac574297c84A81764a48f92ee'

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
