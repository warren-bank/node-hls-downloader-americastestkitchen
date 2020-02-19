const {requestHTTP, downloadHTTP, downloadHLS} = require('@warren-bank/node-hls-downloader')

const {download_file, download_json} = require('./http_download')

const mkdir     = require('./mkdir')
const path      = require('path')
const fs        = require('fs')
const promisify = require('util').promisify
const exec      = require('child_process').exec

const spawn     = promisify(exec)

// -----------------------------------------------------------------------------
// returns a Promise that resolves after all downloads are complete.

const process_cli = function(argv_vals){
  // ---------------------------------------------------------------------------

  const get_http_headers = (keys) => {
    const list = []

    if (keys && Array.isArray(keys) && keys.length) {
      for (const key of keys) {
        switch (key) {
          case 'ua':
            list.push({
              key: 'User-Agent',
              val: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36'
            })
            break
          case 'auth':
            if (argv_vals["--token"]) {
              list.push({
                key: 'Authorization',
                val: `Token ${argv_vals["--token"]}`
              })
            }
            break
        }
      }
    }

    const headers = (list.length)
      ? list.reduce((headers, header) => {headers[header.key] = header.val; return headers}, {})
      : null

    return headers
  }

  const pad_zeros = (num, len) => {
    let str = num.toString()
    let pad = len - str.length
    if (pad > 0)
      str = ('0').repeat(pad) + str
    return str
  }

  // ---------------------------------------------------------------------------
  // API

  const API = {
    // -------------------------------------------------------------------------

    episode_url_regex: (/^https?:\/\/(?:[^\.\/]+\.)*americastestkitchen\.com\/episode\/\d+.*$/i),

    is_episode_url: (episode_url) => API.episode_url_regex.test(episode_url),

    // -------------------------------------------------------------------------

    get_episodes_in_series: async () => {
      const POST_url  = 'https://y1fnzxui30-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%3B%20JS%20Helper%20(2.28.0)&x-algolia-application-id=Y1FNZXUI30&x-algolia-api-key=8d504d0099ed27c1b73708d22871d805'
      const POST_data = '{"requests":[{"indexName":"everest_search_atk_season_desc_production","params":"facetFilters=%5B%22search_site_list%3Aatk%22%2C%22search_document_klass%3Aepisode%22%5D&facets=%5B%5D&length=500&offset=0"}]}'
      const response  = await download_json(POST_url, null, POST_data)
      const episodes  = []

      if (response && (response instanceof Object) && response.results && Array.isArray(response.results) && response.results.length) {
        for (const result of response.results) {
          if (result && (result instanceof Object) && result.hits && Array.isArray(result.hits) && result.hits.length) {
            for (const hit of result.hits) {
              if (hit && (hit instanceof Object) && hit.search_atk_episode_url) {
                let season  = parseInt(hit.search_atk_episode_season, 10) || 0
                let episode = parseInt(hit.search_atk_episode_number, 10) || 0
                let url     = (hit.search_atk_episode_url[0] === '/') ? `https://www.americastestkitchen.com${hit.search_atk_episode_url}` : hit.search_atk_episode_url

                episodes.push({season, episode, url})
              }
            }
          }
        }
      }

      return episodes
    },

    filter_episodes_in_series: (episodes) => {
      if (argv_vals["--all"])
        return episodes

      if (argv_vals["--season"]) {
        if (argv_vals["--episode"])
          return episodes.filter(ep => ((ep.season === argv_vals["--season"]) && (ep.episode === argv_vals["--episode"])))
        else
          return episodes.filter(ep => (ep.season === argv_vals["--season"]))
      }
    },

    get_episode_urls_in_series: async () => {
      let episodes
      episodes = await API.get_episodes_in_series()
      episodes = API.filter_episodes_in_series(episodes)

      const episode_urls = episodes.map(ep => ep.url)
      return episode_urls
    },

    process_series: async () => {
      const episode_urls = await API.get_episode_urls_in_series()

      // assertion
      if (!episode_urls.length)
        throw new Error('Assertion Error: no episodes are available')

      return {episode_urls}
    },

    // -------------------------------------------------------------------------

    html_data_regex: (/^.*?window\.__INITIAL_STATE__\s*=\s*(\{.*?\});\s*<\/.*$/),

    extract_html_data: async (episode_url) => {
      try {
        let headers, html, json, data

        headers = get_http_headers(['ua', 'auth'])
        html    = await download_file(episode_url, headers)
        html    = html.replace(/[\r\n]+/g, ' ')

        if (!API.html_data_regex.test(html))
          throw new Error('html data not found')

        json = html.replace(API.html_data_regex, '$1')
        json = json.replace(/undefined/g, 'null')

        data = JSON.parse(json)
        return data
      }
      catch(error) {
        return null
      }
    },

    video_data_regex: (/^.*?var\s+videoSources\s*=\s*(\{.*?\});\s*var.*$/),

    extract_video_urls: async (zype_id) => {
      try {
        let url, headers, js_file, json, data
        let hls_url, vtt_urls

        url     = `https://player.zype.com/embed/${zype_id}.js?api_key=jZ9GUhRmxcPvX7M3SlfejB6Hle9jyHTdk2jVxG7wOHPLODgncEKVdPYBhuz9iWXQ`
        headers = get_http_headers(['ua'])
        js_file = await download_file(url, headers)
        js_file = js_file.replace(/[\r\n]+/g, ' ')

        if (!API.video_data_regex.test(js_file))
          throw new Error('video data not found')

        json = js_file.replace(API.video_data_regex, '$1')
        json = json.replace(/undefined/g, 'null')
        json = json.replace(/setupAds\([^\)]*\)/, 'null')
        json = json.replace(/UrlDimensionsParser\.parse\(.*?('[^']+')\)(,)/g, '$1$2')

      //===========================
      //easier to eval as javascript than to parse as JSON, since Object attribute labels and values would need to be wrapped in double-quotes
      //===========================
      //json = json.replace(/(\S+)\s*:\s+/g, '"$1": ')
      //data = JSON.parse(json)
      //===========================
        data = eval(`(${json})`)
      //===========================

        if (!data || !(data instanceof Object) || !data.sources || !Array.isArray(data.sources) || !data.sources.length)
          throw new Error('video data not found')

        hls_url = data.sources.filter(src => (src && (src instanceof Object) && (src.type === 'application/x-mpegURL') && src.src))

        if (!hls_url.length)
          throw new Error('video data not found')

        hls_url = hls_url[0].src

        vtt_urls = (data.textTracks && Array.isArray(data.textTracks) && data.textTracks.length)
          ? data.textTracks.filter(track => (track.src && track.label && (track.kind === 'captions'))).map(track => ({vtt_url: track.src, vtt_language: track.label.toLowerCase()}))
          : []

        return {hls_url, vtt_urls}
      }
      catch(error) {
        return null
      }
    },

    get_video_metadata: async (episode_url) => {
      // https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/americastestkitchen.py

      const metadata = []
      const htmldata = await API.extract_html_data(episode_url)

      if (htmldata && (htmldata instanceof Object) && htmldata.episodeDetail && htmldata.episodeDetail.content && htmldata.episodeDetail.content.data && htmldata.episodeDetail.content.data.video_segments && htmldata.episodeDetail.content.data.video_segments && Array.isArray(htmldata.episodeDetail.content.data.video_segments) && htmldata.episodeDetail.content.data.video_segments.length) {
        for (let video_index=0; video_index < htmldata.episodeDetail.content.data.video_segments.length; video_index++) {
          const video = htmldata.episodeDetail.content.data.video_segments[video_index]

          if (video.zype_id) {
            const urls = await API.extract_video_urls(video.zype_id)

            if (urls && (urls instanceof Object)) {
              const episode_title_parts = []

              if (video.season_number && video.episode_number)
                episode_title_parts.push(`S${pad_zeros(video.season_number, 2)}E${pad_zeros(video.episode_number, 2)}V${pad_zeros(video_index + 1, 2)}`)
              if (video.episode_title)
                episode_title_parts.push(video.episode_title)
              if (video.title && (video.title !== video.episode_title))
                episode_title_parts.push(video.title)

              if (episode_title_parts.length) {
                const series_title  = "America's Test Kitchen"
                const episode_title = episode_title_parts.join(' - ')

                metadata.push({...urls, series_title, episode_title})
              }
            }
          }
        }
      }

      return metadata
    },

    process_episode_url: async (episode_url) => {
      if (!API.is_episode_url(episode_url))
        throw new Error(`Error: unrecognized episode URL format: '${episode_url}'`)

      // [{series_title, episode_title, hls_url, vtt_urls: [{vtt_url, vtt_language}]}]
      const metadata = await API.get_video_metadata(episode_url)

      // assertion
      if (!metadata || !Array.isArray(metadata) || !metadata.length)
        throw new Error(`Assertion Error: no video metadata is available for episode at URL: '${episode_url}'`)

      return metadata
    },

    // -------------------------------------------------------------------------
  }

  // ---------------------------------------------------------------------------
  // returns a Promise that resolves after all downloads complete (HLS video, HLS audio, VTT subtitles) for a single TV episode

  const process_episode_url = async function(url){
    // short-circuit optimization
    if (argv_vals["--dry-run"] && (argv_vals["--log-level"] === 1)) {
      console.log(url)
      return
    }

    const videos = await API.process_episode_url(url)

    for (const video_metadata of videos) {
      await process_video_metadata(url, video_metadata)
    }
  }

  const process_video_metadata = async function(url, {series_title, episode_title, hls_url, vtt_urls}){
    const outputdir = (series_title)
      ? path.join(argv_vals["--directory-prefix"], sanitize_title(series_title), sanitize_title(episode_title))
      : path.join(argv_vals["--directory-prefix"], sanitize_title(episode_title))

    const configHLS = {
      "--no-clobber":        false,
      "--continue":          true,

      "--url":               hls_url,
      "--max-concurrency":   argv_vals["--max-concurrency"],

      "--directory-prefix":  path.join(outputdir, 'hls'),
      "--mp4":               ((!argv_vals["--no-mp4"]) ? path.join(outputdir, 'mp4') : null),

      "--skip-video":        false,
      "--skip-audio":        false,
      "--skip-subtitles":    true,   // most videos do not include a subtitles stream; many do include a single aggregate .vtt with captions for the entire video. skip stream and only download aggregate; then convert aggregate to .srt format.

      "--min-bandwidth":     null,
      "--max-bandwidth":     null,
      "--highest-quality":   true,
      "--lowest-quality":    false,
    
      "--all-audio":         true,
      "--all-subtitles":     true,
      "--filter-audio":      null,
      "--filter-subtitles":  null
    }

    const configHTTP = {
      "--input-file":        null,
      "--directory-prefix":  path.join(outputdir, 'mp4'),
      "--no-clobber":        true,
      "--max-concurrency":   argv_vals["--max-concurrency"]
    }

    if (!argv_vals["--quiet"]) {
      let ffmpegcmd, vtt2srt
      {
        const mkdir = (vtt_urls.length)  ? '' : `mkdir "${path.join('..', 'mp4')}" & `
        ffmpegcmd   = `cd "${configHLS["--directory-prefix"]}" && ${mkdir}ffmpeg -allowed_extensions ALL -i "master.m3u8" -c copy -movflags +faststart "${path.join('..', 'mp4', 'video.mp4')}"`
        vtt2srt     = (!vtt_urls.length) ? [] : vtt_urls.map(({vtt_url, vtt_language}) => `cd "${configHTTP["--directory-prefix"]}" && ffmpeg -i "video.${vtt_language}.vtt" "video.${vtt_language}.srt"`)
      }

      switch(argv_vals["--log-level"]) {
        case 1:
          console.log(url)
          break
        case 2:
          if (vtt2srt.length) console.log(vtt2srt.join("\n"))
          console.log(ffmpegcmd)
          break
        case 3:
          console.log(`processing page:\n  ${url}\ntype:\n  episode\nHLS manifest:\n  ${hls_url}${vtt_urls.length ? (vtt_urls.map(({vtt_url, vtt_language}) => `\nVTT subtitles (${vtt_language}):\n  ${vtt_url}`)) : ''}\noutput directory:\n  ${outputdir}\nmp4 conversion${argv_vals["--no-mp4"] ? ' (skipped)' : ''}:\n  ${ffmpegcmd}${vtt2srt.length ? `\nsrt conversion${argv_vals["--no-mp4"] ? ' (skipped)' : ''}:\n  ${vtt2srt.join("\n  ")}` : ''}`)
          break
        case 0:
        default:
          // noop
          break
      }
    }

    if (!argv_vals["--dry-run"]) {
      const promises = []
      let promise

      promise = start_downloadHLS(configHLS)
      promises.push(promise)

      if (vtt_urls.length) {
        configHTTP["--input-file"] = vtt_urls.map(({vtt_url, vtt_language}) => `${vtt_url}\tvideo.${vtt_language}.vtt`)

        promise = start_downloadHTTP(configHTTP)

        if (!argv_vals["--no-mp4"]) {
          promise = promise.then(async () => {
            for (let i=0; i < vtt_urls.length; i++) {
              const {vtt_url, vtt_language} = vtt_urls[i]

              // convert .vtt to .srt
              const vtt_path = path.join(configHTTP["--directory-prefix"], `video.${vtt_language}.vtt`)
              const srt_path = path.join(configHTTP["--directory-prefix"], `video.${vtt_language}.srt`)

              const cmd = `ffmpeg -i "${vtt_path}" "${srt_path}"`
              const opt = {cwd: configHTTP["--directory-prefix"]}

              await spawn(cmd, opt)
            }
          })
        }

        promises.push(promise)
      }

      await Promise.all(promises)
    }
  }

  const sanitize_title = (title) => title.replace(/[\\\/\*\?:"<>|]+/g, '')

  const start_downloadHLS = (configHLS) => {
    if (configHLS["--directory-prefix"]) {
      mkdir(configHLS["--directory-prefix"])

      // files
      ;["master.m3u8","video.m3u8"].forEach(child => {
        let childpath = path.join(configHLS["--directory-prefix"], child)
        if (fs.existsSync(childpath))
          fs.unlinkSync(childpath)
      })
    }

    if (configHLS["--mp4"]) {
      mkdir(configHLS["--mp4"])

      configHLS["--mp4"] = path.join(configHLS["--mp4"], 'video.mp4')

      if (fs.existsSync(configHLS["--mp4"]))
        fs.unlinkSync(configHLS["--mp4"])
    }

    // Promise
    return downloadHLS(configHLS)
  }

  const start_downloadHTTP = (configHTTP) => {
    if (configHTTP["--directory-prefix"])
      mkdir(configHTTP["--directory-prefix"])

    // Promise
    return downloadHTTP(configHTTP)
  }

  // ---------------------------------------------------------------------------
  // returns a Promise that resolves after all downloads complete for all episodes in all seasons of a series

  const process_series = async function(){
    const {episode_urls} = await API.process_series()

    while(episode_urls.length) {
      let url = episode_urls.shift()
      await process_episode_url(url)
    }
  }

  // ---------------------------------------------------------------------------
  // returns a Promise that resolves after all URLs in command-line have been processed

  const process_argv = async function(){
    if (argv_vals["--input-file"] && argv_vals["--input-file"].length) {
      while(argv_vals["--input-file"].length) {
        let url = argv_vals["--input-file"].shift()
        await process_episode_url(url)
      }
    }
    else if (argv_vals["--url"]) {
      let url = argv_vals["--url"]
      await process_episode_url(url)
    }

    if (argv_vals["--all"] || argv_vals["--season"]) {
      await process_series()
    }
  }

  return process_argv()
}

// -----------------------------------------------------------------------------

module.exports = {requestHTTP, downloadHTTP, downloadHLS, downloadTV: process_cli}
