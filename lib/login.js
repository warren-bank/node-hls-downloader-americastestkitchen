const {download_json} = require('./http_download')

const login = async function(argv_vals){
  const user_email    = argv_vals["--email"]
  const user_password = argv_vals["--password"]
  const POST_url      = 'https://www.americastestkitchen.com/api/v4/sign_in?site_key=atk'
  const POST_data     = `{"email":"${user_email}","password":"${user_password}"}`

  const response = await download_json(POST_url, null, POST_data)

  const token = (response && (response instanceof Object) && response.token)
    ? response.token
    : ''

  return token
}

module.exports = {login}
