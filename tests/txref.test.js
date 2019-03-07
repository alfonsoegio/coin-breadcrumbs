const txref = require('../lib/txref.js')
require('chai').should()

it('txref should encode a txref given a blockHeight, txPos and utxoIndex', function () {
  let blockHeight = 140000
  let txPos = 3
  let utxoIndex = 2
  let txrefEncoding = txref.encode(blockHeight, txPos, utxoIndex)
  txrefEncoding.should.be.a('string')
  txrefEncoding.should.equal('txtest1:xxqq-qqzq-qwt0-qhn')
})

it('txref should decode a DID referencing a blockHeight, txPos and utxoIndex', function () {
  let tx = txref.decode('txtest1:xxqq-qqzq-qwt0-qhn')
  tx.should.be.an('object')
  tx.should.include.key('blockHeight')
  tx.should.include.key('blockIndex')
  tx.should.include.key('utxoIndex')
  tx.should.include.key('chain')
  // txrefEncoding.should.equal('txtest1:xxqq-qqzq-qwt0-qhn')
})
