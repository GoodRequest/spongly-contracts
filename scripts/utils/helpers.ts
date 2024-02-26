import { readFileSync, writeFileSync, existsSync } from 'fs'
import { Network } from 'hardhat/types'
import path from 'path'

import { NETWORK, SUBGRAPH_API_URL } from './enums'

export const DEPLOYMENTS_PATH = path.resolve(process.cwd(), 'scripts', 'utils', 'deployments.json')

const parseDeployments = () => {
	if (existsSync(DEPLOYMENTS_PATH)) {
		const deployments = readFileSync(DEPLOYMENTS_PATH, { encoding: 'utf-8' })

		return JSON.parse(deployments)
	}
}

export const setDeploymentAddress = (contractName: string, contractAddress: string, network: string): void => {
	const deployments = parseDeployments()

	if (!(network in deployments)) {
		deployments[network] = {}
	}

	deployments[network][contractName] = contractAddress

	writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 4))
}

export const getDeploymentAddress = (contractName: string, network: string): string => {
	const deployments = parseDeployments()

	if (!(network in deployments)) {
		throw new Error('Network not found')
	}

	return deployments[network][contractName]
}

export const getSubgraphApiPath = (network: { name: string }) => {
	switch (network.name) {
		case NETWORK.OPTIMISM_ETHEREUM:
			return SUBGRAPH_API_URL.OPTIMISTIC_MAINNET

		case NETWORK.OPTIMISM_GOERLI:
			return SUBGRAPH_API_URL.OPTIMISTIC_GOERLI

		case NETWORK.ARBITRUM_ONE:
			return SUBGRAPH_API_URL.ARBITRUM_ONE

		case NETWORK.BASE_MAINNET:
			return SUBGRAPH_API_URL.BASE_MAINNET

		default:
			throw new Error(`Unsupported network ${network.name}`)
	}
}