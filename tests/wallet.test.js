const Wallet = require('../lib/wallet.js')
require('chai').should()

it('Should be able to build a Wallet', function () {
  let mnemonic = 'question flock gloom frequent fog grief ticket glory beef truly settle suffer'
  let wallet = new Wallet('.wallet/test.json', mnemonic, 4)
  wallet.keys.key.should.be.an('array')
  wallet.keys.key.length.should.be.a('number')
  wallet.keys.key.length.should.equal(4)
})
