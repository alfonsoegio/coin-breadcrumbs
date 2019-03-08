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
    let fileDoesNotExist = true
    if (fs.existsSync(filename)) {
      this.keys = JSON.parse(fs.readFileSync(filename))
      fileDoesNotExist = false
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
    if (fileDoesNotExist) {
      fs.writeFileSync(filename, JSON.stringify(this, null, 2))
    }
  }

  async refreshWalletKeyInfo (keyNumber) {
    let info = await chainClient.getAddressInfo(this.keys.key[keyNumber]['address'])
    return info
  }

  async refreshWalletInfo (update) {
    for (let i = 0; i < this.keys.key.length; i++) {
      if (update === undefined || this.keys.key[i]['info'] !== undefined) {
        let info = await this.refreshWalletKeyInfo(i)
        this.keys.key[i]['info'] = info
      }
    }
  }
}
