import { ethers } from 'hardhat'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

const contractAddress = '0x6C915a1fD6871903A02D802F4FFe0C4cdd4dc7b3'
const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'abi', 'CopyableParlayAMM.json')).toString())

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_DEV1!
const DEV_ADDRESS = process.env.WALLET_PUBLIC_KEY_DEV1!
const INFURA_API_KEY = process.env.INFURA!

const infuraProvider = new ethers.providers.InfuraProvider('optimism-goerli', INFURA_API_KEY)
const signer = new ethers.Wallet(PRIVATE_KEY, infuraProvider)

const copyableParlayAMMContract = new ethers.Contract(contractAddress, contractABI, signer)

async function main() {
	const copyableParlayAMM = await copyableParlayAMMContract.copyFromParlayWithReferrer('0x0ec9d8dac2178b041f85f60e3cf13cfaa3d23e0e', 4000000000000000000n)

	console.log(copyableParlayAMM)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
