import gql from 'graphql-tag'
import { FACTORY_ADDRESS, BUNDLE_ID } from '../constants'
import { v2client } from './client'

const Factory_Address = '97b51a031595770f66498f66e8eb8082ac8ab4df4dd05d8f1dd746b94b424e3c'
export const SUBGRAPH_HEALTH = gql`
  query health {
    indexingStatusForCurrentVersion(subgraphName: "uniswap/uniswap-v2") {
      synced
      health
      chains {
        chainHeadBlock {
          number
        }
        latestBlock {
          number
        }
      }
    }
  }
`

//ok
//Hassan changed query
export const PRICES_BY_BLOCK = (tokenAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}:tokenbyIdandBlock(id: "${tokenAddress}", blockNumber : "${block.number}") {
        derivedETH
      }
    `
  )
  queryString += ','
  queryString += blocks.map(
    (block) => `
      b${block.timestamp}: bundleByIdandBlock(id:"1",blockNumber: "${block.number}") {
        ethPrice
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}

export const GET_BLOCK = (timestampFrom, timestampTo) => {
  console.log('timestampFromtimestampFromtimestampFrom', timestampFrom)
  console.log('timestampTotimestampTotimestampTo', timestampTo)
  let queryString = `
  query getBlockBetweenTimestampsAsc {
    getBlockBetweenTimestampsAsc(timestampFrom : "${timestampFrom}", timestampTo : "${timestampTo}") {
      id
      number
      timestamp
    }
  }
  `
  // console.log("queryString", queryString);
  return gql(queryString)
}

export const GET_BLOCKS = (timestamps) => {
  let queryString = 'query getBlockBetweenTimestampsDesc {'
  queryString += timestamps.map((timestamp) => {
    return `t${timestamp}:getBlockBetweenTimestampsDesc(timestampFrom: "${new Date(
      timestamp * 1000
    ).toISOString()}", timestampTo: "${new Date((timestamp + 600) * 1000).toISOString()}") 
    {
      number
    }`
  })
  queryString += '}'
  // console.log("queryString", queryString);
  return gql(queryString)
}

//in progress
//orderBy: liquidityTokenBalance, orderDirection: desc
//changed query
export const TOP_LPS_PER_PAIRS = gql`
  query liquiditypositions($pair: String!) {
    liquiditypositions(first: 10, id: $pair) {
      user {
        id
      }
      pair {
        id
      }
      liquidityTokenBalance
    }
  }
`
//Ok
//Hassan changed query
export const HOURLY_PAIR_RATES = (pairAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}: pairbyIdandBlock(id:"${pairAddress}", blockNumber:"${block.number}") {
        token0Price
        token1Price
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}

//Ok
//changed query
// export const SHARE_VALUE = (pairAddress, blocks) => {
//   let pair = `"${pairAddress}"`
//   let queryString = 'query blocks {'
//   queryString += blocks.map(
//     (block) => `
//       t${block.timestamp}:pairbyid(id:${pair}) {
//         reserve0
//         reserve1
//         reserveUSD
//         totalSupply
//         token0{
//           derivedETH
//         }
//         token1{
//           derivedETH
//         }
//       }
//     `
//   )
//   queryString += ','
//   queryString += blocks.map(
//     (block) => `
//       b${block.timestamp}: bundle(id:"1") {
//         ethPrice
//       }
//     `
//   )
//   queryString += '}'
//   return gql(queryString)
// }
//Hassan Changed Query
export const SHARE_VALUE = (pairAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}:pairbyIdandBlock(id:"${pairAddress}", blockNumber: "${block.number}") {
        reserve0
        reserve1
        reserveUSD
        totalSupply
        token0{
          derivedETH
        }
        token1{
          derivedETH
        }
      }
    `
  )
  queryString += ','
  queryString += blocks.map(
    (block) => `
      b${block.timestamp}: bundleByIdandBlock(id:"1", blockNumber: "${block.number}" ) {
        ethPrice
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}
//Ok
//Hassan changed query
export const ETH_PRICE = (block) => {
  const queryString = block
    ? ` query bundle {
      bundleByIdandBlock(id: "1", blockNumber : "${block}") {
        id
        ethPrice
      }
    }
  `
    : ` query bundle {
    bundle(id: "1") {
      id
      ethPrice
    }
  }
`
  // console.log("queryString", queryString);
  return gql(queryString)
}

