const txref = require('../lib/txref.js')
require('chai').should()

it('txref should encode a txref given a blockHeight, blockIndex and utxoIndex', function () {
  let blockHeight = 140002
  let blockIndex = 3
  let utxoIndex = 2
  let chain = 'testnet'
  let txrefEncoding = txref.encode(chain, blockHeight, blockIndex, utxoIndex)
  txrefEncoding.should.be.a('string')
  txrefEncoding.should.equal('txtest1:8yw3-gqrq-qzqq-g93l-37')
})

it('txref should decode a DID referencing a blockHeight, blockIndex and utxoIndex', function () {
  let tx = txref.decode('txtest1:8yw3-gqrq-qzqq-g93l-37')
  tx.should.be.an('object')

  tx.should.include.key('blockHeight')
  tx.blockHeight.should.equal(140002)

  tx.should.include.key('blockIndex')
  tx.blockIndex.should.equal(3)

  tx.should.include.key('utxoIndex')
  tx.utxoIndex.should.equal(2)

  tx.should.include.key('chain')
  tx.chain.should.equal('testnet')
})
