import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { create, globSource } from 'ipfs-http-client'
import { greenBright } from 'console-log-colors'
import dotenv from 'dotenv'

dotenv.config()

import { MAX_BATCH_SIZE, IGNORE_ACCCOUNTS_BY_NETWORK, MAX_ITERATIONS_COUNT, OPTIMISM_DIVISOR, NETWORK_IDS, ARBITRUM_DIVISOR, BASE_DIVISOR } from '../utils/constants'
import { MARKET_PROPERTY, THE_GRAPH_OPERATION_NAME, USER_TICKET_TYPE } from '../utils/enums'
import { getTicketsQuery } from '../utils/queries'
import { ParlayMarket, Position, PositionBalance, PositionType, ProcessNetwork, UserPosition, UserTicket } from '../../types/types'
import { getSubgraphApiPath } from '../utils/helpers'
import dayjs from 'dayjs'

const IPFS_TOKEN = Buffer.from(`${process.env.IPFS_USER}:${process.env.IPFS_PASS}`).toString('base64')

const ipfsClient = create({ url: process.env.IPFS_URL, headers: { authorization: `BASIC ${IPFS_TOKEN}` } })

const round = (num: number, precision: number) => {
  const modifier = 10 ** precision
  return Math.round(num * modifier) / modifier
}

const floor = (num: number, precision: number) => {
  const modifier = 10 ** precision
  return Math.floor(num * modifier) / modifier
}

export const getDividerByNetworkId = (networkId: number) => {
	switch (networkId) {
		case NETWORK_IDS.OPTIMISM:
			return OPTIMISM_DIVISOR
		case NETWORK_IDS.OPTIMISM_GOERLI:
			return OPTIMISM_DIVISOR
		case NETWORK_IDS.ARBITRUM:
			return ARBITRUM_DIVISOR
		case NETWORK_IDS.BASE:
			return BASE_DIVISOR
		default:
			// eslint-disable-next-line no-console
			console.error('Error occured durring getDividerByNetworkId()')
			return 0
	}
}

export const getUserTicketType = (ticket: UserTicket) => {
	const userTickets = ticket.positions ? ticket.positions : [ticket.position as UserPosition]

	const canceled = userTickets.filter((item) => item.market.isCanceled)

	if (canceled.length >= 1) {
		return USER_TICKET_TYPE.CANCELED
	}

	const finished = userTickets.filter((item) => item.market.isResolved)
	if (finished.length === userTickets.length) {
		if (ticket?.won) {
			return USER_TICKET_TYPE.SUCCESS
		}

		if (ticket?.won === false) {
			const won = userTickets.filter((item) => item.claimable)

			if (won.length === userTickets.length) {
				return USER_TICKET_TYPE.SUCCESS
			}

			return USER_TICKET_TYPE.MISS
		}

		if (userTickets[0].claimable) {
			return USER_TICKET_TYPE.SUCCESS
		}
		
		return USER_TICKET_TYPE.MISS
	}

	if (finished.length > 0) {
		const lossMatch = finished.filter((item) => !item.claimable)
		if (lossMatch.length !== 0) return USER_TICKET_TYPE.MISS
	}

	const paused = userTickets.filter((item) => item.market.isPaused)

	if (paused.length === userTickets.length) {
		return USER_TICKET_TYPE.PAUSED
	}

	const ongoing = userTickets.find((item) => !item.market.isResolved && !item.market.isCanceled && !item.market.isOpen)

	const now = dayjs()
	const playingNow = userTickets.filter((item) => {
		const maturityDate = dayjs(Number(item.market.maturityDate) * 1000)
		if (maturityDate.isAfter(now)) return false
		return true
	})

	if (ongoing || playingNow.length !== 0) {
		return USER_TICKET_TYPE.ONGOING
	}

	return USER_TICKET_TYPE.OPEN
}

