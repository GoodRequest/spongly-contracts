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
					tags
					gameId
				}
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
			won
			account
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
				}
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
				}
			}
		}
	}
`
