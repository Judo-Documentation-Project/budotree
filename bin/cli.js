#!/usr/bin/env node
const pY = require("../lib/parseYaml.js");
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
      .command('dir', 'source directory with YAML files.')
      .command('target', 'path of the resulting JSON file.')
      .help()
      .argv;

var dir = argv.dir;
var targetFile = argv.file;
console.log("JDP database parsing started.");
console.log(`Database dir: ${dir}, target file: ${targetFile}`);
//var dir  = '/home/frmuno/src/lisp/judotree/database/persons/JPN';
pY.writeJSON(pY.createCYJS(pY.importYAML(dir)), targetFile);
