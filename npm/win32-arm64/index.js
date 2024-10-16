const asset = require('require-asset')

exports.cmake = asset('./bin/cmake.exe', __filename)
exports.cmcldeps = asset('./bin/cmcldeps.exe', __filename)
exports.cpack = asset('./bin/cpack.exe', __filename)
exports.ctest = asset('./bin/ctest.exe', __filename)
