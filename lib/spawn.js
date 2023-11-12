const path = require('path')

module.exports = function spawn (referrer, opts = {}) {
  let {
    platform = process.platform,
    arch = process.arch
  } = opts

  if (platform === 'win32') platform = 'windows'
  if (platform === 'darwin') arch = 'universal'

  const filename = path.basename(referrer)

  const base = `cmake-binary-${platform}-${arch}`

  let mod
  try {
    mod = require.resolve(`${base}/package.json`)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`No binary found for target ${platform}-${arch}`)
    } else {
      throw err
    }
  }

  const pkg = require(mod)

  const bin = path.join(mod, '..', pkg.bin[filename])

  try {
    require('child_process').execFileSync(bin, process.argv.slice(2), { stdio: 'inherit' })
  } catch (err) {
    process.exitCode = err.status
  }
}
