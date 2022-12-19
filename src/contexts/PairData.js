import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'

import { v2client } from '../apollo/client'
import {
  PAIR_DATA,
  PAIR_CHART,
  FILTERED_TRANSACTIONS,
  PAIRS_CURRENT,
  PAIRS_BULK,
  PAIRS_HISTORICAL_BULK,
  HOURLY_PAIR_RATES,
} from '../apollo/v3queries'

import { useCsprPrice } from './GlobalData'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import {
  getPercentChange,
  get2DayPercentChange,
  isAddress,
  getBlocksFromTimestamps,
  getTimestampsForChanges,
  splitQuery,
} from '../utils'
import { timeframeOptions, TRACKED_OVERRIDES } from '../constants'
import { useLatestBlocks } from './Application'
import { updateNameData } from '../utils/data'

const UPDATE = 'UPDATE'
const UPDATE_PAIR_TXNS = 'UPDATE_PAIR_TXNS'
const UPDATE_CHART_DATA = 'UPDATE_CHART_DATA'
const UPDATE_TOP_PAIRS = 'UPDATE_TOP_PAIRS'
const UPDATE_HOURLY_DATA = 'UPDATE_HOURLY_DATA'

dayjs.extend(utc)

export function safeAccess(object, path) {
  return object
    ? path.reduce(
      (accumulator, currentValue) => (accumulator && accumulator[currentValue] ? accumulator[currentValue] : null),
      object
    )
    : null
}

const PairDataContext = createContext()

function usePairDataContext() {
  return useContext(PairDataContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { pairAddress, data } = payload
      return {
        ...state,
        [pairAddress]: {
          ...state?.[pairAddress],
          ...data,
        },
      }
    }

    case UPDATE_TOP_PAIRS: {
      const { topPairs } = payload
      let added = {}
      topPairs.map((pair) => {
        return (added[pair.id] = pair)
      })
      return {
        ...state,
        ...added,
      }
    }

    case UPDATE_PAIR_TXNS: {
      const { address, transactions } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          txns: transactions,
        },
      }
    }
    case UPDATE_CHART_DATA: {
      const { address, chartData } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          chartData,
        },
      }
    }

    case UPDATE_HOURLY_DATA: {
      const { address, hourlyData, timeWindow } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          hourlyData: {
            ...state?.[address]?.hourlyData,
            [timeWindow]: hourlyData,
          },
        },
      }
    }

    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  // update pair specific data
  const update = useCallback((pairAddress, data) => {
    dispatch({
      type: UPDATE,
      payload: {
        pairAddress,
        data,
      },
    })
  }, [])

  const updateTopPairs = useCallback((topPairs) => {
    dispatch({
      type: UPDATE_TOP_PAIRS,
      payload: {
        topPairs,
      },
    })
  }, [])

  const updatePairTxns = useCallback((address, transactions) => {
    dispatch({
      type: UPDATE_PAIR_TXNS,
      payload: { address, transactions },
    })
  }, [])

  const updateChartData = useCallback((address, chartData) => {
    dispatch({
      type: UPDATE_CHART_DATA,
      payload: { address, chartData },
    })
  }, [])

  const updateHourlyData = useCallback((address, hourlyData, timeWindow) => {
    dispatch({
      type: UPDATE_HOURLY_DATA,
      payload: { address, hourlyData, timeWindow },
    })
  }, [])

  return (
    <PairDataContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update,
            updatePairTxns,
            updateChartData,
            updateTopPairs,
            updateHourlyData,
          },
        ],
        [state, update, updatePairTxns, updateChartData, updateTopPairs, updateHourlyData]
      )}
    >
      {children}
    </PairDataContext.Provider>
  )
}

