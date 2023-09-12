export const getParlayMarketsAscending = /* GraphQL */ `
	query getParleyMarket($skipParlay: Int!, $firstParlay: Int!, $orderDirection: String!) {
		parlayMarkets(first: $firstParlay, skip: $skipParlay, orderBy: timestamp, orderDirection: $orderDirection) {
			id
			claimed
			sUSDPaid
			timestamp
			totalQuote
			won
			account
			totalAmount
			lastGameStarts
			marketQuotes
			positions(first: 10, skip: 0) {
				claimable
				id
				side
				market {
					id
					address
					doubleChanceMarketType
					homeTeam
					homeScore
					homeOdds
					awayOdds
					awayScore
					awayTeam
					betType
					finalResult
					isCanceled
					isOpen
					isPaused
					isResolved
					maturityDate
					tags
					gameId
				}
			}
			sportMarkets {
				gameId
			}
		}
	}
`

export const getTicketsQuery = /* GraphQL */ `
	query getParleyMarket($skipParlay: Int!, $firstParlay: Int!, $skipSingle: Int!, $firstSingle: Int!) {
		parlayMarkets(first: $firstParlay, skip: $skipParlay, orderBy: timestamp, orderDirection: desc) {
			id
			claimed
			sUSDPaid
			timestamp
			totalQuote
			won
			account
			totalAmount
			lastGameStarts
			marketQuotes
			positions(first: 10, skip: 0) {
				claimable
				id
				side
				market {
					id
					address
					doubleChanceMarketType
					homeTeam
					homeScore
					homeOdds
					awayOdds
					awayScore
					awayTeam
					betType
					finalResult
					isCanceled
					isOpen
					isPaused
					isResolved
					maturityDate
					tags
					gameId
				}
			}
			sportMarkets {
				gameId
			}
		}
		positionBalances(first: $firstSingle, skip: $skipSingle) {
			account
			amount
			id
			sUSDPaid
			position {
				side
				id
				claimable
				market {
					address
					awayOdds
					awayScore
					awayTeam
					betType
					downAddress
					drawAddress
					drawOdds
					doubleChanceMarketType
					finalResult
					homeOdds
					homeScore
					homeTeam
					id
					isCanceled
					isOpen
					isPaused
					isResolved
					total
					timestamp
					resultDetails
					tags
					maturityDate
					gameId
				}
			}
		}
	}
`
