const process_argv = require('@warren-bank/node-process-argv')

const argv_flags = {
  "--help":      {bool:  true},
  "--version":   {bool:  true},
  "--email":     {},
  "--password":  {}
}

const argv_flag_aliases = {
  "--help":                   ["-h"],
  "--version":                ["-v"],
  "--email":                  ["-e"],
  "--password":               ["-p"]
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  const data = require('../../package.json')
  console.log(data.version)
  process.exit(0)
}

if (!argv_vals["--email"] || !argv_vals["--password"]) {
  console.log('ERROR: Missing required input options')
  process.exit(0)
}

module.exports = argv_vals
