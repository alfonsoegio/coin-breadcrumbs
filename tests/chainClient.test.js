const chainClient = require('../lib/chainClient.js')
require('chai').should()

it('chainClient should get a transaction from its txId', async function () {
  let txId = '19d524a556849264018206a3b4640110dd57906fdf564dc5d60b271f178a35be'
  let response = await chainClient.getTx(txId)
  response.data.block_no.should.be.a('number')
  response.data.block_no.should.equal(1483699)
  response.data.blockhash.should.be.a('string')
  response.data.blockhash.should.equal('00000000000000d344265f96696ea0982bff8feb06727925a352d2cf5d7547ce')
})