async function getBulkPairData(pairList, ethPrice) {
  const [t1, t2, tWeek] = getTimestampsForChanges()
  console.log("t1, t2, tWeek", t1, t2, tWeek);
  console.log("await getBlocksFromTimestamps([t1, t2, tWeek])", await getBlocksFromTimestamps([t1, t2, tWeek]));
  let [{ number: b1 }, { number: b2 }, { number: bWeek }] = await getBlocksFromTimestamps([t1, t2, tWeek])
  // console.log("b1, b2, bWeek", b1, b2, bWeek);
  try {
    // console.log("pairList", pairList);
    let current = await v2client.query({
      query: PAIRS_BULK,
      variables: {
        allPairs: pairList,
      },
      fetchPolicy: 'cache-first',
    })
    console.log("PAIRS_BULK", current);

    let [oneDayResult, twoDayResult, oneWeekResult] = await Promise.all(
      [b1, b2, bWeek].map(async (block) => {
        // console.log("blockblock", block);
        let result = await v2client.query({
          query: PAIRS_HISTORICAL_BULK(block, pairList),
          fetchPolicy: 'cache-first',
        })
        console.log("PAIRS_HISTORICAL_BULK", result);
        return result
      })
    )
    // console.log("oneDayResult", oneDayResult);
    // console.log("twoDayResult", twoDayResult);
    // console.log("oneWeekResult", oneWeekResult);
    let oneDayData = oneDayResult?.data?.pairsByIds?.reduce((obj, cur, i) => {
      console.log("cur", cur);
      return { ...obj, [cur.id]: cur }
    }, {})

    let twoDayData = twoDayResult?.data?.pairsByIds?.reduce((obj, cur, i) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    let oneWeekData = oneWeekResult?.data?.pairsByIds?.reduce((obj, cur, i) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    console.log("oneDayData", oneDayData);
    console.log("twoDayData", twoDayData);
    console.log("oneWeekData", oneWeekData);
    let pairData = await Promise.all(
      current &&
      current.data.allpairs.map(async (pair) => {
        let data = pair
        let oneDayHistory = oneDayData?.[pair.id]
        if (!oneDayHistory) {
          let newData = await v2client.query({
            query: PAIR_DATA(pair.id, b1),
            fetchPolicy: 'cache-first',
          })
          oneDayHistory = newData.data.pairbyId[0]
        }
        let twoDayHistory = twoDayData?.[pair.id]
        if (!twoDayHistory) {
          let newData = await v2client.query({
            query: PAIR_DATA(pair.id, b2),
            fetchPolicy: 'cache-first',
          })
          twoDayHistory = newData.data.pairbyId[0]
        }
        let oneWeekHistory = oneWeekData?.[pair.id]
        if (!oneWeekHistory) {
          let newData = await v2client.query({
            query: PAIR_DATA(pair.id, bWeek),
            fetchPolicy: 'cache-first',
          })
          oneWeekHistory = newData.data.pairbyId[0]
        }
        data = parseData(data, oneDayHistory, twoDayHistory, oneWeekHistory, ethPrice, b1)
        return data
      })
    )
    console.log("pairData", pairData);
    return pairData
  } catch (e) {
    console.log(e)
  }
}

function parseData(data, oneDayData, twoDayData, oneWeekData, ethPrice, oneDayBlock) {
  const pairAddress = data.id

  // get volume changes
  const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
    data?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0,
    twoDayData?.volumeUSD ? twoDayData.volumeUSD : 0
  )
  const [oneDayVolumeUntracked, volumeChangeUntracked] = get2DayPercentChange(
    data?.untrackedVolumeUSD,
    oneDayData?.untrackedVolumeUSD ? parseFloat(oneDayData?.untrackedVolumeUSD) : 0,
    twoDayData?.untrackedVolumeUSD ? twoDayData?.untrackedVolumeUSD : 0
  )

  const oneWeekVolumeUSD = parseFloat(oneWeekData ? data?.volumeUSD - oneWeekData?.volumeUSD : data.volumeUSD)

  const oneWeekVolumeUntracked = parseFloat(
    oneWeekData ? data?.untrackedVolumeUSD - oneWeekData?.untrackedVolumeUSD : data.untrackedVolumeUSD
  )

  // set volume properties
  data.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD)
  data.oneWeekVolumeUSD = oneWeekVolumeUSD
  data.volumeChangeUSD = volumeChangeUSD
  data.oneDayVolumeUntracked = oneDayVolumeUntracked
  data.oneWeekVolumeUntracked = oneWeekVolumeUntracked
  data.volumeChangeUntracked = volumeChangeUntracked

  // set liquidity properties
  data.trackedReserveUSD = data.trackedReserveETH * ethPrice
  data.liquidityChangeUSD = getPercentChange(data.reserveUSD, oneDayData?.reserveUSD)

  // format if pair hasnt existed for a day or a week
  if (!oneDayData && data && data.createdAtBlockNumber > oneDayBlock) {
    data.oneDayVolumeUSD = parseFloat(data.volumeUSD)
  }
  if (!oneDayData && data) {
    data.oneDayVolumeUSD = parseFloat(data.volumeUSD)
  }
  if (!oneWeekData && data) {
    data.oneWeekVolumeUSD = parseFloat(data.volumeUSD)
  }

  if (TRACKED_OVERRIDES.includes(pairAddress)) {
    data.oneDayVolumeUSD = oneDayVolumeUntracked
    data.oneWeekVolumeUSD = oneWeekVolumeUntracked
    data.volumeChangeUSD = volumeChangeUntracked
    data.trackedReserveUSD = data.reserveUSD
  }

  // format incorrect names
  updateNameData(data)

  return data
}

