const axios = require('axios')
const ora = require('ora')
const {
  __DOWNLOAD_DIR__,
  __ORG__
} = require('./constants')
const { promisify } = require('util')
const exec = require('child_process').execSync

let download = require('download-git-repo')
download = promisify(download)

exports.fetchRepoList = async () => {
  const { data } = await axios.get(`https://api.github.com/orgs/${__ORG__}/repos`)
  return data
}

exports.fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/${__ORG__}/${repo}/tags`)
  return data
}

exports.fetchBranchList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/${__ORG__}/${repo}/branches`)
  return data
}

exports.downloadAndGenerate = async (repo, tagOrBranch) => {
  let api = `${__ORG__}/${repo}`
  if (tagOrBranch) {
    api += `#${tagOrBranch}`
  }
  const dest = `${__DOWNLOAD_DIR__}/${repo}`
  await download(api, dest)
  return dest
}

exports.loading = (fn, message) => async (...args) => {
  const spinner = ora(message)
  spinner.start()
  const result = await fn(...args)
  spinner.succeed()
  return result
}

exports.setDefault = (prompts, key, val) => {
  if (!prompts[key] || typeof prompts[key] !== 'object') {
    prompts[key] = {
      type: 'string',
      default: val
    }
  } else {
    prompts[key].default = val
  }
}

exports.getGitUser = () => {
  let name
  let email

  try {
    name = exec('git config --get user.name')
    email = exec('git config --get user.email')
  } catch (e) {}

  name = name && JSON.stringify(name.toString().trim()).slice(1, -1)
  email = email && (' (' + email.toString().trim() + ')')
  return (name || '') + (email || '')
}
