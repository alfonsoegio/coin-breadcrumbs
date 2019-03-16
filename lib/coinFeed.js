const fs = require('fs')
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
  constructor (filename, txref) {
    this.filename = filename
    this.txref = txref
    this.timeline = []
  }

  store () {
    fs.writeFileSync(this.filename, JSON.stringify(this, null, 2))
  }

  async resolve () {
    let initTransaction = txref.decode(this.txref)
    let tx = await chainClient.getTxFromCoordinates(initTransaction.blockHeight, initTransaction.blockIndex)
    for (let i = 0; i < tx.data.outputs.length; i++) {
      if (tx.data.outputs[i].script_hex.startsWith(OP_RETURN)) {
        let date = new Date(0)
        date.setUTCSeconds(tx.data.time)
        let entry = {
          'url': hex2a(tx.data.outputs[i].script_hex.replace(OP_RETURN, '')),
          'time': tx.data.time,
          'date': date,
          'did': this.txref }
        this.timeline.push(entry)
        this.store()
      }
      if (tx.data.outputs[i].script_hex.startsWith(OP_DUP_OP_HASH_160)) {
        let timelineTxs = await this.findTimelineTransactions(tx.data.outputs[i].address)
        for (let j = 0; j < timelineTxs.length; j++) {
          let txPosition = await chainClient.getTxPosition(timelineTxs[i].txid, timelineTxs[i].block_no)
          let did = txref.encode('testnet', timelineTxs[i].block_no, txPosition, 1)
          this.txref = did
          await this.resolve()
        }
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
