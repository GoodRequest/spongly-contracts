const { ethers, upgrades } = require('hardhat')

const contractName = 'CopyableParlayAMM'

async function main() {
	// Optimism Goerli copyableParlayAMM address
	const deployedProxyAddress = '0x54E30C68cB4B2a11c0B95131a2249C8663F56796'

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
