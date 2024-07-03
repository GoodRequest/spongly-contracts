export enum NETWORK {
	OPTIMISM_ETHEREUM = 'optimisticEthereum',
	OPTIMISM_GOERLI = 'optimisticGoerli',
	ARBITRUM_ONE = 'arbitrumOne',
	BASE_MAINNET = 'baseMainnet'
}

export enum ORDER_DIRECTION {
	ASC = 'ASC',
	DESC = 'DESC'
}

export enum THE_GRAPH_OPERATION_NAME {
	GET_TICKETS = 'getTickets'
}

export enum SUBGRAPH_API_URL {
	OPTIMISTIC_MAINNET = 'https://gateway-arbitrum.network.thegraph.com/api/6fc8662629cadd28365324b1e12ea40e/deployments/id/QmXEs6E47dLKNpFpUTkY5MDfoDmLU2WiCn7n6HjmfWNsyx',
	OPTIMISTIC_GOERLI = 'https://api.thegraph.com/subgraphs/name/thales-markets/sport-markets-optimism-goerli',
	ARBITRUM_ONE = 'https://gateway-arbitrum.network.thegraph.com/api/6fc8662629cadd28365324b1e12ea40e/deployments/id/QmVTmfjNXA5ZM9uZy75eNgGHjX45tmgDfnSYjm5EQjLbJN',
	BASE_MAINNET = 'https://api.studio.thegraph.com/query/11948/overtime-base/version/latest'
}

export enum MARKET_PROPERTY {
	POSITION = 'position',
	POSITIONS = 'positions',
	WON = 'won',
	CLAIMED = 'claimed',
	LAST_GAME_STARTS = 'lastGameStarts'
}

export enum USER_TICKET_TYPE {
	SUCCESS = 'SUCCESS',
	MISS = 'MISS',
	PAUSED = 'PAUSED',
	CANCELED = 'CANCELED',
	ONGOING = 'ONGOING',
	OPEN = 'OPEN'
}

export const NETWORKS = [...Object.values(NETWORK)]
export const THE_GRAPH_OPERATION_NAMES = [...Object.values(THE_GRAPH_OPERATION_NAME)]
