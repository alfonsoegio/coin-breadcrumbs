const Wallet = require('./lib/wallet.js')

const main = async function () {
  let myWallet = new Wallet('.wallet/keys.json')
  await myWallet.refreshWalletInfo()
}

main()
