const axios = require('axios')

const CHAIN_SO = 'https://chain.so/api/v2'
const CHAIN = 'BTCTEST'

const getTx = async function (txId) {
  let response = await axios.get(CHAIN_SO + '/tx/' + CHAIN + '/' + txId)
  return response.data
}

const getBlock = async function (blockHash) {
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

const getAddressInfo = async function (address) {
  if (address === null) {
    return null
  }
  let response = await axios.get(CHAIN_SO + '/address/' + CHAIN + '/' + address)
  return response.data
}

module.exports = {
  getAddressInfo: getAddressInfo,
  getTx: getTx,
  getBlock: getBlock,
  getTxPosition: getTxPosition
}
