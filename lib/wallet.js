const bip39 = require('bip39')
const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')
const fs = require('fs')
const assert = require('assert')
const chainClient = require('./chainClient.js')

const DEFAULT_KEY_NUMBER = 1

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
    fs.writeFileSync(filename, JSON.stringify(this, null, 2))
  }

  generateNewKey () {
    let seed = bip39.mnemonicToSeed(this.mnemonic)
    const root = bip32.fromSeed(seed, bitcoin.networks.testnet)
    let newIndex = this.keys.key.length
    let newAddress = getAddress(root.derivePath('m/44\'/60\'/0\'/0/' + newIndex), bitcoin.networks.testnet)
    this.keys.key.push({ 'address': newAddress.address, 'wif': newAddress.wif })
  }

  store () {
    fs.writeFileSync(this.filename, JSON.stringify(this, null, 2))
  }

  async refreshWalletKeyInfo (keyNumber, update) {
    if (update === true && typeof (this.keys.key[keyNumber]['info']) === 'object') {
      return this.keys.key[keyNumber]['info']
    }
    let info = await chainClient.getAddressInfo(this.keys.key[keyNumber]['address'])
    return info
  }

  async refreshWalletInfo (update) {
    for (let i = 0; i < this.keys.key.length; i++) {
      let info = await this.refreshWalletKeyInfo(i, update)
      this.keys.key[i]['info'] = info
    }
  }

  async getFirstUtxo () {
    await this.refreshWalletInfo(true)
    for (let i = 0; i < this.keys.key.length; i++) {
      if (this.keys.key[i].info === undefined) {
        continue
      }
      for (let j = 0; j < this.keys.key[i].info.data.txs.length; j++) {
        let tx = this.keys.key[i].info.data.txs[j]
        if (tx.confirmations > 0 && tx.incoming.spent === null) {
          return {
            'address': this.keys.key[i].address,
            'wif': this.keys.key[i].wif,
            'value': tx.incoming.value,
            'txId': tx.txid,
            'utxoIndex': tx.incoming.output_no }
        }
      }
    }
    return null
  }

  async getFirstFreshUtxo () {
    await this.refreshWalletInfo(true)
    for (let i = 0; i < this.keys.key.length; i++) {
      if (this.keys.key[i].info === undefined) {
        continue
      }
      if (this.keys.key[i].info.data.txs.length === 0) {
        return {
          'address': this.keys.key[i].address,
          'wif': this.keys.key[i].wif }
      }
    }
    this.generateNewKey()
    return {
      'address': this.keys.key[this.keys.key.length - 1].address,
      'wif': this.keys.key[this.keys.key.length - 1].wif }
  }
}
