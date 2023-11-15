import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { network } from 'hardhat'
import { create } from 'ipfs-http-client'
import dotenv from 'dotenv'
import { greenBright, redBright } from 'console-log-colors'

dotenv.config()

import { IGNORE_ACCCOUNTS_BY_NETWORK, OVERTIME_SUBGRAPH_BASE_URL } from '../utils/constants'
import { MARKET_PROPERTY, NETWORK, SUBGRAPH_API_PATH, THE_GRAPH_OPERATION_NAME } from '../utils/enums'
import { getTicketsQuery } from '../utils/queries'
import { ParlayMarket, Position, PositionBalance } from '../../types/types'
import { Network } from 'hardhat/types'
import { subtractMonths } from '../utils/helpers'

// constants
const BATCH_SIZE = 1000
const MAX_ITERATIONS = 6 // NOTE: 6000 records is limit of TheGraph's subgraph GraphQL API

const IPFS_TOKEN = Buffer.from(`${process.env.IPFS_USER}:${process.env.IPFS_PASS}`).toString('base64')

const ipfsClient = create({ url: process.env.IPFS_URL, headers: { authorization: `BASIC ${IPFS_TOKEN}` } })

const theGraphClient = axios.create({
	baseURL: OVERTIME_SUBGRAPH_BASE_URL,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	}
})

const getSubgraphApiPath = (network: Network) => {
	switch (network.name) {
		case NETWORK.OPTIMISM_MAINNET:
			return SUBGRAPH_API_PATH.OPTIMISM_MAINNET

		case NETWORK.OPTIMISM_GOERLI:
			return SUBGRAPH_API_PATH.OPTIMISM_GOERLI

		default:
			return SUBGRAPH_API_PATH.OPTIMISM_MAINNET
	}
}

export const getPositions = (data: ParlayMarket | PositionBalance): Array<Position> => {
	let positions = [] as Array<Position>

	if (MARKET_PROPERTY.POSITIONS in data) {
		positions = data.positions
	}

	if (MARKET_PROPERTY.POSITION in data) {
		positions.push(data.position)
	}

	return positions
}

const isWinningTicket = (market: ParlayMarket | PositionBalance) => {
	if (MARKET_PROPERTY.WON in market) {
		return market.won
	}

	return market.position.claimable
}

export const getSuccessRateForTickets = (tickets: Array<ParlayMarket | PositionBalance>): number => {
	const resolvedTickets = tickets.filter((ticket) => {
		const positions = getPositions(ticket)
		return positions.every((position) => position.market.isResolved)
	})

	const winningTickets = resolvedTickets.filter((ticket) => isWinningTicket(ticket))
	if (!resolvedTickets.length) return +(0).toFixed(2)

	return +((winningTickets.length / resolvedTickets.length) * 100).toFixed(2)
}

const fetchAllTickets = async (fromDate: Date) => {
	const tickets: any[] = []

	const ticketQueryProps = {
		firstParlay: BATCH_SIZE,
		firstSingle: BATCH_SIZE,
		dateFrom: Math.floor(fromDate.getTime() / 1000),
		dateTo: Math.floor(subtractMonths(fromDate, 1).getTime() / 1000),
		ignoreAccount: IGNORE_ACCCOUNTS_BY_NETWORK[network.name] || null
	}

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const skip = i * BATCH_SIZE

		// getting the latest parlay and singles data
		const graphqlQuery = {
			operationName: THE_GRAPH_OPERATION_NAME.GET_TICKETS,
			variables: {
				...ticketQueryProps,
				skipParlay: skip,
				skipSingle: skip
			},
			query: getTicketsQuery
		}

		const mixedBatch = await theGraphClient.post(getSubgraphApiPath(network), graphqlQuery)

		if (mixedBatch.data.errors && mixedBatch.data.errors.length) {
			throw new Error('BATCH_FETCHING ' + mixedBatch.data.errors.join('; '))
		}

		const manchesterUnited = [...mixedBatch.data.data.parlayMarkets, ...mixedBatch.data.data.positionBalances]

		tickets.push(manchesterUnited)
	}

	return tickets.flat()
}

const writeStatsToFile = async (stats: Record<string, any>, fromDate: Date) => {
	const fileName = `stats-${network.name}-${fromDate.toISOString()}.json`
	const destinationFilePath = path.join(process.cwd(), 'scripts', 'generateStats', 'data', fileName)

	await fs.writeFile(destinationFilePath, JSON.stringify(stats))
}

const formatStats = (tickets: any[], processStart: Date) => {
	const uniqUsers = [...new Set(tickets.map((ticket) => ticket.account))]

	const stats = uniqUsers.map((account) => {
		const userTickets = tickets.filter((ticket) => ticket.account === account)

		return {
			ac: account,
			sr: getSuccessRateForTickets(userTickets),
			tt: userTickets.length
		}
	})

	return {
		processStart: processStart.toISOString(),
		context: {
			network: network.name,
			ticketsCount: tickets.length,
			uniqueUsersCount: uniqUsers.length
		},
		stats
	}
}

const handleIpfsDeployment = async (stats: Record<string, any>) => {
	const { cid } = await ipfsClient.add(JSON.stringify(stats))

	const response = await axios.post(
		`${process.env.IPFS_URL}/name/publish?key=${process.env.IPNS_KEY}&arg=${cid}`,
		{},
		{
			headers: {
				authorization: `BASIC ${IPFS_TOKEN}`
			}
		}
	)

	console.log(response.data)
}

async function main() {
	try {
		const processStart = new Date()

		const tickets = await fetchAllTickets(processStart)

		console.log(`Fetched ${tickets.length} tickets`)

		const stats = formatStats(tickets, processStart)

		await handleIpfsDeployment(stats)

		if (process.env.GENERATE_FILE) {
			await writeStatsToFile(stats, processStart)
		}

		console.log(greenBright('Stats generated successfully!'))
		process.exit(0)
	} catch (error) {
		console.error(redBright(error))
		process.exit(1)
	}
}

main()
