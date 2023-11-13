import axios from 'axios'

export interface SportMarket {
	id: string
	address: string
	gameId: string
	isOpen: boolean
	isResolved: boolean
	isCanceled: boolean
	tags: string[]
}

const postAddress = 'https://api.thegraph.com/subgraphs/name/thales-markets/sport-markets-optimism'
export const getSportMarkets = async (): Promise<Array<SportMarket>> => {
	let response: any = await axios.post(
		postAddress,
		{
			query: '{sportMarkets(orderBy:maturityDate,orderDirection:asc,where:{isOpen:true,isCanceled:false,isPaused:false,maturityDate_gte:1698666411},first:1000,skip:0){id,timestamp,address,gameId,maturityDate,tags,isOpen,isResolved,isCanceled,finalResult,poolSize,numberOfParticipants,homeTeam,awayTeam,homeOdds,awayOdds,drawOdds,homeScore,awayScore,isApex,resultDetails,isPaused,leagueRaceName,qualifyingStartTime,arePostQualifyingOddsFetched,betType,parentMarket,spread,total,doubleChanceMarketType,playerId,playerName,playerPropsLine,playerPropsType,playerPropsOutcome,playerPropsScore }}',
			variables: null
		},
		{
			headers: {
				'Content-Type': 'application/json'
			}
		}
	)

	return response.data.data as Array<SportMarket>
}

export const getSportMarketPositions = async (): Promise<Array<SportMarket>> => {
	let response: any = await axios.post(
		postAddress,
		{
			query: '{sportMarkets(orderBy:maturityDate,orderDirection:asc,where:{isOpen:true,isCanceled:false,isPaused:false,maturityDate_gte:1698666411},first:1000,skip:0){id,timestamp,address,gameId,maturityDate,tags,isOpen,isResolved,isCanceled,finalResult,poolSize,numberOfParticipants,homeTeam,awayTeam,homeOdds,awayOdds,drawOdds,homeScore,awayScore,isApex,resultDetails,isPaused,leagueRaceName,qualifyingStartTime,arePostQualifyingOddsFetched,betType,parentMarket,spread,total,doubleChanceMarketType,playerId,playerName,playerPropsLine,playerPropsType,playerPropsOutcome,playerPropsScore }}',
			variables: null
		},
		{
			headers: {
				'Content-Type': 'application/json'
			}
		}
	)

	return response.data as Array<SportMarket>
}
