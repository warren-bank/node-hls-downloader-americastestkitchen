#! /usr/bin/env node

const argv_vals = require('./americastestkitchen-login/process_argv')
const {login}   = require('../lib/login')

login(argv_vals)
.then((token) => {
  if (!token) throw new Error('unsuccessful login')

  console.log(token)
  process.exit(0)
})
.catch(err => {
  process.exit(1)
})
