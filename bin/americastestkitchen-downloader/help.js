const help = `
atkdl <options>

options:
========
"-h"
"--help"
    Print a help message describing all command-line options.

"-v"
"--version"
    Display the version.

"-q"
"--quiet"
    Do not print a verbose log of operations.

"-ll" <integer>
"--log-level" <integer>
    Specify the log verbosity level.
      0 = no output (same as --quiet)
      1 = include only episode URLs
      2 = include only episode ffmpeg commands
      3 = include all operational metadata (default)

"-dr"
"--dry-run"
    Do not write to the file system.

"-nm"
"--no-mp4"
    Do not use "ffmpeg" to bundle the downloaded video stream into an .mp4 file container.

"-mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.

"-P" <dirpath>
"--directory-prefix" <dirpath>
    Specifies the directory where the resulting file structure will be saved to.
    The default is "." (the current directory).

"-t" <token>
"--token" <token>
    Specify an authorization token for an authenticated log-in session.
    To obtain such a token for a paid or trial account:
      atklogin --email <account_email_address> --password <account_password>

"-u" <URL>
"--url" <URL>
    Specify an episode URL.

"-i <filepath>"
"--input-file <filepath>"
    Read episode URLs from a local text file. Format is one URL per line.

"-a"
"--all"
    Process all episodes in all seasons.

"-s" <integer>
"--season" <integer>
    Process all episodes in the specified season.

"-e" <integer>
"--episode" <integer>
    Process one specific episode in the specified season.
    Requires: '--season'
`

module.exports = help
