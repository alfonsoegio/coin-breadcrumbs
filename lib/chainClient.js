const axios = require('axios')

const CHAIN_SO = 'https://chain.so/api/v2'
const CHAIN = 'BTCTEST'
const DEFAULT_INTERVAL = 7000

const scheduleRequests = function (axiosInstance, intervalMs) {
  let lastInvocationTime
  const scheduler = (config) => {
    const now = Date.now()
    if (lastInvocationTime) {
      lastInvocationTime += intervalMs
      const waitPeriodForThisRequest = lastInvocationTime - now
      if (waitPeriodForThisRequest > 0) {
        return new Promise((resolve) => {
          setTimeout(
            () => resolve(config),
            waitPeriodForThisRequest)
        })
      }
    }
    lastInvocationTime = now
    return config
  }
  axiosInstance.interceptors.request.use(scheduler)
}

const getTxFromCoordinates = async function (blockHeight, blockIndex) {
  scheduleRequests(axios, DEFAULT_INTERVAL)
  let response = await axios.get(CHAIN_SO + '/block/' + CHAIN + '/' + blockHeight)
  if (blockIndex < response.data.data.txs.length) {
    return this.getTx(response.data.data.txs[blockIndex].txid)
  }
  return null
}

const getTx = async function (txId) {
  scheduleRequests(axios, DEFAULT_INTERVAL)
  let response = await axios.get(CHAIN_SO + '/tx/' + CHAIN + '/' + txId)
  return response.data
}

const getBlock = async function (blockHash) {
  scheduleRequests(axios, DEFAULT_INTERVAL)
  let response = await axios.get(CHAIN_SO + '/block/' + CHAIN + '/' + blockHash)
  return response.data
}

const getTxPosition = async function (txId, blockHash) {
  if (blockHash === null) {
    return null
  }
  let block = await getBlock(blockHash)
  let txPos = 0
  for (let i = 0; i < block.data.txs.length; i++) {
    if (block.data.txs[i].txid === txId) {
      return txPos
    }
    txPos++
  }
  return null
}

const getAddressBalance = async function (address, confirmations) {
  scheduleRequests(axios, DEFAULT_INTERVAL)
  console.log(`    Getting ${address} balance with more than ${confirmations} confirmations`)
  if (address === null) {
    return null
  }
  let url = CHAIN_SO + '/get_address_balance/' + CHAIN + '/' + address
  if (confirmations !== undefined) {
    url = url + '/' + confirmations
  }
  let response = await axios.get(url)
  return response.data
}

const getAddressInfo = async function (address) {
  scheduleRequests(axios, DEFAULT_INTERVAL)
  console.log(`    Getting ${address}`)
  if (address === null) {
    return null
  }
  let response = await axios.get(CHAIN_SO + '/address/' + CHAIN + '/' + address)
  return response.data
}

const broadcastSignedTx = async function (hexTx) {
  scheduleRequests(axios, DEFAULT_INTERVAL)
  let url = CHAIN_SO + '/send_tx/' + CHAIN
  try {
    let response = await axios.post(url, { 'tx_hex': hexTx })
    return response
  } catch (error) {
    console.log(`    Error broadcasting ${hexTx}`)
  }
}

module.exports = {
  getAddressInfo: getAddressInfo,
  getTx: getTx,
  getBlock: getBlock,
  getTxPosition: getTxPosition,
  broadcastSignedTx: broadcastSignedTx,
  getTxFromCoordinates: getTxFromCoordinates,
  getAddressBalance: getAddressBalance
}
