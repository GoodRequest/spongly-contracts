export const getTicketsQuery = /* GraphQL */ `
	query getTickets($skipParlay: Int!, $firstParlay: Int!, $skipSingle: Int!, $firstSingle: Int!, $dateFrom: Int!, $dateTo: Int!, $ignoreAccount: String!) {
		parlayMarkets(
			first: $firstParlay
			skip: $skipParlay
			orderBy: timestamp
			orderDirection: desc
			where: { timestamp_gte: $dateTo, timestamp_lte: $dateFrom }
		) {
			id
			claimed
			sUSDPaid
			timestamp
			won
			account
			totalAmount
			sportMarketsFromContract
			marketQuotes
			sportMarkets(first: 10, skip: 0) {
				isCanceled
				isResolved
			},
			positions(first: 10, skip: 0) {
				claimable
				id
				side
				market {
					id
					address
					betType
					finalResult
					isCanceled
					isOpen
					isPaused
					isResolved
					maturityDate
					homeOdds
					awayOdds
					drawOdds
				}
			}
		}
		positionBalances(
			first: $firstSingle
			skip: $skipSingle
			orderBy: timestamp
			orderDirection: desc
			where: { timestamp_gte: $dateTo, timestamp_lte: $dateFrom, account_not: $ignoreAccount }
		) {
			account
			amount
			id
			sUSDPaid
			timestamp
			position {
				side
				id
				claimable
				market {
					address
					betType
					finalResult
					id
					isCanceled
					isOpen
					isPaused
					isResolved
					total
					timestamp
					resultDetails
					maturityDate
					homeOdds
					awayOdds
					drawOdds
				}
			}
		}
	}
`
