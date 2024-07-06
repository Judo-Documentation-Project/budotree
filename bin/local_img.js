#!/usr/bin/env node


const { pipeline } = require("stream/promises")
const path = require('path')
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const mimetics = require('mimetics')

const argv = yargs(hideBin(process.argv))
      .command('dir', 'target directory for image files.')
      .command('dirPrefix', 'path to be prefixed to the image files URL.')
      .command('sourceFile', 'path of the existing JSON file.')
      .command('targetFile', 'path of the target JSON file.')
      .help()
      .argv;

const fs = require('fs');
const http = require('http');
const https = require("https")
const md5 = require('md5');

var dir = argv.dir;
var dirPrefix = argv.dirPrefix;
var sourceFile = argv.sourceFile;
var targetFile = argv.targetFile;

console.log("JDP database parsing started - local image cache stage");
console.log(`Target image dir: ${dir}, URL prefix: ${dirPrefix}, source JSON file: ${sourceFile}, target JSON file: ${targetFile}`);
var db = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
//console.log(db)


function fixExtension(photo_local_path) {
    const buffer = fs.readFileSync(photo_local_path)
    const fileInfo = mimetics(buffer)
    let newPath = path.format({ ...path.parse(photo_local_path), base: '', ext: "."+fileInfo.ext })
    fs.rename(photo_local_path, newPath, function(err) {
        if ( err ) console.log('ERROR: ' + err);
    })
    //console.log("EXT ", photo_local_path, fileInfo)
    return "."+fileInfo.ext
}


function updateDB(nodeId, photo_local_path, photo_local_url) {
    let ext = path.extname(photo_local_path)
    if (ext === "") {
        newExt = fixExtension(photo_local_path)
        photo_local_url = path.format({ ...path.parse(photo_local_url), base: '', ext: newExt })
        photo_local_path = path.format({ ...path.parse(photo_local_path), base: '', ext: newExt })
    }

    console.log("*", db.elements.nodes[nodeId].data.photo_url, "->", photo_local_path)
    db.elements.nodes[nodeId].data.photo_url_local = photo_local_url
}

async function downloadAndSaveImage(url, dirPrefix, nodeId) {
    let photo_local_url = path.join(dirPrefix, md5(url)+path.extname(url).toLowerCase())
    let photo_local_path = path.join(dir, md5(url)+path.extname(url).toLowerCase())
    let options = {
        headers: { 'User-Agent': 'NodeJS'}
    }
    options.rejectUnauthorized = false;
    
    return new Promise(async (onSuccess) => {
        https.get(url, options, async (res) => {
            const fileWriteStream = fs.createWriteStream(photo_local_path, {
                autoClose: true,
                flags: "w",
            })
            await pipeline(res, fileWriteStream)
            onSuccess(
                updateDB(nodeId, photo_local_path, photo_local_url))
        })
    })
}

// Loop through nodes
let promises = [];
for (const nodeId in db.elements.nodes){
    let photo_url = db.elements.nodes[nodeId].data.photo_url
    if (photo_url) {
        //process.stdout.write(".")
        image = downloadAndSaveImage(photo_url, dirPrefix, nodeId)
        promises.push(image);
    }
}

function writeJSON (data, filePath) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`\n\nData saved to ${filePath}`);
    });
};


Promise.allSettled(promises).then((results) =>
    //console.log("Writing to ", targetFile)
    //console.log("DB: ", db);
    //fs.writeFileSync(targetFile, JSON.stringify(db,null,2))
    writeJSON(db,targetFile)

)
