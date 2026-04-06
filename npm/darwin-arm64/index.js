const asset = require('require-asset')

exports.ccmake = asset('./bin/ccmake', __filename)
exports.cmake = asset('./bin/cmake', __filename)
exports.cpack = asset('./bin/cpack', __filename)
exports.ctest = asset('./bin/ctest', __filename)
