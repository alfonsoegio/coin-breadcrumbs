const Wallet = require('./lib/wallet.js')

const FILENAME = '.wallet/keys.json'

const main = async function () {
  let myWallet = new Wallet(FILENAME)
  await myWallet.refreshWalletInfo()
  await setTimeout(() => console.log(myWallet), 40000)
  console.log(JSON.stringify(myWallet, null, 2))
}

main()
