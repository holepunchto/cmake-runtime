/* global Bare */
const { spawnSync } = require('child_process')
const runtime = require('..')

module.exports = function spawn (referrer, opts) {
  if (typeof referrer === 'object' && referrer !== null) {
    opts = referrer
    referrer = 'cmake'
  } else if (typeof referrer !== 'string') {
    referrer = 'cmake'
  }

  if (!opts) opts = {}

  const {
    argv = typeof Bare !== 'undefined' ? Bare.argv.slice(2) : process.argv.slice(2)
  } = opts

  return spawnSync(runtime(referrer, opts), argv, opts)
}
