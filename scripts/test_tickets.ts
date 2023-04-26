import { ethers } from 'hardhat'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

const contractAddress = '0xf979ea3eB8A62a1A2bC915c39b8968A63Ef2E24e'
const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'abi', 'TicketSystem.json')).toString())

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_DEV1!
const INFURA_API_KEY = process.env.INFURA

const infuraProvider = new ethers.providers.InfuraProvider('optimism-goerli', INFURA_API_KEY)
const signer = new ethers.Wallet(PRIVATE_KEY, infuraProvider)

const ticketSystemContract = new ethers.Contract(contractAddress, contractABI, signer)

async function main() {
	const ticketSystem = await ticketSystemContract.createParlayTicket(['0xaac71ea2eda1ec4404320db3ae84f003867a4903'], [1], 1000000000000000005n)
	console.log(ticketSystem)
}

main()
