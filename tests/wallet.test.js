const fs = require('fs')
const Wallet = require('../lib/wallet.js')
require('chai').should()

const FILENAME = '.wallet/test.json'

it('Should be able to build a Wallet', function () {
  let mnemonic = 'question flock gloom frequent fog grief ticket glory beef truly settle suffer'
  let wallet = new Wallet(FILENAME, mnemonic, 4)
  wallet.keys.key.should.be.an('array')
  wallet.keys.key.length.should.be.a('number')
  wallet.keys.key.length.should.equal(4)
  wallet.keys.key[0].should.be.an('object')
  wallet.keys.key[0].wif.should.be.a('string')
  wallet.keys.key[0].wif.should.equal('cVaapSC8iinubjXcVHBnf8hTKsKiwLnzqmB6NzHE8n3UMUTRCmf7')
  wallet.keys.key[0].address.should.be.a('string')
  wallet.keys.key[0].address.should.equal('msbXLN3KsvKQmPF8vc87EDUKuczM5HWEjc')
  let secondWallet = new Wallet(FILENAME)
  wallet.should.eql(secondWallet)
  fs.unlinkSync(FILENAME)
})

it('Should be able to read a Wallet from a file and retrieve utxo info', async function () {
  let mnemonic = 'question flock gloom frequent fog grief ticket glory beef truly settle suffer'
  let wallet = new Wallet(FILENAME, mnemonic, 4)
  await wallet.refreshWalletInfo()
  wallet.keys.key.map((x) => x.info.should.be.an('object'))
  wallet.keys.key.map((x) => x.info.should.include.key('status'))
  wallet.keys.key.map((x) => x.info.status.should.be.a('string'))
  wallet.keys.key.map((x) => x.info.status.should.equal('success'))
  await wallet.refreshWalletInfo(true)
  wallet.store()
})
