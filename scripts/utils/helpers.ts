import { readFile, writeFile } from 'fs/promises'
import path from 'path'

export const DEPLOYMENTS_PATH = path.resolve(process.cwd(), 'scripts', 'utils', 'deployments.json')

const parseDeployments = async () => {
	const deployments = await readFile(DEPLOYMENTS_PATH, 'utf-8')
	return JSON.parse(deployments)
}

export const setDeploymentAddress = async (contractName: string, contractAddress: string, network: string): Promise<void> => {
	const deployments = await parseDeployments()

	deployments[network][contractName] = contractAddress

	writeFile(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 2))
}

export const getDeploymentAddress = async (contractName: string, network: string): Promise<string> => {
	const deployments = await parseDeployments()

	return deployments[network][contractName]
}
