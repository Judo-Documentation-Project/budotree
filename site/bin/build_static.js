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

function listPersons() {
  const template = fs.readFileSync("./src/templates/persons.mustache").toString();
  const sorted = data.elements.nodes.sort((a, b) =>
    a.data.name.localeCompare(b.data.name),
  );
  const rendered = Mustache.render(template, { arr: sorted }, {
    head: head,
    tail: tail
  });
  console.log(rendered)
  fs.writeFileSync('./src/persons/persons.html', rendered);
  for (const person of data.elements.nodes) {
    console.log("Processing ", person.data.id)
    createPerson(cy.getElementById(person.data.id))
  }
}


function createAbout() {
  const template = fs.readFileSync("./src/templates/about.mustache").toString();
  const rendered = Mustache.render(template, { cytoscape_version: cytoscape.version,
                                               db_version: dbversion.dbversion}, {
    head: head,
    tail: tail
                                               })
  fs.writeFileSync(path.join("./src/persons", 'about.html'), rendered);
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
          target.data().teachers[i].teacher_name = person.data.name;
          target.data().teachers[i].teacher_native = person.data.native_name;
          target.data().teachers[i].style = getStyleById(target.data().teachers[i].style_id).name
          // console.log(target.data().teachers[i]["teacher_name"]);
        }
      }
    }


    // console.log("Students? ", target.outgoers('node'))
    const students = [];
    target.outgoers("node").forEach((e) => {
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

    const rendered = Mustache.render(template, target.data(), {
      head: head,
      tail: tail
    });

    //document.getElementById("info").innerHTML = rendered;
    console.log("Saving to ", path.join("./src/persons", target.data().id+'.html'))
    fs.writeFileSync(path.join("./src/persons", target.data().id+'.html'), rendered);
  }
}

listPersons()
createAbout()
console.log("Buiding static site")
console.log("Cytoscape version: ", cytoscape.version)
