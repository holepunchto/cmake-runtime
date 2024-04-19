const os = require('os')
const path = require('path')

module.exports = function runtime (referrer, opts) {
  if (typeof referrer === 'object' && referrer !== null) {
    opts = referrer
    referrer = 'cmake'
  } else if (typeof referrer !== 'string') {
    referrer = 'cmake'
  }

  if (!opts) opts = {}

  const {
    platform = os.platform(),
    arch = platform === 'darwin' ? 'universal' : os.arch()
  } = opts

  const filename = path.basename(referrer)

  const base = `cmake-runtime-${platform}-${arch}`

  let mod
  try {
    mod = require.resolve(`${base}/package.json`)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`No binary found for target '${platform}-${arch}'`)
    } else {
      throw err
    }
  }

  return path.join(mod, '..', require(mod).bin[filename])
}
