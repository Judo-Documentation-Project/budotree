#!/usr/bin/env node
const pY = require("../lib/parseYaml.js");
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
      .command('dir', 'source directory with YAML files.')
      .command('file', 'path of the resulting JSON file.')
      .help()
      .argv;

var dir = argv.dir;
var targetFile = argv.file;
console.log("JDP database parsing started.");
console.log(`Database dir: ${dir}, target file: ${targetFile}`);

styles = pY.importStylesYAML("database/styles");
let database = pY.importYAML(dir);
pY.updateSources(database)
    .then(v => pY.writeJSON(pY.createCYJS(database, styles), targetFile))
