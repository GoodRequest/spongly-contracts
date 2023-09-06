import { ethers, network } from 'hardhat'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import { GNOSIS_SAFE_WALLET_ADDRESS, ZERO_ADDRESS } from '../scripts/utils/constants'
import { getDeploymentAddress } from './utils/helpers'

dotenv.config()

// const contractAddress = getDeploymentAddress('CopyableParlayAMM', 'optimisticGoerli')
const contractAddress = getDeploymentAddress('CopyableSportsAMM', 'optimisticGoerli')
// const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'abi', 'CopyableParlayAMM.json')).toString())
const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'abi', 'CopyableSportsAMM.json')).toString())

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_DEV1!
const INFURA_API_KEY = process.env.INFURA!

const infuraProvider = new ethers.providers.InfuraProvider('optimism-goerli', INFURA_API_KEY)
const signer = new ethers.Wallet(PRIVATE_KEY, infuraProvider)

// contracts
const copyableParlayAMMContract = new ethers.Contract(contractAddress, contractABI, signer)

async function main() {
	if (!contractAddress) {
		throw new Error('Contract address not found')
	}

	if (!contractABI) {
		throw new Error('Contract ABI not found')
	}

	// const transaction = await copyableParlayAMMContract.buyFromParlayWithCopy(
	// 	['0xc7d8a5b42af2a6b00056e8c70f46f70609c1bdf0', '0x105f394b4cbb4345bb05b0cc9acc60970867bf6b'],
	// 	[0, 1], // market's positions
	// 	5000000000000000000n, // buyIn
	// 	20000000000000000n, // additionalSlippage
	// 	39302659044270091n, // expectedPayout
	// 	ZERO_ADDRESS, // different reciepent
	// 	GNOSIS_SAFE_WALLET_ADDRESS, // refferer
	// 	ZERO_ADDRESS,
	// 	false
	// 	// '0x0002288b97af304e29a608fa0e225eb1c8b5a79b', // parlay address
	// 	// true // modified
	// )

	// const transaction = await copyableParlayAMMContract.buyFromAMMWithCopy(
	// 	'0xF1CC50F300442381651135F8eeAB0702acc43f7D',
	// 	1, // market's positions
	// 	12940000000000000000n, // buyIn
	// 	20000000000000000n, // additionalSlippage
	// 	9993752342094739907n, // expectedPayout
	// 	GNOSIS_SAFE_WALLET_ADDRESS, // refferer
	// 	`${ZERO_ADDRESS} - ${ZERO_ADDRESS}`,
	// 	// '0x0002288b97af304e29a608fa0e225eb1c8b5a79b', // parlay address
	// )
	const transaction = await copyableParlayAMMContract.buyFromAMMWithCopy(
		"0xc49d1ac9831b272c8700c745179e5b97f4749691",
		0,
		9000000000000000000n,
		20000000000000000n,
		0x4563918244f40000n,
		ZERO_ADDRESS,
		ZERO_ADDRESS,
	)

	console.log('transaction', transaction.hash)

	await transaction.wait()

	// copyableParlayAMM.buyFromParlay(['0x0ec9d8dac2178b041f85f60e3cf13cfaa3d23e0e'], [], 4000000000000000000n)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
