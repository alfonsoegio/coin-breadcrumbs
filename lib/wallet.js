const bip39 = require('bip39')
const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')
const fs = require('fs')
const assert = require('assert')
const chainClient = require('./chainClient.js')

const DEFAULT_KEY_NUMBER = 1
const DEFAULT_CONFIRMATIONS_THRESHOLD = 2

function getAddress (node, network) {
  return bitcoin.payments.p2pkh({ pubkey: node.publicKey, wif: node.toWIF(), network })
}

module.exports = class Wallet {
  constructor (filename, mnemonic, keyNumber) {
    this.filename = filename
    this.keys = {}
    if (fs.existsSync(filename)) {
      let parsed = JSON.parse(fs.readFileSync(filename))
      this.keys = parsed.keys
      this.mnemonic = parsed.mnemonic
      this.last_address = parsed.last_address
      return
    }
    if (mnemonic === undefined) {
      mnemonic = bip39.generateMnemonic()
    }
    assert(bip39.validateMnemonic(mnemonic))
    this.mnemonic = mnemonic
    this.keys.key = []
    let seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed, bitcoin.networks.testnet)
    if (keyNumber === undefined) {
      keyNumber = DEFAULT_KEY_NUMBER
    }
    for (let i = 0; i < keyNumber; i++) {
      let newAddress = getAddress(root.derivePath('m/44\'/60\'/0\'/0/' + i), bitcoin.networks.testnet)
      this.keys.key.push({ 'address': newAddress.address, 'wif': newAddress.wif })
    }
    this.last_address = this.keys.key[0]
    fs.writeFileSync(filename, JSON.stringify(this, null, 2))
  }

  generateNewKey () {
    let seed = bip39.mnemonicToSeed(this.mnemonic)
    const root = bip32.fromSeed(seed, bitcoin.networks.testnet)
    let newIndex = this.keys.key.length
    let newAddress = getAddress(root.derivePath('m/44\'/60\'/0\'/0/' + newIndex), bitcoin.networks.testnet)
    this.keys.key.push({ 'address': newAddress.address, 'wif': newAddress.wif })
    this.store()
    return newAddress
  }

  store () {
    fs.writeFileSync(this.filename, JSON.stringify(this, null, 2))
  }

  checkConfirmations (addressInfo) {
    for (let i = 0; i < addressInfo.data.txs.length; i++) {
      if (addressInfo.data.txs[i].confirmations <= DEFAULT_CONFIRMATIONS_THRESHOLD) {
        return false
      }
    }
    return true
  }

  async refreshWalletKeyInfo (keyNumber, update) {
    if (update === true && typeof (this.keys.key[keyNumber]['info']) === 'object') {
      if (this.checkConfirmations(this.keys.key[keyNumber]['info'])) {
        return this.keys.key[keyNumber]['info']
      }
    }
    let info = await chainClient.getAddressInfo(this.keys.key[keyNumber]['address'])
    this.keys.key[keyNumber].info = info
    this.store()
    return info
  }

  async refreshWalletInfo (update) {
    console.log(`    Refreshing ${this.keys.key.length} first addresses`)
    for (let i = 0; i < this.keys.key.length; i++) {
      await this.refreshWalletKeyInfo(i, update)
    }
  }

  async getFirstUtxo () {
    let found = false
    let balance
    let index
    for (let i = 0; i < this.keys.key.length; i++) {
      if (this.keys.key[i].address === this.last_address.address) {
        balance = await chainClient.getAddressBalance(this.keys.key[i].address, DEFAULT_CONFIRMATIONS_THRESHOLD)
        if (balance.data['confirmed_balance'] > 0) {
          found = true
          await this.refreshWalletKeyInfo(i)
          index = i
          break
        } else {
          // Not enough confirmations
          return null
        }
      }
    }
    if (found) {
      for (let j = 0; j < this.keys.key[index].info.data.txs.length; j++) {
        let tx = this.keys.key[index].info.data.txs[j]
        if (tx.incoming === undefined || tx.outgoing !== undefined) {
          break
        }
        if (tx.confirmations > DEFAULT_CONFIRMATIONS_THRESHOLD && tx.incoming.spent === null) {
          this.last_address = {
            'address': this.keys.key[index].address,
            'wif': this.keys.key[index].wif,
            'value': tx.incoming.value,
            'txId': tx.txid,
            'utxoIndex': tx.incoming.output_no }
          this.store()
          return this.last_address
        }
      }
    } else {
      await this.generateNewKey()
      return this.getFirstUtxo()
    }
    return null
  }
}
