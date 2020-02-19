#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
workspace="${DIR}/workspace"

[ -d "$workspace" ] && rm -rf "$workspace"
mkdir "$workspace"
cd "$workspace"

npm init -y
npm install --save "${DIR}/.."
clear

PATH="${workspace}/node_modules/.bin:${PATH}"

# ------------------------------------------------------------------------------

# =================================
# download an episode (by URL)
#
# Season 20, Ep 7 - The Very Best Paris-Brest
# =================================

atkdl -q -mc 5 -u 'https://www.americastestkitchen.com/episode/653-the-very-best-paris-brest'

# ------------------------------------------------------------------------------

# =================================
# download an episode (by CLI options)
#
# Season 20, Ep 7 - The Very Best Paris-Brest
# =================================

atkdl -q -mc 5 -s 20 -e 7

# ------------------------------------------------------------------------------

# =================================
# download all episodes in one season
#
# Season 20
# =================================

atkdl -q -mc 5 -s 20

# ------------------------------------------------------------------------------

# =================================
# download all episodes in all seasons
# =================================

atkdl -q -mc 5 -a

# ------------------------------------------------------------------------------

# =================================
# print a trace of the operations that would occur
# IF all episodes in one season were to be downloaded
#
# Season 20
# =================================

atkdl -dr -ll 1 -s 20
atkdl -dr -ll 2 -s 20
atkdl -dr -ll 3 -s 20

# ------------------------------------------------------------------------------

# =================================
# download all episodes in one season (advanced)
#
# Season 20
# =================================

atkdl -dr -ll 1 -s 20 >'episode_urls.txt'
atkdl -dr -ll 2 -s 20 >'convert_mp4s.sh'

atkdl -nm -mc 5 -i 'episode_urls.txt' >'log.txt' 2>&1

./convert_mp4s.sh

# ------------------------------------------------------------------------------
