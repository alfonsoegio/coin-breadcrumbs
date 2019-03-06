const txref = require('./lib/txref.js')

console.log(txref.encode('mainnet', 1400000, 3, 2))
console.log(txref.decode(txref.encode('testnet', 1400000, 3, 2)))