const getPairTransactions = async (pairAddress) => {
  // console.log("pairAddress", pairAddress);
  const transactions = {}

  try {
    let result = await v2client.query({
      query: FILTERED_TRANSACTIONS,
      variables: {
        allPairs: [pairAddress],
      },
      fetchPolicy: 'no-cache',
    })
    console.log("FILTERED_TRANSACTIONS", result);
    transactions.mints = result.data.mintsallpairs
    transactions.burns = result.data.burnsallpairs
    transactions.swaps = result.data.swapsallpairs
  } catch (e) {
    console.log(e)
  }

  return transactions
}

const getPairChartData = async (pairAddress) => {
  let data = []
  let data1 = [1000000000]
  const utcEndTime = dayjs.utc()
  let utcStartTime = utcEndTime.subtract(1, 'year').startOf('minute')
  let startTime = utcStartTime.unix() - 1
  // let startTime = 1637232662;
  // console.log("startTime", startTime);
  try {
    let allFound = false
    let skip = 0
    while (!allFound) {
      let result = await v2client.query({
        query: PAIR_CHART,
        variables: {
          pairAddress: pairAddress,
          skip,
        },
        fetchPolicy: 'cache-first',
      })
      console.log("PAIR_CHART", result);
      for (let index = 0; index < result.data.pairdaydatasbypairAddress.length; index++) {
        result.data.pairdaydatasbypairAddress[index].reserveUSDValue = result.data.pairdaydatasbypairAddress[index].reserveUSD / 10 ** 9;
        result.data.pairdaydatasbypairAddress[index].dailyVolumeUSDValue = result.data.pairdaydatasbypairAddress[index].dailyVolumeUSD / 10 ** 9;
      }

      skip += 1000
      data = data.concat(result.data.pairdaydatasbypairAddress)
      if (result.data.pairdaydatasbypairAddress.length < 1000) {
        allFound = true
      }
      // console.log("data1", data1);
    }

    let dayIndexSet = new Set()
    let dayIndexArray = []
    const oneDay = 24 * 60 * 60
    data.forEach((dayData, i) => {
      // console.log("dayData.reserveUSD", dayData);
      // console.log("data[i]", data[i]);
      // add the day index to the set of days
      dayIndexSet.add((data[i].date / oneDay).toFixed(0))
      dayIndexArray.push(data[i])
      dayData.dailyVolumeUSD = parseFloat(dayData.dailyVolumeUSD)
      dayData.dailyVolumeUSDValue = parseFloat(dayData.dailyVolumeUSDValue)
      dayData.reserveUSD = parseFloat(dayData.reserveUSD)
      dayData.reserveUSDValue = parseFloat(dayData.reserveUSDValue)
    })

    if (data[0]) {
      // fill in empty days
      let timestamp = data[0].date ? data[0].date : startTime
      let latestLiquidityUSD = data[0].reserveUSD
      let latestLiquidityUSDValue = data[0].reserveUSD / 10 ** 9
      let index = 1
      while (timestamp < utcEndTime.unix() - oneDay) {
        const nextDay = timestamp + oneDay
        let currentDayIndex = (nextDay / oneDay).toFixed(0)
        if (!dayIndexSet.has(currentDayIndex)) {
          data.push({
            date: nextDay,
            dayString: nextDay,
            dailyVolumeUSD: 0,
            dailyVolumeUSDValue: 0,
            reserveUSD: latestLiquidityUSD,
            reserveUSDValue: latestLiquidityUSDValue
          })
        } else {
          latestLiquidityUSD = dayIndexArray[index].reserveUSD
          latestLiquidityUSDValue = dayIndexArray[index].reserveUSD / 10 ** 9
          index = index + 1
        }
        timestamp = nextDay
      }
    }

    data = data.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1))
  } catch (e) {
    console.log(e)
  }

  return data
}

