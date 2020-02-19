### [_Americas Test Kitchen_ Downloader](https://github.com/warren-bank/node-hls-downloader-americastestkitchen)

Command-line utility for downloading an offline copy of [_Americas Test Kitchen_](https://www.americastestkitchen.com/episodes/browse) HLS video streams.

#### Installation:

```bash
npm install --global @warren-bank/node-hls-downloader-americastestkitchen
```

#### Features:

* accepts URLs that identify:
  - a single episode
* accepts CLI options to identify:
  - a single episode
  - a single season
  - all episodes in every season
* downloads:
  - the highest available quality for each video stream
  - _vtt_ subtitles for all available languages
  - will continue upon restart after an abrupt interruption
* resulting file structure:
  ```bash
    |- {title_series}/
    |  |- {title_episode}/
    |  |  |- hls/
    |  |  |  |- video/
    |  |  |  |  |- *.ts
    |  |  |  |- audio/
    |  |  |  |  |- {language}/
    |  |  |  |  |  |- *.ts
    |  |  |  |  |- {language}.m3u8
    |  |  |  |- video.m3u8
    |  |  |  |- master.m3u8
    |  |  |- mp4/
    |  |  |  |- video.mp4
    |  |  |  |- video.{language}.vtt
    |  |  |  |- video.{language}.srt
  ```

#### Usage:

```bash
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
```

#### Example:

* download an episode (by URL):
  ```bash
    # Season 20, Ep 7 - The Very Best Paris-Brest
    atkdl -q -mc 5 -u 'https://www.americastestkitchen.com/episode/653-the-very-best-paris-brest'
  ```
* download an episode (by CLI options):
  ```bash
    # Season 20, Ep 7 - The Very Best Paris-Brest
    atkdl -q -mc 5 -s 20 -e 7
  ```
* download all episodes in one season:
  ```bash
    # Season 20
    atkdl -q -mc 5 -s 20
  ```
* download all episodes in all seasons:
  ```bash
    atkdl -q -mc 5 -a
  ```
* print a trace of the operations that would occur IF all episodes in one season were to be downloaded:
  ```bash
    # Season 20
    atkdl -dr -ll 1 -s 20
    atkdl -dr -ll 2 -s 20
    atkdl -dr -ll 3 -s 20
  ```
* download all episodes in one season (advanced):
  ```bash
    # Season 20
    atkdl -dr -ll 1 -s 20 >'episode_urls.txt'
    atkdl -dr -ll 2 -s 20 >'convert_mp4s.sh'

    atkdl -nm -mc 5 -i 'episode_urls.txt' >'log.txt' 2>&1

    ./convert_mp4s.sh
  ```

##### suggestions:

1. download with options: `--no-mp4 --log-level 3`
   * redirect stdout to a log file
   * when download completes, check the log file for any error messages
   * if any _.ts_ chunks encountered a download problem
     - identify the url of the _Americas Test Kitchen_ page that was being processed when this error occurred
     - redownload that page (using the same `--directory-prefix`)
       * all previously downloaded data __not__ be modified or deleted
       * only missing data will be retrieved
2. repeat the above process until the log file shows no download errors
3. finally, convert the HLS stream to _mp4_
   * the `ffmpeg` command to perform this conversion is included in the log file
   * when converting the episodes in a series, a list of all `ffmpeg` commands can be generated with the options: `--dry-run --log-level 2`

#### Requirements:

* Node version: v6.13.0 (and higher)
  * [ES6 support](http://node.green/)
    * v0.12.18+: Promise
    * v4.08.03+: Object shorthand methods
    * v5.12.00+: spread operator
    * v6.04.00+: Proxy constructor
    * v6.04.00+: Proxy 'apply' handler
    * v6.04.00+: Reflect.apply
  * [URL](https://nodejs.org/api/url.html)
    * v6.13.00+: [Browser-compatible URL class](https://nodejs.org/api/url.html#url_class_url)
  * tested in:
    * v7.9.0
* FFmpeg
  * not required in `PATH` when using the `--no-mp4` CLI option
  * successfully tested with version: _4.1.3_

#### Credits:

* [_youtube-dl_ 'Americas Test Kitchen' extractor](https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/americastestkitchen.py)
  * provides a methodology to obtain video stream URLs

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
