const help = `
atklogin <options>

options:
========
"-h"
"--help"
    Print a help message describing all command-line options.

"-v"
"--version"
    Display the version.

"-e" <account_email_address>
"--email" <account_email_address>
    Account login credential: email address

"-p" <account_password>
"--password" <account_password>
    Account login credential: password

notes:
======
 * "--email" and "--password" are both required for login
 * successful login prints the resulting authorization token
   - exit code: 0
 * unsuccessful login produces no output
   - exit code: 1
`

module.exports = help
