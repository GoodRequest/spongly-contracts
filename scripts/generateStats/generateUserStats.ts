import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { network } from 'hardhat'
import { create } from 'ipfs-http-client'
import dotenv from 'dotenv'
import { greenBright, redBright } from 'console-log-colors'

dotenv.config()

import { OP_BASE_URL, OP_GOERLI_BASE_URL } from '../utils/constants'
import { MARKET_PROPERTY, NETWORK, THE_GRAPH_OPERATION_NAME } from '../utils/enums'
import { getParlayMarketsAscending, getTicketsQuery } from '../utils/queries'
import { ParlayMarket, Position, PositionBalance } from '../../types/types'

const BATCH_SIZE = 1000
const MAX_ITERATIONS = 6

const IPFS_TOKEN = Buffer.from(`${process.env.IPFS_USER}:${process.env.IPFS_PASS}`).toString('base64')

const ipfsClient = create({ url: process.env.IPFS_URL, headers: { authorization: `BASIC ${IPFS_TOKEN}` } })

const theGraphClient = axios.create({
	baseURL: network.name === NETWORK.OPTIMISM_GOERLI ? OP_GOERLI_BASE_URL : OP_BASE_URL,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	}
})

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

const fetchAllTickets = async () => {
	const tickets: any[] = []

	const ticketQueryProps = {
		firstParlay: BATCH_SIZE,
		firstSingle: BATCH_SIZE
	}

	// NOTE: 6000 records is limit of TheGraph's GraphQL API
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const skip = i * BATCH_SIZE

		// getting the latest parlay and singles data
		const graphqlQuery = {
			operationName: THE_GRAPH_OPERATION_NAME.GET_PARLAY_MARKET,
			variables: {
				...ticketQueryProps,
				skipParlay: skip,
				skipSingle: skip
			},
			query: getTicketsQuery
		}

		// getting the oldest parlay data
		const graphqlParlayMarketAscendingQuery = {
			operationName: THE_GRAPH_OPERATION_NAME.GET_PARLAY_MARKET_ASCENDING,
			variables: {
				firstParlay: BATCH_SIZE,
				skipParlay: skip,
				orderDirection: 'asc'
			},
			query: getParlayMarketsAscending
		}

		const [batch, parlayMarketsBatch] = await Promise.all([
			await theGraphClient.post('', graphqlQuery),
			await theGraphClient.post('', graphqlParlayMarketAscendingQuery)
		])

		if (batch.data.errors && batch.data.errors.length) {
			throw new Error(`Error: ${batch.data.errors.join('; ')}`)
		}

		if (parlayMarketsBatch.data.errors && parlayMarketsBatch.data.errors.length) {
			throw new Error(`Error: ${parlayMarketsBatch.data.errors.join('; ')}`)
		}

		const manchesterUnited = [...batch.data.data.parlayMarkets, ...batch.data.data.positionBalances, ...parlayMarketsBatch.data.data.parlayMarkets]

		tickets.push(manchesterUnited)
	}

	return tickets.flat()
}

const writeStatsToFile = async (stats: Record<string, any>, processStart: string) => {
	const fileName = `stats-${network.name}-${processStart}.json`
	const statsFile = await fs.open(path.join(process.cwd(), 'scripts', 'generateStats', 'data', fileName), 'w')

	await statsFile.writeFile(JSON.stringify(stats))
	await statsFile.close()
}

const formatStats = (tickets: any[], processStart: string) => {
	const uniqUsers = [...new Set(tickets.map((ticket) => ticket.account))]

	const userSuccessRateMapping = uniqUsers.map((account) => {
		const userTickets = tickets.filter((ticket) => ticket.account === account)
		return {
			account,
			successRate: getSuccessRateForTickets(userTickets),
			totalTickets: userTickets.length
		}
	})

	return {
		processStart,
		context: {
			network: network.name,
			ticketsCount: tickets.length,
			uniqueUsersCount: uniqUsers.length
		},
		stats: userSuccessRateMapping
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
		const processStart = new Date().toISOString()

		const tickets = await fetchAllTickets()

		const stats = formatStats(tickets, processStart)

		await handleIpfsDeployment(stats)

		await writeStatsToFile(stats, processStart)

		console.log(greenBright('Stats generated successfully!'))
	} catch (error) {
		console.error(redBright(error))
		process.exit(1)
	}
}

main()
