const { version } = require('../package.json')

const __DOWNLOAD_DIR__ = process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE'] + '/.template'
const __ORG__ = 'Brickies'
const __REPO__ = 'vue-template'
const __META__ = 'meta.js'

module.exports = {
  version,
  __DOWNLOAD_DIR__,
  __ORG__,
  __REPO__,
  __META__
}
