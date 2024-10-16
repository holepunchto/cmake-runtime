/* global Bare */
const runtime = require('..')

const argv = typeof Bare !== 'undefined' ? Bare.argv : process.argv

module.exports = function spawn (referrer, opts) {
  try {
    require('child_process').execFileSync(runtime(referrer, opts), argv.slice(2), { stdio: 'inherit' })
  } catch (err) {
    if (err.status === undefined) throw err

    process.exitCode = err.status || 1
  }
}
