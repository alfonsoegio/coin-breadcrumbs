const CoinFeed = require('../lib/coinFeed.js')
require('chai').should()

const DEFAULT_TXREF = 'txtest1:8xsj-6zzq-qpqq-8qwr-ns'

it('coinFeed should resolve a timeline given a txref', async function () {
  let feed = new CoinFeed(DEFAULT_TXREF)
  let tx = await feed.resolve()
  tx.data.outputs.map((x) => console.log('    ' + x.script_asm))
})
