const bip39 = require('bip39')

const generateMnemonic = function () {
  let mnemonic = bip39.generateMnemonic()
  mnemonic = 'camera power feature bamboo great scale walnut wing sample stumble cream vote'
  console.log(mnemonic)
  let seed = bip39.mnemonicToSeedHex(mnemonic)
  return seed
}

module.exports = {
  generateMnemonic: generateMnemonic
}