const getHourlyRateData = async (pairAddress, startTime, latestBlock) => {
  try {
    const utcEndTime = dayjs.utc()
    let time = startTime

    // create an array of hour start times until we reach current hour
    const timestamps = []
    while (time <= utcEndTime.unix() - 3600) {
      timestamps.push(time)
      time += 3600
    }

    // backout if invalid timestamp format
    if (timestamps.length === 0) {
      return []
    }

    // once you have all the timestamps, get the blocks for each timestamp in a bulk query
    let blocks

    blocks = await getBlocksFromTimestamps(timestamps, 100)

    // catch failing case
    if (!blocks || blocks?.length === 0) {
      return []
    }

    if (latestBlock) {
      blocks = blocks.filter((b) => {
        return parseFloat(b.number) <= parseFloat(latestBlock)
      })
    }

    const result = await splitQuery(HOURLY_PAIR_RATES, v2client, [pairAddress], blocks, 100)

    // format token ETH price results
    let values = []
    for (var row in result) {
      let timestamp = row.split('t')[1]
      if (timestamp) {
        values.push({
          timestamp,
          rate0: parseFloat(result[row]?.token0Price),
          rate1: parseFloat(result[row]?.token1Price),
        })
      }
    }

    let formattedHistoryRate0 = []
    let formattedHistoryRate1 = []

    // for each hour, construct the open and close price
    for (let i = 0; i < values.length - 1; i++) {
      formattedHistoryRate0.push({
        timestamp: values[i].timestamp,
        open: parseFloat(values[i].rate0),
        close: parseFloat(values[i + 1].rate0),
      })
      formattedHistoryRate1.push({
        timestamp: values[i].timestamp,
        open: parseFloat(values[i].rate1),
        close: parseFloat(values[i + 1].rate1),
      })
    }

    return [formattedHistoryRate0, formattedHistoryRate1]
  } catch (e) {
    console.log(e)
    return [[], []]
  }
}

export function Updater() {
  const [, { updateTopPairs }] = usePairDataContext()
  const [ethPrice] = useCsprPrice()
  useEffect(() => {
    async function getData() {
      // get top pairs by reserves
      let {
        data: { pairs },
      } = await v2client.query({
        query: PAIRS_CURRENT,
        fetchPolicy: 'cache-first',
      })
      console.log("PAIRS_CURRENT", pairs);
      // console.log("ethPrice", ethPrice);
      // format as array of addresses
      const formattedPairs = pairs.map((pair) => {
        return pair.id
      })

      // get data for every pair in list
      let topPairs = await getBulkPairData(formattedPairs, ethPrice)
      // console.log("topPairs", topPairs);
      topPairs && updateTopPairs(topPairs)
    }
    ethPrice && getData()
  }, [ethPrice, updateTopPairs])
  return null
}

