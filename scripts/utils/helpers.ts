import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

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

export const subtractMonths = (date: Date, months: number): Date => {
	date.setMonth(date.getMonth() - months)

	return date
}
