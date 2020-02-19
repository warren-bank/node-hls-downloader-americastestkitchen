#!/usr/bin/env bash

post_data='{"requests":[{"indexName":"everest_search_atk_season_desc_production","params":"facetFilters=%5B%22search_site_list%3Aatk%22%2C%22search_document_klass%3Aepisode%22%5D&facets=%5B%5D&length=500&offset=0"}]}'
post_url='https://y1fnzxui30-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%3B%20JS%20Helper%20(2.28.0)&x-algolia-application-id=Y1FNZXUI30&x-algolia-api-key=8d504d0099ed27c1b73708d22871d805'
curl -X POST --data-binary "$post_data" "$post_url" >"results.txt"
