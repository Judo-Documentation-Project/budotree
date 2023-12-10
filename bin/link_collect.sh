#!/bin/bash


OUT=aux/Links.md

## This could be done in node as well, but at what cost? No kink
## shaming please.

echo '# Budō Lineage Tree: links used' > $OUT
echo "Updated: $(date)" >> $OUT
echo >> $OUT
find database -path database/templates -prune -o -name '*.yaml' -print | \
    xargs egrep  'uri: |photo_url: '| \
    awk -F' +' '{gsub("- uri:","uri:"); print "* [" $1  $2"](" $3 ")"}' >> $OUT
