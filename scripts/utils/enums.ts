export enum NETWORK {
	OPTIMISM_MAINNET = 'optimisticMainnet',
	OPTIMISM_GOERLI = 'optimisticGoerli',
	ARBITRUM_MAINNET = 'arbitrumMainnet'
}

export enum THE_GRAPH_OPERATION_NAME {
	GET_PARLAY_MARKET = 'getParleyMarket',
	GET_PARLAY_MARKET_ASCENDING = 'getParleyMarketAscending',
	GET_SPORT_MARKET = 'getSportMarket'
}

export enum SUBGRAPH_API_PATH {
	OPTIMISM_MAINNET = '/sport-markets-optimism',
	OPTIMISM_GOERLI = '/sport-markets-optimism-goerli',
	ARBITRUM_MAINNET = '/sport-markets-arbitrum'
}

export enum MARKET_PROPERTY {
	POSITION = 'position',
	POSITIONS = 'positions',
	WON = 'won',
	CLAIMED = 'claimed',
	LAST_GAME_STARTS = 'lastGameStarts'
}

export const NETWORKS = [...Object.values(NETWORK)]
export const THE_GRAPH_OPERATION_NAMES = [...Object.values(THE_GRAPH_OPERATION_NAME)]
