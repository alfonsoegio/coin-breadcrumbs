const txref = require('./lib/txref.js')
const chainClient = require('./lib/chainClient.js')
const wallet = require('./lib/wallet.js')

const main = async function () {
  let txId = '19d524a556849264018206a3b4640110dd57906fdf564dc5d60b271f178a35be'
  let tx = await chainClient.getTx(txId)
  let blockHash = tx.data.blockhash
  let txPos = await chainClient.getTxPosition(txId, blockHash)
  let did = txref.encode('testnet', tx.data.block_no, txPos, 0)

  console.log('Encoded did: ' + did)
  console.log('Decoded did: ' + JSON.stringify(txref.decode(did)))
  console.log(wallet.generateMnemonic())
}

main()
