#!/usr/bin/env node
const pY = require("../lib/parseYaml.js");
const path = require('path')
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
      .command('dir', 'source directory with YAML files.')
      .command('file', 'path of the resulting JSON file.')
      .command('local', 'if present, avoids steps that make HTTP requests (useful for CI)')
      .boolean('local')
      .help()
      .argv;


let dir = argv.dir
let targetFile = argv.file
let localOnly = argv.local
let stylesFile = path.join(path.dirname(targetFile), "styles.json");

console.log("JDP database parsing started.");
console.log(`Database dir: ${dir}, target file: ${targetFile}, styles file: ${stylesFile}, local run: ${localOnly}`);

styles = pY.importStylesYAML("database/styles");
let database = pY.importYAML(dir);

if (localOnly) {
    console.log("Local run, avoinding external requests")
    pY.writeJSON(pY.createCYJS(database, styles), targetFile)
} else {
    console.log("Regular run, updating sources")
    pY.updateSources(database)
        .then(v => pY.writeJSON(pY.createCYJS(database, styles), targetFile))
}

pY.writeJSON(styles, stylesFile)
