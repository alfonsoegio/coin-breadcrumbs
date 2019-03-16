const chainClient = require('./chainClient.js')
const txref = require('./txref.js')

const OP_DUP_OP_HASH_160 = '76a914'
const OP_RETURN = '6a37'

const hex2a = function (hexx) {
  var hex = hexx.toString() // force conversion
  var str = ''
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  }
  return str
}

module.exports = class CoinFeed {
  constructor (txref) {
    this.txref = txref
    this.timeline = []
  }

  async resolve () {
    let initTransaction = txref.decode(this.txref)
    let tx = await chainClient.getTxFromCoordinates(initTransaction.blockHeight, initTransaction.blockIndex)
    for (let i = 0; i < tx.data.outputs.length; i++) {
      if (tx.data.outputs[i].script_hex.startsWith(OP_RETURN)) {
        let entry = { 'url': hex2a(tx.data.outputs[i].script_hex.replace(OP_RETURN, '')), 'time': tx.data.time }
        this.timeline.push(entry)
      }
      if (tx.data.outputs[i].script_hex.startsWith(OP_DUP_OP_HASH_160)) {
        let timelineTxs = await this.findTimelineTransactions(tx.data.outputs[i].address)
        console.log(JSON.stringify(timelineTxs, null, 4))
      }
    }
    return this.timeline
  }

  async findTimelineTransactions (address) {
    let txs = []
    let addressInfo = await chainClient.getAddressInfo(address)
    for (let i = 0; i < addressInfo.data.txs.length; i++) {
      if (await this.isTimelineTransaction(addressInfo.data.txs[i].txid)) {
        if (addressInfo.data.txs[i].outgoing !== undefined) {
          txs.push(addressInfo.data.txs[i])
        }
      }
    }
    return txs
  }

  async isTimelineTransaction (txId) {
    let tx = await chainClient.getTx(txId)
    let nonStandardOutputs = 0
    let standardOutputs = 0
    for (let i = 0; i < tx.data.outputs.length; i++) {
      if (tx.data.outputs[i].script_hex.startsWith(OP_DUP_OP_HASH_160)) {
        standardOutputs++
      }
      if (tx.data.outputs[i].script_hex.startsWith(OP_RETURN)) {
        nonStandardOutputs++
      }
    }
    if (nonStandardOutputs === 1 && standardOutputs === 1) {
      return true
    }
    return false
  }
}
