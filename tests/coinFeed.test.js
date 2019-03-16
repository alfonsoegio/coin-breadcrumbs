const CoinFeed = require('../lib/coinFeed.js')
require('chai').should()

const DEFAULT_TXREF = 'txtest1:8xsj-6zzq-qpqq-8qwr-ns'
const DEFAULT_FILENAME = '.coinFeeds/test.json'

it('coinFeed should resolve a timeline given a txref', async function () {
  let feed = new CoinFeed(DEFAULT_FILENAME, DEFAULT_TXREF)
  await feed.resolve()
})
