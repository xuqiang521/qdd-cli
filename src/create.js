const path = require('path')
const fs = require('fs')
const axios = require('axios')
const ora = require('ora')
const inquirer = require('inquirer')
const Metalsmith = require('metalsmith')
// const chalk = require('chalk')
const { __DOWNLOAD_DIR__, __ORG__ } = require('./constants')
const { promisify } = require('util')

let download = require('download-git-repo')
download = promisify(download)
let ncp = require('ncp')
ncp = promisify(ncp)
let { render } = require('consolidate').ejs // consolidate 处理模板引擎
render = promisify(render)

const fetchRepoList = async () => {
  const { data } = await axios.get(`https://api.github.com/orgs/${__ORG__}/repos`)
  return data
}

const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/${__ORG__}/${repo}/tags`)
  return data
}

const downloadAndGenerate = async (repo, tag) => {
  let api = `${__ORG__}/${repo}`
  if (tag) {
    api += `#${tag}`
  }
  const dest = `${__DOWNLOAD_DIR__}/${repo}`
  await download(api, dest)
  return dest
}

// loading
const loading = (fn, message) => async (...args) => {
  const spinner = ora(message)
  spinner.start()
  const result = await fn(...args)
  spinner.succeed()
  return result
}

module.exports = async (projectName) => {
  let repos = await loading(fetchRepoList, 'download template ...')()
  repos = repos.map(item => item.name)
  const { repo } = await inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choose a template to create project',
    choices: repos
  })

  let tags = await loading(fetchTagList, 'fetch tags ...')(repo)
  tags = tags.map(item => item.name)
  const { tag } = await inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choose a tag to create project',
    choices: tags
  })

  const result = await loading(downloadAndGenerate, 'download and generate ...')(repo, tag)

  // simple template
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(projectName))
  // difficult template
  } else {
    await new Promise((resolve, reject) => {
      Metalsmith(__dirname)
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const args = require(path.join(result, 'ask.js'))
          const _result = await inquirer.prompt(args)
          const meta = metal.metadata()
          Object.assign(meta, _result)
          delete files['ask.js']
          done()
        })
        .use((files, metal, done) => {
          const _result = metal.metadata()
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString()
              if (content.includes('<%')) {
                content = await render(content, _result)
                files[file].contents = Buffer.from(content)
              }
            }
          })
          console.log(_result)
          done()
        })
        .build((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
    })
  }
  process.exit()
}
