const {requestHTTP} = require('@warren-bank/node-hls-downloader')

const parse_url = require('url').parse

const download_file = async function(url, headers, POST_data){
  const options = (!headers)
    ? url
    : Object.assign({}, parse_url(url), {headers})

  let file
  try {
    file = await requestHTTP(options, POST_data)
    file = file.response.toString()
  }
  catch(err) {
    file = ""
  }
  return file
}

const download_json = async function(url, headers, POST_data){
  const json = await download_file(url, headers, POST_data)
  let data
  try {
    data = JSON.parse(json)
  }
  catch(err) {
    data = null
  }
  return data
}

module.exports = {download_file, download_json}
