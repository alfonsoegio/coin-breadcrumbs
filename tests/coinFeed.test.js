const CoinFeed = require('../lib/coinFeed.js')
require('chai').should()

const DEFAULT_TXREF = 'txtest1:8xsj-6zzq-qpqq-8qwr-ns'

it('coinFeed should resolve a timeline given a txref', async function () {
  let feed = new CoinFeed(DEFAULT_TXREF)
  let timeline = await feed.resolve()
  console.log(JSON.stringify(timeline, null, 4))
})
