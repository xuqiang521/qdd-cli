const { version } = require('../package.json')

const __DOWNLOAD_DIR__ = process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE'] + '/.template'
const __ORG__ = 'zhu-cli'

module.exports = {
  version,
  __DOWNLOAD_DIR__,
  __ORG__
}