// liquidityPositions should be an object
//Ok
//changed query
// export const USER = (block, account) => {
//   const queryString = `
//     query user {
//       user(id: "${account}") {
//         liquidityPositions
//       }
//     }
// `
//   return gql(queryString)
// }

// in progress
//changed query
export const USER_MINTS_BUNRS_PER_PAIR = gql`
  query events($user: String!, $pair: String!) {
    mints(to: $user, pair: $pair) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
    burns(sender: $user, pair: $pair) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`
// in progress
//changed query
export const USER_HISTORY = gql`
  query snapshots($user: String!, $skip: Int!) {
    liquiditypositionsnapshots(first: 1000, skip: $skip, user: $user) {
      timestamp
      reserveUSD
      liquidityTokenBalance
      liquidityTokenTotalSupply
      reserve0
      reserve1
      token0PriceUSD
      token1PriceUSD
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`
// in progress
//changed query
export const USER_POSITIONS = gql`
  query liquidityPositionsagainstuserId($user: String!) {
    liquidityPositionsagainstuserId(user: $user) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
          symbol
          derivedETH
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`
// in progress
//changed query
export const USER_TRANSACTIONS = gql`
  query transactions($user: String!) {
    mint(to: $user) {
      id
      transactionid
      transactiontimestamp
      pair {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burn(sender: $user) {
      id
      transactionid
      transactiontimestamp
      pair {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      sender
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(to: $user) {
      id
      transactionid
      transactiontimestamp
      pair {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
    }
  }
`
//Ok
//orderBy: date, orderDirection: asc
//changed query
export const PAIR_CHART = gql`
  query pairdaydatasbypairAddress($pairAddress: String!, $skip: Int!) {
    pairdaydatasbypairAddress(first: 1000, skip: $skip, pairAddress: $pairAddress) {
      id
      date
      dailyVolumeToken0
      dailyVolumeToken1
      dailyVolumeUSD
      reserveUSD
    }
  }
`
//Ok
// orderBy: date, orderDirection: desc,
//changed query
// export const PAIR_DAY_DATA = gql`
//   query pairdaydata($pairAddress: String!, $date: Int!) {
//     pairdaydata(first: 1, pairAddress: $pairAddress, date: $date) {
//       id
//       date
//       dailyVolumeToken0
//       dailyVolumeToken1
//       dailyVolumeUSD
//       totalSupply
//       reserveUSD
//     }
//   }
// `
//Ok
//orderBy: date, orderDirection: asc,
//changed query
export const PAIR_DAY_DATA_BULK = (pairs, startTimestamp) => {
  let time = `"${startTimestamp}"`
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`)
  })
  pairsString += ']'
  const queryString = `
    query pairdaydatas {
      pairdaydatas(first: 1000, pairAddress: ${pairsString}, date: ${time}) {
        id
        pairAddress
        date
        dailyVolumeToken0
        dailyVolumeToken1
        dailyVolumeUSD
        totalSupply
        reserveUSD
      }
    }
`
  return gql(queryString)
}

//Ok
// orderBy: date, orderDirection: asc
//changed query
export const GLOBAL_CHART = gql`
  query uniswapdaydatasbydate($startTime: String!, $skip: Int!) {
    uniswapdaydatasbydate(first: 1000, skip: $skip, date: $startTime) {
      id
      date
      totalVolumeUSD
      dailyVolumeUSD
      dailyVolumeETH
      totalLiquidityUSD
      totalLiquidityETH
    }
  }
`
//Ok
//Hassan changed query
export const GLOBAL_DATA = (block) => {
  let factoryaddress = `"${Factory_Address}"`
  const queryString = ` query uniswapfactory {
    uniswapfactory(id: ${factoryaddress}, ${block && block != 0 ? `blockNumber : "${block}"` : ``} ) {
        id
        totalVolumeUSD
        totalVolumeETH
        untrackedVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
        txCount
        pairCount
      }
    }`

  return gql(queryString)
}

export const GLOBAL_DATA_PER_DAY = (block) => {
  const queryString = ` query uniswapdaydata {
    uniswapdaydataByBlock(blockNumber : "${block}") {
        id
        totalVolumeUSD
        totalVolumeETH
        totalLiquidityUSD
        totalLiquidityETH
        txCount
      }
    }`
  return gql(queryString)
}

// in progress
//orderBy: timestamp, orderDirection: desc
//changed query
export const GLOBAL_TXNS = gql`
  query transactions {
    transactions(first: 1000) {
      mints {
        transactionid
        transactiontimestamp
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        to
        liquidity
        amount0
        amount1
        amountUSD
      }
      burns {
        transactionid
        transactiontimestamp
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        sender
        liquidity
        amount0
        amount1
        amountUSD
      }
      swaps {
        transactionid
        transactiontimestamp
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        amount0In
        amount0Out
        amount1In
        amount1Out
        amountUSD
        to
      }
    }
  }
`
//Ok
//changed query
export const ALL_TOKENS = gql`
  query tokens($skip: Int!) {
    tokens(first: 500, skip: $skip) {
      id
      name
      symbol
      totalLiquidity
    }
  }
`
//Ok
//changed query
//orderBy: totalLiquidity, orderDirection: desc
export const TOKEN_SEARCH = gql`
  query ($value: String!, $id: String!) {
    asSymbol: tokensbysymbol(symbol: $value) {
      id
      symbol
      name
      totalLiquidity
    }
    asName: tokenbyname(name: $value) {
      id
      symbol
      name
      totalLiquidity
    }
    asAddress: tokenbyId(id: $id) {
      id
      symbol
      name
      totalLiquidity
    }
  }
`
//Ok
//changed query
export const PAIR_SEARCH = gql`
  query ($tokens: [String]!, $id: String) {
    as0: pairsbytoken0array(token0: $tokens) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    as1: pairsbytoken1array(token1: $tokens) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    asAddress: pairbyId(id: $id) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`
//Ok
//orderBy: trackedReserveETH, orderDirection: desc
//changed query
export const ALL_PAIRS = gql`
  query pairs($skip: Int!) {
    pairs(first: 500, skip: $skip) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`

const PairFields = `
  fragment PairFields on Pair {
    id
    txCount
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
    createdAtBlockNumber
  }
`
//Ok
//orderBy: reserveUSD, orderDirection: desc
//changed query
export const PAIRS_CURRENT = gql`
  query pairs {
    pairs(first: 200, skip: 0) {
      id
    }
  }
`
//Ok
//Hassan changed query
export const PAIR_DATA = (pairAddress) => {
  let pairString = `"${pairAddress}"`
  let queryString = `
  ${PairFields}
  query pairbyId {
    pairbyId(id: ${pairString}) {
      ...PairFields
    }
  }
  `
  console.log('queryStringqueryString', queryString)
  return gql(queryString)
}

export const PAIR_DATA_BY_ID_AND_BLOCK = (pairAddress, block) => {
  let pairString = `"${pairAddress}"`
  let queryString = `
  ${PairFields}
  query pairbyIdandBlock {
    pairbyIdandBlock(id: ${pairString}, blockNumber : "${block}") {
      ...PairFields
    }
  }
  `
  console.log('queryStringqueryString', queryString)
  return gql(queryString)
}

//Ok
//orderBy: trackedReserveETH, orderDirection: desc
//changed query
export const PAIRS_BULK = gql`
  ${PairFields}
  query allpairs($allPairs: [String]!) {
    allpairs(first: 500, id: $allPairs) {
      ...PairFields
    }
  }
`

//Ok
//orderBy: trackedReserveETH, orderDirection: desc
//Hassan changed query
export const PAIRS_HISTORICAL_BULK = (block, pairs) => {
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}",`)
  })
  pairsString += ']'

  let queryString = `
   query pairsByIds {
     pairsByIdsandBlock(${
       block ? `first: 200, ids: ${pairsString}, blockNumber:"${block}"` : `first: 200, ids: ${pairsString}`
     }) {
       id
       reserveUSD
       trackedReserveETH
       volumeUSD
       untrackedVolumeUSD
     }
   }
   `
  return gql(queryString)
}

