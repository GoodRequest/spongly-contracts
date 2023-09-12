export enum NETWORK {
	OPTIMISM_MAINNET = 'optimisticMainnet',
	OPTIMISM_GOERLI = 'optimisticGoerli'
}

export enum THE_GRAPH_OPERATION_NAME {
	GET_PARLAY_MARKET = 'getParleyMarket',
	GET_PARLAY_MARKET_ASCENDING = 'getParleyMarketAscending',
	GET_SPORT_MARKET = 'getSportMarket'
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
