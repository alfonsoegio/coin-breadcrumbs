const bech32 = require('bech32')

let MAGIC_BTC_MAINNET = 0x03
let MAGIC_BTC_MAINNET_EXTENDED = 0x04
let MAGIC_BTC_TESTNET = 0x06
let MAGIC_BTC_TESTNET_EXTENDED = 0x07

let TXREF_BECH32_HRP_MAINNET = 'tx'
let TXREF_BECH32_HRP_TESTNET = 'txtest'

let CHAIN_MAINNET = 'mainnet'
let CHAIN_TESTNET = 'testnet'

const encode = function (chain, blockHeight, txPos, utxoIndex) {
  let prefix = chain === CHAIN_MAINNET ? TXREF_BECH32_HRP_MAINNET : TXREF_BECH32_HRP_TESTNET
  let extendedTxref = utxoIndex !== undefined

  var magic
  if (extendedTxref) {
    magic = chain === CHAIN_MAINNET ? MAGIC_BTC_MAINNET_EXTENDED : MAGIC_BTC_TESTNET_EXTENDED
  } else {
    magic = chain === CHAIN_MAINNET ? MAGIC_BTC_MAINNET : MAGIC_BTC_TESTNET
  }

  var shortId
  if (extendedTxref) {
    shortId = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] // 12
  } else {
    shortId = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] // 9
  }

  if (blockHeight > 0xFFFFFF || txPos > 0x7FFF || magic > 0x1F) {
    return null
  }

  if (extendedTxref && utxoIndex > 0x7FFF) {
    return null
  }

  /* set the magic */
  shortId[0] = magic

  /* make sure the version bit is 0 */
  shortId[1] &= ~(1 << 0)

  shortId[1] |= ((blockHeight & 0xF) << 1)
  shortId[2] |= ((blockHeight & 0x1F0) >> 4)
  shortId[3] |= ((blockHeight & 0x3E00) >> 9)
  shortId[4] |= ((blockHeight & 0x7C000) >> 14)
  shortId[5] |= ((blockHeight & 0xF80000) >> 19)

  shortId[6] |= ((txPos & 0x1F))
  shortId[7] |= ((txPos & 0x3E0) >> 5)
  shortId[8] |= ((txPos & 0x7C00) >> 10)

  if (extendedTxref) {
    shortId[9] |= ((utxoIndex & 0x1F))
    shortId[10] |= ((utxoIndex & 0x3E0) >> 5)
    shortId[11] |= ((utxoIndex & 0x7C00) >> 10)
  }

  let result = bech32.encode(prefix, shortId)

  let origLength = result.length
  let breakIndex = prefix.length + 1
  let finalResult = result.substring(0, breakIndex) + ':' +
    result.substring(breakIndex, breakIndex + 4) + '-' +
    result.substring(breakIndex + 4, breakIndex + 8) + '-' +
    result.substring(breakIndex + 8, breakIndex + 12) + '-'
  if (origLength - breakIndex < 16) {
    finalResult += result.substring(breakIndex + 12, result.length)
  } else {
    finalResult += result.substring(breakIndex + 12, breakIndex + 16) + '-' +
        result.substring(breakIndex + 16, result.length)
  }

  return finalResult
}

const decode = function (bech32Tx) {
  let stripped = bech32Tx.replace(/-/g, '')
  stripped = stripped.replace(/:/g, '')
  let result = bech32.decode(stripped)
  if (result === null) {
    return null
  }
  let buf = result.words
  let extendedTxref = buf.length === 12

  let chainMarker = buf[0]

  var blockHeight = 0
  var blockIndex = 0
  var utxoIndex = 0

  blockHeight = (buf[1] >> 1)
  blockHeight |= (buf[2] << 4)
  blockHeight |= (buf[3] << 9)
  blockHeight |= (buf[4] << 14)
  blockHeight |= (buf[5] << 19)

  blockIndex = buf[6]
  blockIndex |= (buf[7] << 5)
  blockIndex |= (buf[8] << 10)

  if (extendedTxref) {
    utxoIndex = buf[9]
    utxoIndex |= (buf[10] << 5)
    utxoIndex |= (buf[11] << 10)
  }

  var chain
  if (chainMarker === MAGIC_BTC_MAINNET || chainMarker === MAGIC_BTC_MAINNET_EXTENDED) {
    chain = CHAIN_MAINNET
  } else {
    chain = CHAIN_TESTNET
  }

  return {
    'blockHeight': blockHeight,
    'blockIndex': blockIndex,
    'chain': chain,
    'utxoIndex': utxoIndex
  }
}

module.exports = {
  encode: encode,
  decode: decode
}
