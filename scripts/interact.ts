import { ethers } from 'hardhat'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const contractAddress = '0x3F5f42246c48cc6ac574297c84A81764a48f92ee'
const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'abi', 'CopyableParlayAMM.json')).toString())

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_DEV1!
const DEV_ADDRESS = process.env.WALLET_PUBLIC_KEY_DEV1!
const INFURA_API_KEY = process.env.INFURA

const infuraProvider = new ethers.providers.InfuraProvider('optimism-goerli', INFURA_API_KEY)
const signer = new ethers.Wallet(PRIVATE_KEY, infuraProvider)

const copyableParlayAMMContract = new ethers.Contract(contractAddress, contractABI, signer)

async function main() {
	const copyableParlayAMM = await copyableParlayAMMContract.buyFromParlayWithReferrer(
		['0x268ff41eea382bb82daf251b34ce82057fff21ce'],
		[0],
		7524097845257440486n,
		ZERO_ADDRESS,
		DEV_ADDRESS
	)

	console.log(copyableParlayAMM)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
