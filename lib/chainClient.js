const axios = require('axios')

const CHAIN_SO = 'https://chain.so/api/v2'
const CHAIN = 'BTCTEST'

const getTx = async function (txId) {
  let response = await axios.get(CHAIN_SO + '/tx/' + CHAIN + '/' + txId)
  return response
}

module.exports = {
  getTx: getTx
}
