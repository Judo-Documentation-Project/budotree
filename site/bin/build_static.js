#!/usr/bin/env node


const fs = require('fs');
const path = require('path')
const Mustache = require("mustache");
const cytoscape = require("cytoscape");
const { DateTime } = require("luxon");


let data = JSON.parse(fs.readFileSync("./src/js/tree.json", 'utf8'));
let st = JSON.parse(fs.readFileSync("./src/js/styles.json", 'utf8'));
let dbversion = JSON.parse(fs.readFileSync("./src/js/dbversion.json", 'utf8'));
const Polyglot = require("node-polyglot");

const countries = require("i18n-iso-countries");
const gitRoot =
      "https://github.com/Judo-Documentation-Project/budotree/tree/main/";
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/pt.json"));
countries.registerLocale(require("i18n-iso-countries/langs/ja.json"));

// let polyglot
//const ptRes = require("./src/i18n/pt.json")

let ptRes = JSON.parse(fs.readFileSync("./src/i18n/pt.json", 'utf8'));
let jaRes = JSON.parse(fs.readFileSync("./src/i18n/ja.json", 'utf8'));
const langRes = {};
let lang = "en";


const head = fs.readFileSync("./src/templates/head.mustache").toString();
const tail = fs.readFileSync("./src/templates/tail.mustache").toString();
const head_top = fs.readFileSync("./src/templates/head_top.mustache").toString();
const tail_top = fs.readFileSync("./src/templates/tail_top.mustache").toString();

var cy = cytoscape({
    elements: data.elements,
})

function getStyleById(id) {
  const tree = st;
  if (id in tree) {
    return tree[id];
  } else {
    return false;
  }
}

// Simple function to resolve name from language map
function resolveName(nameMap) {
  if (typeof nameMap === 'string') return nameMap;
  if (!nameMap || typeof nameMap !== 'object') return '';
  
  // Try English first
  if (nameMap['en']) {
    const value = nameMap['en'];
    return Array.isArray(value) ? value[0] : value;
  }
  
  // Try any romanized variant (ending with -Latn)
  for (const key of Object.keys(nameMap)) {
    if (key.endsWith('-Latn')) {
      const value = nameMap[key];
      return Array.isArray(value) ? value[0] : value;
    }
  }
  
  // Fall back to first value
  const firstValue = Object.values(nameMap)[0];
  return Array.isArray(firstValue) ? firstValue[0] : firstValue || '';
}

function listPersons() {
  const template = fs.readFileSync("./src/templates/persons.mustache").toString();
  const sorted = data.elements.nodes.sort((a, b) =>
    resolveName(a.data.name).localeCompare(resolveName(b.data.name)),
  );
  const rendered = Mustache.render(template, { arr: sorted }, {
    head: head_top,
    tail: tail_top
  });
  console.log(rendered)
  fs.writeFileSync('./src/persons.html', rendered);
  for (const person of data.elements.nodes) {
    console.log("Processing ", person.data.id)
    createPerson(cy.getElementById(person.data.id))
  }
}


function createAbout() {
  const template = fs.readFileSync("./src/templates/about.mustache").toString();
  const rendered = Mustache.render(template, { cytoscape_version: cytoscape.version,
                                               db_version: dbversion.dbversion}, {
    head: head_top,
    tail: tail_top
                                               })
  fs.writeFileSync(path.join("./src/", 'about.html'), rendered);
}

function createPerson (target){
  const template = fs.readFileSync("./src/templates/person.mustache").toString();
  //const template = document.getElementById("template").innerHTML;
  // console.log("Updating info: ", event);

  if (target.isNode()) {
    for (let i = 0; i < target.data().teachers.length; i++) {
      // console.log(event.target.data().teachers[i]);
        for (const person of data.elements.nodes) {
          if (person.data.id == target.data().teachers[i].id) {
            // console.log(person.data.name);
            target.data().teachers[i].teacher_name = resolveName(person.data.name);
            // Try to get native name from language map (e.g., Japanese characters)
            const nativeLang = Object.keys(person.data.name).find(key => !key.endsWith('-Latn') && key !== 'en');
            target.data().teachers[i].teacher_native = nativeLang ? person.data.name[nativeLang] : null;
            const style = getStyleById(target.data().teachers[i].style_id);
            target.data().teachers[i].style = style ? resolveName(style.name) : null;
            target.data().teachers[i].student_id = target.data().id;
            target.data().teachers[i].student_name = resolveName(target.data().name);
            // console.log(target.data().teachers[i]["teacher_name"]);
          }
        }
    }

    if (target.isNode() && target.data().rank) {
      for (let i = 0; i < target.data().rank.length; i++) {
        // console.log(event.target.data().teachers[i]);
        for (const person of data.elements.nodes) {
          if (person.data.id == target.data().rank[i].teacher_id) {
            // console.log(person.data.name);
            target.data().rank[i].teacher_name = resolveName(person.data.name);
            // Try to get native name from language map (e.g., Japanese characters)
            const nativeLang = Object.keys(person.data.name).find(key => !key.endsWith('-Latn') && key !== 'en');
            target.data().rank[i].teacher_native = nativeLang ? person.data.name[nativeLang] : null;
            const style = getStyleById(target.data().rank[i].style_id);
            target.data().rank[i].style = style ? resolveName(style.name) : null;
            console.log(target.data().rank[i]["teacher_name"]);
          }
        }
      }
    }


    // console.log("Students? ", target.outgoers('node'))
    const students = [];
    target.outgoers("node").forEach((e) => {
      e.data().teacher_id = target.data().id
      e.data().teacher_name = resolveName(target.data().name)
      students.push(e.data());
    });

    target.data().students = students;

    target.data().birth.country_local = function () {
      return countries.getName(this.country_code, lang);
    };

    target.data().death.country_local = function () {
      return countries.getName(this.country_code, lang);
    };

    if (target.data().description) {
      target.data().description_lang = target.data().description[lang];
    }
    if (target.data().birth.date) {
      target.data().birth.date_local = DateTime.fromISO(
        target.data().birth.date,
      ).toFormat("yyyy");
    }
    if (target.data().death.date) {
      target.data().death.date_local = DateTime.fromISO(
        target.data().death.date,
      ).toFormat("yyyy");
    }

    // Prepare name for template
    const nameMap = target.data().name; // Save the language map
    target.data().name = resolveName(nameMap);
    // Try to get native name from language map (e.g., Japanese characters)
    if (nameMap && typeof nameMap === 'object') {
      const nativeLang = Object.keys(nameMap).find(key => !key.endsWith('-Latn') && key !== 'en');
      target.data().native_name = nativeLang ? { name: nameMap[nativeLang] } : null;
    } else {
      target.data().native_name = null;
    }

    if (target.data().links) {
      for (let i = 0; i < target.data().links.length; i++) {
        let link = target.data().links[i].uri
        if (link.match("wikidata.org")) {
          target.data().links[i].img = "wikidata.png"
        }
        if (link.match("/dbpedia.org")) {
          target.data().links[i].img = "dbpedia.png"
        }
      }
    }



    target.data().gitRoot = gitRoot;
    const rendered = Mustache.render(template, target.data(), {
      head: head_top,
      tail: tail_top
    });
    //document.getElementById("info").innerHTML = rendered;
    console.log(target.data())
    console.log("Saving to ", path.join("./src", target.data().id+'.html'))
    fs.writeFileSync(path.join("./src", target.data().id+'.html'), rendered);
  }
}

listPersons()
createAbout()
console.log("Buiding static site")
console.log("Cytoscape version: ", cytoscape.version)
