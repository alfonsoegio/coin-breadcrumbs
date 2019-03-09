const fs = require('fs')
const Wallet = require('../lib/wallet.js')
require('chai').should()

const FILENAME = '.wallet/test.json'
const MNEMONIC = 'question flock gloom frequent fog grief ticket glory beef truly settle suffer'
const DEFAULT_ADDRESS_NO = 3

it('should be able to build a wallet', function () {
  let wallet = new Wallet(FILENAME, MNEMONIC, DEFAULT_ADDRESS_NO)
  wallet.keys.key.should.be.an('array')
  wallet.keys.key.length.should.be.a('number')
  wallet.keys.key.length.should.equal(3)
  wallet.keys.key[0].should.be.an('object')
  wallet.keys.key[0].wif.should.be.a('string')
  wallet.keys.key[0].wif.should.equal('cVaapSC8iinubjXcVHBnf8hTKsKiwLnzqmB6NzHE8n3UMUTRCmf7')
  wallet.keys.key[0].address.should.be.a('string')
  wallet.keys.key[0].address.should.equal('msbXLN3KsvKQmPF8vc87EDUKuczM5HWEjc')
  let secondWallet = new Wallet(FILENAME)
  wallet.should.eql(secondWallet)
  fs.unlinkSync(FILENAME)
})

it('should be able to read a wallet from a file and retrieve utxo info', async function () {
  let wallet = new Wallet(FILENAME, MNEMONIC, DEFAULT_ADDRESS_NO)
  await wallet.refreshWalletInfo()
  wallet.keys.key.map((x) => x.info.should.be.an('object'))
  wallet.keys.key.map((x) => x.info.should.include.key('status'))
  wallet.keys.key.map((x) => x.info.status.should.be.a('string'))
  wallet.keys.key.map((x) => x.info.status.should.equal('success'))
  await wallet.refreshWalletInfo(true)
  wallet.store()
})

it('should be able to read a wallet and generate a new key', async function () {
  let wallet = new Wallet(FILENAME)
  wallet.keys.key.length.should.equal(3)
  wallet.generateNewKey()
  wallet.keys.key.length.should.equal(4)
  await wallet.refreshWalletInfo(true)
})

it('should be able to read a wallet and find an UTXO', async function () {
  let wallet = new Wallet(FILENAME)
  await wallet.refreshWalletInfo(true)
  let utxo = await wallet.getFirstUtxo()
  utxo.address.should.be.a('string')
  utxo.wif.should.be.a('string')
  utxo.value.should.be.a('string')
})
