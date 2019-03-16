const bitcoin = require('bitcoinjs-lib')
const chainClient = require('./chainClient.js')

const SATOSHIS_PER_BTC = 100000000

module.exports = class Breadcrumb {
  constructor (wallet, url, fee) {
    this.wallet = wallet
    this.url = url
    this.fee = fee
  }

  async execute () {
    let utxo = await this.wallet.getFirstUtxo()
    if (utxo === null) {
      console.log('    Not enough confirmations yet ...')
      return
    }
    let changeAddress = await this.wallet.generateNewKey()
    let value = utxo.value - this.fee
    let network = bitcoin.networks.testnet
    let changeSatoshi = Math.round(value * SATOSHIS_PER_BTC)
    let tx = new bitcoin.TransactionBuilder(network)
    tx.addInput(utxo.txId, utxo.utxoIndex)
    tx.addOutput(changeAddress.address, changeSatoshi)
    let data = Buffer.from(this.url)
    let ret = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, data])
    tx.addOutput(ret, 0)
    let key = bitcoin.ECPair.fromWIF(utxo.wif, network)
    tx.sign(0, key)
    let hexTx = tx.build().toHex()
    try {
      await chainClient.broadcastSignedTx(hexTx)
    } catch (error) {
      console.log(`    Something went wrong broadcasting tx ${error}`)
    }
    this.wallet.last_address = changeAddress
    this.wallet.store()
  }
}
