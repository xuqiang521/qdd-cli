const program = require('commander')
const { version } = require('./constants')
const path = require('path')

const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'fe-cli create <project-name>'
    ]
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'fe-cli config set <key><value>',
      'fe-cli config get <key>'
    ]
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: []
  }
}

Reflect.ownKeys(mapActions).forEach((action) => {
  const item = mapActions[action]
  program
    .command(action)
    .alias(item.alias)
    .description(item.description)
    .action(() => {
      if (action === '*') {
        console.log(item.description)
      } else {
        require(path.resolve(__dirname, action))(...process.argv.slice(3))
      }
    })
})

program.on('--help', () => {
  console.log('\nExamples:')
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach(example => {
      console.log(` ${example}`)
    })
  })
})

program.version(version).parse(process.argv)