export const getPositions = (data: ParlayMarket | PositionBalance): Position[] => {
	let positions = [] as Position[]

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

export const getCanceledClaimAmount = (ticket: UserTicket) => {
	// parlay
	if (ticket?.positions) {
		let totalAmount = +(ticket.totalAmount || 0) / OPTIMISM_DIVISOR

		ticket.sportMarketsFromContract?.forEach((address, index) => {
			const market = ticket.sportMarkets?.find((market) => market.address === address)
			if (market && market.isCanceled && ticket?.marketQuotes?.[index]) {
				totalAmount *= Number(ticket.marketQuotes[index]) / OPTIMISM_DIVISOR
			}
		})

		return floor(totalAmount, 2).toFixed(2)
	}

	// single ticket
	let claimAmount = 0
	const match = ticket.position as UserPosition
	if (match.isResolved && match.isCanceled) {
		const match = ticket.position as UserPosition
		switch (match.side) {
			case PositionType.Away: {
				claimAmount += (Number(match.market.homeOdds) / OPTIMISM_DIVISOR) * ((ticket.amount || 0) / OPTIMISM_DIVISOR)
				break
			}
			case PositionType.Draw: {
				claimAmount += match.market.drawOdds ? (Number(match.market.drawOdds) / OPTIMISM_DIVISOR) * ((ticket.amount || 0) / OPTIMISM_DIVISOR) : 0
				break
			}

			case PositionType.Home: {
				claimAmount += (Number(match.market.homeOdds) / OPTIMISM_DIVISOR) * ((ticket.amount || 0) / OPTIMISM_DIVISOR)
				break
			}
			default:
				claimAmount += 0
		}
	}
	return floor(claimAmount, 2).toFixed(2)
}

export const getProfit = (wonTickets: UserTicket[], lostTickets: UserTicket[], cancelledTickets: UserTicket[], networkID?: number) => {
	if (!networkID) return 0

	let profit = 0

	wonTickets?.forEach((ticket) => {
		profit += (ticket.amount || ticket.totalAmount || 0) / OPTIMISM_DIVISOR - ticket.sUSDPaid / getDividerByNetworkId(networkID)
	})

	lostTickets?.forEach((ticket) => {
		profit -= ticket.sUSDPaid / getDividerByNetworkId(networkID)
	})

	cancelledTickets?.forEach((ticket) => {
		profit += Number(getCanceledClaimAmount(ticket)) - ticket.sUSDPaid / getDividerByNetworkId(networkID)
	})

	return round(profit, 2).toFixed(2)
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

const fetchAllTickets = async (fromDate: Date, network: { name: string }) => {
	const tickets: any[] = []

	const theGraphClient = axios.create({
		baseURL: getSubgraphApiPath(network),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		}
	})

	const ticketQueryProps = {
		firstParlay: MAX_BATCH_SIZE,
		firstSingle: MAX_BATCH_SIZE,
		dateFrom: dayjs(fromDate).unix(),
		dateTo: dayjs(fromDate).subtract(1, 'month').unix(),
		ignoreAccount: IGNORE_ACCCOUNTS_BY_NETWORK[network.name] || null
	}

	for (let i = 0; i < MAX_ITERATIONS_COUNT; i++) {
		const skip = i * MAX_BATCH_SIZE

		const graphqlQuery = {
			operationName: THE_GRAPH_OPERATION_NAME.GET_TICKETS,
			variables: {
				...ticketQueryProps,
				skipParlay: skip,
				skipSingle: skip
			},
			query: getTicketsQuery
		}

		// NOTE: empty string is because graphql endpoint is already set in axios instance
		const mixedBatch = await theGraphClient.post('', graphqlQuery)

		if (mixedBatch.data.errors && mixedBatch.data.errors.length) {
			console.error({ errors: mixedBatch.data.errors })
			throw new Error('BATCH_FETCHING')
		}

		const manchesterUnited = [...mixedBatch.data.data.parlayMarkets, ...mixedBatch.data.data.positionBalances]

		tickets.push(manchesterUnited)
	}

	return tickets.flat()
}

const writeStatsToFile = async (stats: Record<string, any>, destinationFolderName: string, network: ProcessNetwork) => {
	const fileName = `${network.name}.json`
	const destinationFilePath = path.join(process.cwd(), 'scripts', 'generateStats', 'data', destinationFolderName, fileName)

	await fs.mkdir(path.dirname(destinationFilePath), { recursive: true })
	await fs.writeFile(destinationFilePath, JSON.stringify(stats))
}

const formatStats = (tickets: any[], processStart: Date, network: ProcessNetwork) => {
	const uniqUsers = [...new Set(tickets.map((ticket) => ticket.account))]

	const stats = uniqUsers.map((account) => {
		const userTickets = tickets.filter((ticket) => ticket.account === account)
		
		// filter user tickets by state (won, loss, cancel)
		const wonTickets = userTickets.filter((ticket) => getUserTicketType(ticket) === USER_TICKET_TYPE.SUCCESS)
 		const lostTickets = userTickets.filter((ticket) => getUserTicketType(ticket) === USER_TICKET_TYPE.MISS)
 		const cancelledTickets = userTickets.filter((ticket) => getUserTicketType(ticket) === USER_TICKET_TYPE.CANCELED)

		const pnl = +getProfit(wonTickets, lostTickets, cancelledTickets, network.id)

		return {
			ac: account,
			sr: getSuccessRateForTickets(userTickets),
			pnl,
			tt: userTickets.length
		}
	}).sort((a, b) => b.sr - a.sr)

	return {
		processStart: dayjs(processStart).toISOString(),
		context: {
			network: network.name,
			ticketsCount: tickets.length,
			uniqueUsersCount: uniqUsers.length,
			period: {
				dateFrom: dayjs(processStart).subtract(1, 'month').toISOString(),
				dateTo: dayjs(processStart).toISOString()
			}
		},
		stats
	}
}

const handleDeployment = async (destinationFolderName: string) => {
	let getRootCID = async () => {
		let lastCid
		for await (const file of ipfsClient.addAll(globSource(`./scripts/generateStats/data/${destinationFolderName}`, '**/*'), { wrapWithDirectory: true })) {
			lastCid = file.cid
		}
		return lastCid
	}

	const rootCid = await getRootCID()

	if (!rootCid) throw new Error('NO_ROOT_DIR_CID')

	const response = await axios.post(
		`${process.env.IPFS_URL}/name/publish?key=${process.env.IPNS_KEY}&arg=${rootCid}`,
		{},
		{
			headers: {
				authorization: `BASIC ${IPFS_TOKEN}`
			}
		}
	)

	console.log(response.data)
}

const handleCleanup = async (destinationFolderName: string) => {
	const destinationFilePath = path.join(process.cwd(), 'scripts', 'generateStats', 'data', destinationFolderName)

	await fs.rm(destinationFilePath, { recursive: true, force: true })
}

async function main() {
	try {
		const processStart = dayjs().toDate()

		const networks: ProcessNetwork[] = [
			{ id: 10, name: 'optimisticEthereum' },
			{ id: 42161, name: 'arbitrumOne' },
			{ id: 8453, name: 'baseMainnet' }
		]

		const destinationFolderName = `stats-${processStart.toISOString()}`

		for (const network of networks) {
			const tickets = await fetchAllTickets(processStart, network)

			const stats = formatStats(tickets, processStart, network)

			await writeStatsToFile(stats, destinationFolderName, network)
		}

		await handleDeployment(destinationFolderName)

		if (!process.env.DEBUG) {
			await handleCleanup(destinationFolderName)
		}

		console.log(greenBright('Stats generated successfully!'))
		process.exit(0)
	} catch (error) {
		console.error(error)
		process.exit(1)
	}
}

main()
