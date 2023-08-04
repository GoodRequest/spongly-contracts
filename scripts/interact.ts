import { ethers, network } from 'hardhat'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import { ZERO_ADDRESS } from '../scripts/utils/constants'
import { getDeploymentAddress } from './utils/helpers'

dotenv.config()

const contractAddress = getDeploymentAddress('CopyableParlayAMM', 'optimisticGoerli')
const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'abi', 'CopyableParlayAMM.json')).toString())

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_DEV1!
const INFURA_API_KEY = process.env.INFURA!

const infuraProvider = new ethers.providers.InfuraProvider('optimism-goerli', INFURA_API_KEY)
const signer = new ethers.Wallet(PRIVATE_KEY, infuraProvider)

// contracts
const copyableParlayAMMContract = new ethers.Contract(contractAddress, contractABI, signer)

async function main() {
	const transaction = await copyableParlayAMMContract.buyFromParlayWithCopy(
		['0x10b6f151a61923e56796fab88711729249278466', '0xacace46a112584b6a4353fe0daf5211992641e37', '0xae7da1e2c2cde055601ebe1531daff94e52ef9ed'], // markets
		[1, 1, 0], // market's positions
		5000000000000000000n, // buyIn
		20000000000000000n, // additionalSlippage
		11196465205970387759n, // expectedPayout
		ZERO_ADDRESS, // different reciepent
		ZERO_ADDRESS, // referrer
		'0x0002288b97af304e29a608fa0e225eb1c8b5a79b', // parlay address
		true // modified
	)

	await transaction.wait()

	// copyableParlayAMM.buyFromParlay(['0x0ec9d8dac2178b041f85f60e3cf13cfaa3d23e0e'], [], 4000000000000000000n)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
