var log = require('loglevel')
var db = require('./db.js')(log)
const Web3 = require('web3')
const Promise = require('bluebird')
const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))
var Parity = require('../api/parity')(db, log)

db.poolConnect().then(() => {
  db.getLatestCachedBlockTime() 
  .then((result) => {
    let currentValue = 1
    currentValue = parseInt(result) + 1
    console.log('current value is', currentValue)
    generateBlockTimeMappings(currentValue)
  })
  .catch((err) => {
    console.log('Error getting latest cached block from DB, exiting')
    console.log(err)
    process.exit(1)
  })
})

let getCurrentBlock = function () {
  let result = web3.eth.getBlock('latest')
  return result.number;
}

console.log('REE1')
let currentLatestBlock = getCurrentBlock()
console.log('REE2')

let generateBlockTimeMappings = async function (index) {
  console.log('Logging block number  ' + index)
  console.log('Current latest is: ' + currentLatestBlock)
  if (index >= currentLatestBlock) {
    console.log('Waiting for 1 minute')
    Promise.delay(1000 * 60).then(() => {
      generateBlockTimeMappings(index)
    })
  } else {
    return Parity.calculateBlockTime(index).then((time) => {
      console.log('B,V: ' + index + ', ' + time)
      db.getBlockTime(index)
        .then((result) => {
          if (result.recordset.length !== 0) {
            generateBlockTimeMappings(index += 1)
            console.log('We already had this one')
          } else {
            console.log('New one')
            db.addBlockTime([[index, time, 0]])
              .then(() => {
                generateBlockTimeMappings(index += 1)
              })
              .catch(() => {
                console.log('Error adding - why?')
              })
          }
        })
    })
  }
}
