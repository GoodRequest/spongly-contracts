// The Open Zeppelin upgrades plugin adds the `upgrades` property
// to the Hardhat Runtime Environment.
import {ethers, getNamedAccounts, network, upgrades} from 'hardhat'

import { getDeploymentAddress, setDeploymentAddress } from '../utils/helpers'
import {Contract} from "ethers";

const contractName = 'CopyableParlayAMM'

// get the addresses of the deployed contracts
const PARLAY_MARKETS_AMM_ADDRESS = getDeploymentAddress('ParlayMarketsAMM', network.name)
const SUSD_ADDRESS = getDeploymentAddress('ProxysUSD', network.name)
const maxAllowedPegSlippagePercentage = BigInt(2e16) // 0.02 ETH

export async function deploy(): Promise<Contract> {
	// Obtain reference to contract and ABI.
	const Box =  await ethers.getContractFactory(contractName)

	// Validate if required properties are set
	if (!PARLAY_MARKETS_AMM_ADDRESS || !SUSD_ADDRESS) {
		throw new Error('Missing required parameter for deployment')
	}
	// Get the first account from the list of 20 created for you by Hardhat
	const { deployer } = await getNamedAccounts()

	// Deploy logic contract using the proxy pattern.
	const copyableParlayAMM = await upgrades.deployProxy(
		Box,

		// Since the logic contract has an initialize() function
		// we need to pass in the arguments to the initialize()
		// function here.
		[deployer, PARLAY_MARKETS_AMM_ADDRESS, SUSD_ADDRESS, maxAllowedPegSlippagePercentage],

		// We don't need to expressly specify this
		// as the Hardhat runtime will default to the name 'initialize'
		{ initializer: 'initialize' }
	)

	// store the contract address in the deployment addresses json
	setDeploymentAddress(contractName, copyableParlayAMM.address, network.name)

	return copyableParlayAMM
}
