import { upgrades } from 'hardhat'

import { GNOSIS_SAFE_WALLET_ADDRESS } from '../utils/constants'

async function main() {
	console.log('Transferring ownership of ProxyAdmin...')

	// The owner of the ProxyAdmin can upgrade our contracts
	await upgrades.admin.transferProxyAdminOwnership(GNOSIS_SAFE_WALLET_ADDRESS)

	console.log('Transferred ownership of ProxyAdmin to:', GNOSIS_SAFE_WALLET_ADDRESS)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
