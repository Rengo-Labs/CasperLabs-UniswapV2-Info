import { getBlockFromTimestamp, getBlocksFromTimestamps } from '../../utils'
import { v2client } from '../client'
import { PRICES_BY_BLOCK, ETH_PRICE } from "../v3queries"
import { splitQuery } from "../../utils"

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

const generateValidTimestamps = () => {
  const utcEndTime = dayjs.utc()
  const interval = 3600
  let time = dayjs.utc().subtract(1, 'day').startOf('hour').unix()
  // console.log("startTimestartTime", startTime);
  // create an array of hour start times until we reach current hour
  // buffer by half hour to catch case where graph isnt synced to latest block
  const timestamps = []
  while (time < utcEndTime.unix()) {
    timestamps.push(time)
    time += interval
  }
  
  // backout if invalid timestamp format
  if (timestamps.length === 0) {
    return []
  }

  return timestamps
}

/**
 * Getting Blocks
 */
it('should get blocks from timestamps', async () => {
  const timestamps = generateValidTimestamps()
  const results = await getBlocksFromTimestamps(timestamps, 100)
  // 24 hours + current hour
  expect(results.length).toBe(25)
})

it('should gracefully not get blocks from timestamps', async () => {
  let time = dayjs.utc().add(2, 'day').startOf('hour').unix()

  const results = await getBlocksFromTimestamps([time], 100)
  expect(results.length).toBe(1)
  expect(results[0].timestamp).toBe(0)
  expect(results[0].number).toBe(0)
})

/**
 * Getting Price of ERC20
 */
it('should get price of a token by block', async () => {
  const timestamps = generateValidTimestamps()

  let blocks = await getBlocksFromTimestamps(timestamps, 100)
  // sometimes blocks are ddos blocks and cannot be loaded
  blocks = blocks.filter((block) => block.number && block.timestamp)

  // use WCSPR
  const tokenAddress = '0885c63f5f25ec5b6f3b57338fae5849aea5f1a2c96fc61411f2bfc5e432de5a'.toLocaleLowerCase()
  const results = await splitQuery(PRICES_BY_BLOCK, v2client, [tokenAddress], blocks, 50)
  
  expect(Object.keys(results).length).toBe(50)
})

it('should not get price by block that does not exist', async () => {
  const timestamps = [dayjs.utc().subtract(1, 'day').startOf('hour').unix()]

  let blocks = await getBlocksFromTimestamps(timestamps, 100)
  // sometimes blocks are ddos blocks and cannot be loaded
  blocks = blocks.filter((block) => block.number && block.timestamp)

  // use invalid WCSPR 
  const tokenAddress = 'zzz0885c63f5f25ec5b6f3b57338fae5849aea5f1a2c96fc61411f2bfc5e432de5a'.toLocaleLowerCase()
  const results = await splitQuery(PRICES_BY_BLOCK, v2client, [tokenAddress], blocks, 50)
  
  expect(Object.keys(results).length).toBe(2)
  expect(Object.values(results)[0]).toBeNull()
  expect(Object.values(results)[1].__typename).toBe('Bundle')
})

/**
 * Getting Price of CSPR
 */
it('should get price of cspr by block', async () => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  
  let resultOneDay = await v2client.query({
    query: ETH_PRICE(oneDayBlock),
    fetchPolicy: 'cache-first',
  })

  expect(parseFloat(resultOneDay.data.bundleByIdandBlock.ethPrice)).toBeGreaterThan(0)
})

it('returns spot price of cspr for block that does not exist', async () => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.add(1, 'day').startOf('minute').unix()

  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  
  let resultOneDay = await v2client.query({
    query: ETH_PRICE(oneDayBlock),
    fetchPolicy: 'cache-first',
  })

  expect(parseFloat(resultOneDay.data.bundle.ethPrice)).toBeGreaterThan(0)
})

/**
 * getTopTokens
 */
it('should get price of cspr by block', async () => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  
  let resultOneDay = await v2client.query({
    query: ETH_PRICE(oneDayBlock),
    fetchPolicy: 'cache-first',
  })

  expect(parseFloat(resultOneDay.data.bundleByIdandBlock.ethPrice)).toBeGreaterThan(0)
})

it('returns spot price of cspr for block that does not exist', async () => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.add(1, 'day').startOf('minute').unix()

  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  
  let resultOneDay = await v2client.query({
    query: ETH_PRICE(oneDayBlock),
    fetchPolicy: 'cache-first',
  })

  expect(parseFloat(resultOneDay.data.bundle.ethPrice)).toBeGreaterThan(0)
})