//ok
//orderBy: date, orderDirection: asc,
//changed query
export const TOKEN_CHART = gql`
  query tokendaydatas($tokenAddr: String!, $skip: Int!) {
    tokendaydatas(first: 1000, skip: $skip, token: $tokenAddr) {
      id
      date
      priceUSD
      totalLiquidityToken
      totalLiquidityUSD
      totalLiquidityETH
      dailyVolumeETH
      dailyVolumeToken
      dailyVolumeUSD
    }
  }
`

const TokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    derivedETH
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    txCount
  }
`

//Ok
//orderBy: totalLiquidityUSD, orderDirection: desc
//changed query
export const TOKEN_TOP_DAY_DATAS = gql`
  query tokendaydatasbydate($date: String) {
    tokendaydatasbydate(first: 50, date: $date) {
      id
      date
    }
  }
`

//Ok
export const TOKENS_HISTORICAL_BULK = (tokens) => {
  let tokensString = `[`
  tokens.map((token) => {
    return (tokensString += `"${token}",`)
  })
  tokensString += ']'

  let queryString = `
  query tokensbyIds {
    tokensbyIds(first: 50,ids: ${tokensString}) {
      id
      name
      symbol
      derivedETH
      tradeVolume
      tradeVolumeUSD
      untrackedVolumeUSD
      totalLiquidity
      txCount
    }
  }
  `
  debugger
  return gql(queryString)
}

export const TOKENS_HISTORICAL_BULK_BY_BLOCK = (tokens, block) => {
  let tokensString = `[`
  tokens.map((token) => {
    return (tokensString += `"${token}",`)
  })
  tokensString += ']'

  let queryString = `
  query tokensByIdsandBlock {
    tokensByIdsandBlock(first: 50,ids: ${tokensString}, blockNumber : "${block}") {
      id
      name
      symbol
      derivedETH
      tradeVolume
      tradeVolumeUSD
      untrackedVolumeUSD
      totalLiquidity
      txCount
    }
  }
  `
  return gql(queryString)
}

//Ok
//orderBy: reserveUSD, orderDirection: desc
//changed query
// export const TOKEN_DATA = (tokenAddress, block) => {
//   console.log("tokenAddress", tokenAddress);
//   const queryString = `
//     ${TokenFields}
//     query tokens {
//       tokenbyId(id:"${tokenAddress}") {
//         ...TokenFields
//       }
//       pairs0: pairsbytoken0(first: 50,token0: "${tokenAddress}"){
//         id
//       }
//       pairs1: pairsbytoken1(first: 50,token1: "${tokenAddress}"){
//         id
//       }
//     }
//   `
//   return gql(queryString)
// }

//Hassan Changed Query
export const TOKEN_DATA = (tokenAddress) => {
  const queryString = `
    ${TokenFields}
    query {
      tokenbyId(id:"${tokenAddress}") {
        ...TokenFields
      }
      pairs0: pairsbytoken0(first: 50, token0: "${tokenAddress}"){
        id
      }
      pairs1: pairsbytoken1(first: 50, token1: "${tokenAddress}"){
        id
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_DATA_BY_BLOCK = (tokenAddress, block) => {
  const queryString = `
    ${TokenFields}
    query {
      tokenbyIdandBlock(${block ? `id:"${tokenAddress}", blockNumber : "${block}"` : `id:"${tokenAddress}"`}) {
        ...TokenFields
      }
      pairs0: pairsbytoken0(first: 50, token0: "${tokenAddress}"){
        id
      }
      pairs1: pairsbytoken1(first: 50, token1: "${tokenAddress}"){
        id
      }
    }
  `
  return gql(queryString)
}

//orderBy: timestamp, orderDirection: desc
//changed query
export const FILTERED_TRANSACTIONS = gql`
  query ($allPairs: [String]!) {
    mintsallpairs(first: 20, pair: $allPairs) {
      transactionid
      transactiontimestamp

      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burnsallpairs(first: 20, pair: $allPairs) {
      transactionid
      transactiontimestamp
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      sender
      liquidity
      amount0
      amount1
      amountUSD
    }
    swapsallpairs(first: 30, pair: $allPairs) {
      transactionid
      transactiontimestamp
      id
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
    }
  }
`

async function getData() {
  const currentDate = parseInt(Date.now() / 86400 / 1000) * 86400 - 86400
  let res = await v2client.query({
    query: TOKEN_TOP_DAY_DATAS,
    fetchPolicy: 'cache-first',
    variables: { date: currentDate.toString() },
  })
  console.log('resresresresresresresresres', res)
}
getData()
