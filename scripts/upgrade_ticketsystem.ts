const { ethers, upgrades } = require('hardhat')

const contractName = 'TicketSystem'

async function main() {
	// TODO Check this address is right before deploying.
	const deployedProxyAddress = '0xf979ea3eB8A62a1A2bC915c39b8968A63Ef2E24e'

	const TicketSystem = await ethers.getContractFactory(contractName)
	console.log(`Upgrading ${contractName}...`)

	await upgrades.upgradeProxy(deployedProxyAddress, TicketSystem)
	console.log(`${contractName} upgraded`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
