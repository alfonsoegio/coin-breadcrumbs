const txref = require('./lib/txref.js')
const chainClient = require('./lib/chainClient.js')

const main = async function () {
  console.log(txref.encode('mainnet', 1400000, 3, 2))
  console.log(txref.decode(txref.encode('testnet', 1400000, 3, 2)))
  console.log(await chainClient.getTx('03ab7086dd9fc7c92df5288238e94871051129f6341f22ab6612da15443a3096'))
}

main()
