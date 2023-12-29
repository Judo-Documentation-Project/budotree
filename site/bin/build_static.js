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

function listPersons() {
  const template = fs.readFileSync("./src/templates/persons.mustache").toString();
  const sorted = data.elements.nodes.sort((a, b) =>
    a.data.name.localeCompare(b.data.name),
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
          target.data().teachers[i].teacher_name = person.data.name;
          target.data().teachers[i].teacher_native = person.data.native_name;
          target.data().teachers[i].style = getStyleById(target.data().teachers[i].style_id).name
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
            target.data().rank[i].teacher_name = person.data.name;
            target.data().rank[i].teacher_native = person.data.native_name;
            target.data().rank[i].style = getStyleById(target.data().teachers[i].style_id).name
            console.log(target.data().rank[i]["teacher_name"]);
          }
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
