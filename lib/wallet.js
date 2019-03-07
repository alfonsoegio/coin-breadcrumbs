const bip39 = require('bip39')
const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')
const fs = require('fs')
const assert = require('assert')
const chainClient = require('./chainClient.js')
const rateLimit = require('rate-limit')

const DEFAULT_KEY_NUMBER = 3
const DEFAULT_INTERVAL = 10000

function getAddress (node, network) {
  return bitcoin.payments.p2pkh({ pubkey: node.publicKey, wif: node.toWIF(), network })
}

module.exports = class Wallet {
  constructor (filename, mnemonic, keyNumber) {
    if (fs.existsSync(filename)) {
      this.keys = JSON.parse(fs.readFileSync(filename))
    }
    if (mnemonic === undefined) {
      mnemonic = bip39.generateMnemonic()
    }
    assert(bip39.validateMnemonic(mnemonic))
    let keys = { 'mnemonic': mnemonic, 'key': [] }
    let seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed, bitcoin.networks.testnet)
    if (keyNumber === undefined) {
      keyNumber = DEFAULT_KEY_NUMBER
    }
    for (let i = 0; i < keyNumber; i++) {
      let newAddress = getAddress(root.derivePath('m/44\'/60\'/0\'/0/' + i), bitcoin.networks.testnet)
      keys.key.push({ 'address': newAddress.address, 'wif': newAddress.wif })
    }
    fs.writeFileSync(filename, JSON.stringify(keys, null, 2))
    console.log(keys)
    this.keys = keys
  }

  async refreshWalletInfo (update) {
    let queue = rateLimit.createQueue({ interval: DEFAULT_INTERVAL })
    for (let i = 0; i < this.keys.key.length; i++) {
      if (update === undefined || this.keys.key[i]['info'] !== undefined) {
        let f = async function () {
          this.keys.key[i]['info'] = await chainClient.getAddressInfo(this.keys.key[i]['address'])
        }
        await queue.add(f.bind(this))
      }
    }
  }
}