export function useHourlyRateData(pairAddress, timeWindow) {
  // console.log("timeWindow", timeWindow);
  const [state, { updateHourlyData }] = usePairDataContext()
  const chartData = state?.[pairAddress]?.hourlyData?.[timeWindow]
  // console.log("stats", state);
  const [latestBlock] = useLatestBlocks()

  useEffect(() => {
    const currentTime = dayjs.utc()
    const windowSize = timeWindow === timeframeOptions.MONTH ? 'month' : 'week'
    const startTime =
      timeWindow === timeframeOptions.ALL_TIME ? 1589760000 : currentTime.subtract(1, windowSize).startOf('hour').unix()

    async function fetch() {
      let data = await getHourlyRateData(pairAddress, startTime, latestBlock)
      updateHourlyData(pairAddress, data, timeWindow)
    }
    if (!chartData) {
      fetch()
    }
  }, [chartData, timeWindow, pairAddress, updateHourlyData, latestBlock])

  return chartData
}

/**
 * @todo
 * store these updates to reduce future redundant calls
 */
export function useDataForList(pairList) {
  const [state] = usePairDataContext()
  const [ethPrice] = useCsprPrice()

  const [stale, setStale] = useState(false)
  const [fetched, setFetched] = useState([])

  // reset
  useEffect(() => {
    if (pairList) {
      setStale(false)
      setFetched()
    }
  }, [pairList])

  useEffect(() => {
    async function fetchNewPairData() {
      let newFetched = []
      let unfetched = []

      pairList.map(async (pair) => {
        // console.log("pairpair", pair);
        let currentData = state?.[pair.id]
        if (!currentData) {
          unfetched.push(pair.id)
        } else {
          newFetched.push(currentData)
        }
      })

      let newPairData = await getBulkPairData(
        unfetched.map((pair) => {
          return pair
        }),
        ethPrice
      )
      setFetched(newFetched.concat(newPairData))
    }
    if (ethPrice && pairList && pairList.length > 0 && !fetched && !stale) {
      setStale(true)
      fetchNewPairData()
    }
  }, [ethPrice, state, pairList, stale, fetched])

  let formattedFetch =
    fetched &&
    fetched.reduce((obj, cur) => {
      return { ...obj, [cur?.id]: cur }
    }, {})

  return formattedFetch
}

/**
 * Get all the current and 24hr changes for a pair
 */
export function usePairData(pairAddress) {
  const [state, { update }] = usePairDataContext()
  const [ethPrice] = useCsprPrice()
  const pairData = state?.[pairAddress]

  useEffect(() => {
    async function fetchData() {
      if (!pairData && pairAddress) {
        let data = await getBulkPairData([pairAddress], ethPrice)
        data && update(pairAddress, data[0])
      }
    }
    if (!pairData && pairAddress && ethPrice
      // && isAddress(pairAddress)
    ) {
      fetchData()
    }
  }, [pairAddress, pairData, update, ethPrice])

  return pairData || {}
}

/**
 * Get most recent txns for a pair
 */
export function usePairTransactions(pairAddress) {
  const [state, { updatePairTxns }] = usePairDataContext()
  const pairTxns = state?.[pairAddress]?.txns
  useEffect(() => {
    async function checkForTxns() {
      if (!pairTxns) {
        let transactions = await getPairTransactions(pairAddress)
        updatePairTxns(pairAddress, transactions)
      }
    }
    checkForTxns()
  }, [pairTxns, pairAddress, updatePairTxns])
  return pairTxns
}

export function usePairChartData(pairAddress) {
  const [state, { updateChartData }] = usePairDataContext()
  // console.log("state", state);
  const chartData = state?.[pairAddress]?.chartData

  useEffect(() => {
    async function checkForChartData() {
      if (!chartData) {
        let data = await getPairChartData(pairAddress)
        updateChartData(pairAddress, data)
      }
    }
    checkForChartData()
  }, [chartData, pairAddress, updateChartData])
  return chartData
}

/**
 * Get list of all pairs in Casper Swap
 */
export function useAllPairData() {
  const [state] = usePairDataContext()
  // console.log("state1", state);
  return state || {}
}
