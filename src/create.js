const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer')
const Metalsmith = require('metalsmith')
const rm = require('rimraf').sync
const chalk = require('chalk')
const {
  __DOWNLOAD_DIR__,
  __REPO__,
  __META__
} = require('./constants')
const {
  fetchTagList,
  fetchBranchList,
  downloadAndGenerate,
  loading,
  setDefault,
  getGitUser
} = require('./utils')
const { promisify } = require('util')

let { render } = require('consolidate').handlebars // consolidate 处理模板引擎
render = promisify(render)

function logMessage (message, data) {
  if (!message) return
  render(message, data, (err, res) => {
    if (err) {
      console.error('\n   Error when rendering template complete message: ' + err.message.trim())
    } else {
      console.log('\n' + res.split(/\r?\n/g).map(line => '   ' + line).join('\n'))
    }
  })
}

module.exports = async (projectName) => {
  // let repos = await loading(fetchRepoList, 'download template ...')()
  // repos = repos.map(item => item.name)
  // const { repo } = await inquirer.prompt({
  //   name: 'repo',
  //   type: 'list',
  //   message: 'please choose a template to create project',
  //   choices: repos,
  //   default: 'vue-template'
  // })

  let tags = await loading(fetchTagList, 'fetch tags ...')(__REPO__)
  tags = tags.map(item => item.name)
  let branches = await loading(fetchBranchList, 'fetch branches ...')(__REPO__)
  branches = branches.map(item => item.name)
  const { tagOrBranch } = await inquirer.prompt({
    name: 'tagOrBranch',
    type: 'list',
    message: 'please choose a tag or branch to create project',
    choices: [...tags, ...branches]
  })

  if (fs.existsSync(path.join(__DOWNLOAD_DIR__))) rm(__DOWNLOAD_DIR__)

  const result = await loading(downloadAndGenerate, 'download and generate ...')(__REPO__, tagOrBranch)
  const opts = require(path.join(result, __META__))
  const metalsmith = Metalsmith(__dirname)
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: projectName
  })

  await new Promise((resolve, reject) => {
    metalsmith
      .source(path.join(result, 'template'))
      .destination(path.resolve(projectName))
      .use(async (files, metal, done) => {
        const prompts = opts.prompts
        const args = []
        const author = getGitUser()
        Reflect.ownKeys(prompts).forEach(key => {
          prompts[key].name = key
          setDefault(prompts, 'name', projectName)
          setDefault(prompts, 'author', author)
          args.push(prompts[key])
        })
        const _result = await inquirer.prompt(args)
        // const meta = metal.metadata()
        Object.assign(data, _result)
        done()
      })
      .use((files, metal, done) => {
        Reflect.ownKeys(files).forEach(async (file) => {
          let content = files[file].contents.toString()
          if (/{{([^{}]+)}}/g.test(content)) {
            content = await render(content, data)
            files[file].contents = Buffer.from(content)
          }
        })
        done()
      })
      .build((err, files) => {
        if (err) {
          reject(err)
        } else {
          if (typeof opts.complete === 'function') {
            const helpers = { chalk, files }
            opts.complete(data, helpers)
          } else {
            logMessage(opts.completeMessage, data)
          }
          resolve()
        }
      })
  })
  console.log()
  process.on('exit', () => {
    console.log()
  })
}
