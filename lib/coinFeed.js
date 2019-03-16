const chainClient = require('./chainClient.js')
const txref = require('./txref.js')

module.exports = class CoinFeed {
  constructor (txref) {
    this.txref = txref
    this.timeline = []
  }

  async resolve () {
    let initTransaction = txref.decode(this.txref)
    let tx = await chainClient.getTxFromCoordinates(initTransaction.blockHeight, initTransaction.blockIndex)
    return tx
  }
}
