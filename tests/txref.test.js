const txref = require('../lib/txref.js')
require('chai').should()

it('txref should encode a txref given a blockHeight, blockIndex and utxoIndex', function () {
  let blockHeight = 1484035
  let blockIndex = 2
  let utxoIndex = 1
  let chain = 'testnet'
  let txrefEncoding = txref.encode(chain, blockHeight, blockIndex, utxoIndex)
  txrefEncoding.should.be.a('string')
  txrefEncoding.should.equal('txtest1:8xsj-6zzq-qpqq-8qwr-ns')
})

it('txref should decode a DID referencing a blockHeight, blockIndex and utxoIndex', function () {
  let tx = txref.decode('txtest1:8xsj-6zzq-qpqq-8qwr-ns')
  tx.should.be.an('object')

  tx.should.include.key('blockHeight')
  tx.blockHeight.should.equal(1484035)

  tx.should.include.key('blockIndex')
  tx.blockIndex.should.equal(2)

  tx.should.include.key('utxoIndex')
  tx.utxoIndex.should.equal(1)

  tx.should.include.key('chain')
  tx.chain.should.equal('testnet')
})
