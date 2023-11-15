export enum NETWORK {
	OPTIMISM_MAINNET = 'optimisticMainnet',
	OPTIMISM_GOERLI = 'optimisticGoerli',
	ARBITRUM_MAINNET = 'arbitrumMainnet'
}

export enum ORDER_DIRECTION {
	ASC = 'asc',
	DESC = 'desc'
}

export enum THE_GRAPH_OPERATION_NAME {
	GET_TICKETS = 'getTickets'
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
