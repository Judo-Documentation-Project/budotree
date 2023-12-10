#!/bin/bash

IN=aux/Links.md
OUT=aux/broken_links.csv

echo "url,status,state,parent,failureDetails" > $OUT
npx linkinator  --markdown --timeout 5000 $IN  -f CSV | grep BROKEN >> $OUT

echo There are $(wc -l $OUT | cut -d' ' -f1) broken links.
