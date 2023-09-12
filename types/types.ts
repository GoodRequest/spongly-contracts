export type Maybe<T> = T | null

export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export enum PositionType {
	Away = 'away',
	Draw = 'draw',
	Home = 'home'
}

export type SportMarket = {
	__typename?: 'SportMarket'
	address: Scalars['String']
	arePostQualifyingOddsFetched?: Maybe<Scalars['Boolean']>
	awayOdds: Scalars['String']
	awayScore?: Maybe<Scalars['String']>
	awayTeam: Scalars['String']
	betType?: Maybe<Scalars['String']>
	doubleChanceMarketType?: Maybe<Scalars['String']>
	downAddress: Scalars['String']
	drawAddress: Scalars['String']
	drawOdds: Scalars['String']
	finalResult: Scalars['String']
	gameId: Scalars['String']
	homeOdds: Scalars['String']
	homeScore?: Maybe<Scalars['String']>
	homeTeam: Scalars['String']
	id: Scalars['ID']
	isApex?: Maybe<Scalars['Boolean']>
	isCanceled: Scalars['Boolean']
	isOpen: Scalars['Boolean']
	isPaused: Scalars['Boolean']
	isResolved: Scalars['Boolean']
	leagueRaceName?: Maybe<Scalars['String']>
	maturityDate: Scalars['String']
	numberOfParticipants: Scalars['String']
	parentMarket?: Maybe<Scalars['String']>
	poolSize: Scalars['String']
	qualifyingStartTime?: Maybe<Scalars['String']>
	resultDetails?: Maybe<Scalars['String']>
	spread?: Maybe<Scalars['String']>
	tags?: Maybe<Array<Scalars['String']>>
	timestamp: Scalars['String']
	total?: Maybe<Scalars['String']>
	upAddress: Scalars['String']
}

export type Position = {
	__typename?: 'Position'
	claimable: Scalars['Boolean']
	id: Scalars['ID']
	market: SportMarket
	side: PositionType
}

export type ParlayMarket = {
	__typename?: 'ParlayMarket'
	account: Scalars['String']
	blockNumber: Scalars['String']
	claimed: Scalars['Boolean']
	id: Scalars['ID']
	lastGameStarts: Scalars['String']
	marketQuotes?: Maybe<Array<Scalars['String']>>
	positions: Array<Position>
	positionsFromContract: Array<Scalars['String']>
	skewImpact?: Maybe<Scalars['String']>
	sportMarkets: Array<SportMarket>
	sportMarketsFromContract: Array<Scalars['String']>
	sUSDAfterFees?: Maybe<Scalars['String']>
	sUSDPaid?: Maybe<Scalars['String']>
	timestamp: Scalars['String']
	totalAmount: Scalars['String']
	totalQuote?: Maybe<Scalars['String']>
	txHash: Scalars['String']
	won: Scalars['Boolean']
}

export type PositionBalance = {
	__typename?: 'PositionBalance'
	account: Scalars['String']
	amount: Scalars['String']
	claimed: Scalars['Boolean']
	firstTxHash: Scalars['String']
	id: Scalars['ID']
	position: Position
	sUSDPaid: Scalars['String']
}
