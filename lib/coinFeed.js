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

function compare (b, a) {
  if (a.time < b.time) {
    return -1
  }
  if (a.time > b.time) {
    return 1
  }
  return 0
}

module.exports = class CoinFeed {
  constructor (filename, txref) {
    this.filename = filename
    this.txref = txref
    this.timeline = []
    if (fs.existsSync(filename)) {
      let parsed = JSON.parse(fs.readFileSync(filename))
      this.txref = parsed.txref
      this.timeline = parsed.timeline
      this.filename = parsed.filename
    }
  }

  store () {
    fs.writeFileSync(this.filename, JSON.stringify(this, null, 2))
  }

  async update () {
    let sorted = this.timeline.sort(compare)
    if (sorted.length > 0) {
      console.log(`    Updating from ${sorted[0].did}`)
      await this.resolve(sorted[0].did)
    } else {
      console.log(`    Resolving from ${this.txref}`)
      await this.resolve(this.txref)
    }
  }

  async resolve (did) {
    let initTransaction = txref.decode(this.txref)
    let tx = await chainClient.getTxFromCoordinates(initTransaction.blockHeight, initTransaction.blockIndex)
    if (!await this.isTimelineTransaction(tx.data.txid)) {
      console.log(`    Skipping ${tx.data.txid}`)
      return this.timeline
    }
    for (let i = 0; i < tx.data.outputs.length; i++) {
      if (tx.data.outputs[i].script_hex.startsWith(OP_RETURN)) {
        let date = new Date(0)
        date.setUTCSeconds(tx.data.time)
        console.log(`    New url: ${did} ${date}`)
        let entry = {
          'url': hex2a(tx.data.outputs[i].script_hex.replace(OP_RETURN, '')),
          'time': tx.data.time,
          'date': date,
          'did': did }
        this.timeline.push(entry)
        this.store()
      }
      if (tx.data.outputs[i].script_hex.startsWith(OP_DUP_OP_HASH_160)) {
        let timelineTxs = await this.findTimelineTransactions(tx.data.outputs[i].address)
        for (let j = 0; j < timelineTxs.length; j++) {
          let txPosition = await chainClient.getTxPosition(timelineTxs[j].txid, timelineTxs[j].block_no)
          let did = txref.encode('testnet', timelineTxs[j].block_no, txPosition, 1)
          console.log(`    New DID found ${did}`)
          this.txref = did
          await this.resolve(did)
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
