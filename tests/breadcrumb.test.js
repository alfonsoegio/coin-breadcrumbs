const uuidv1 = require('uuid/v1')
const Wallet = require('../lib/wallet.js')
const Breadcrumb = require('../lib/breadcrumb.js')
require('chai').should()

const FILENAME = '.wallet/test.json'
const MNEMONIC = 'question flock gloom frequent fog grief ticket glory beef truly settle suffer'
const DEFAULT_ADDRESS_NO = 3
const BASE_URL = 'http://example.com/'
const DEFAULT_FEE = 0.0005

it('should be able to build and broadcast a breadcrumb', function () {
  let wallet = new Wallet(FILENAME, MNEMONIC, DEFAULT_ADDRESS_NO)
  let url = BASE_URL + uuidv1()
  let breadcrumb = new Breadcrumb(wallet, url, DEFAULT_FEE)
  breadcrumb.execute()
})
