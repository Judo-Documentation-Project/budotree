import data from "./tree.json";
import dbversion from "./dbversion.json";
import ptRes from "../i18n/pt.json";
import jaRes from "../i18n/ja.json";

import cytoscape from "cytoscape";
import elk from "cytoscape-elk";
import cola from "cytoscape-cola";
import cise from "cytoscape-cise";
import fcose from "cytoscape-fcose";
import BubbleSets from "cytoscape-bubblesets";
import $ from "jquery";
import Polyglot from "node-polyglot";
import interact from "interactjs";
import { Timeline } from "@knight-lab/timelinejs";

import bulmaSlider from "bulma-slider";

console.log("Cytoscape version: ", cytoscape.version)



//"Toolbox" activation

document.addEventListener('DOMContentLoaded', function() {
    let toolboxToggle = document.getElementById('toolbox-icon');
    let toolboxContent = document.getElementById('toolbox-content');
    toolboxContent.classList.toggle('is-hidden')
    toolboxToggle.addEventListener('click', e => {
        //console.log("Hide: ", e.currentTarget.parentElement.parentElement.childNodes)
        //e.currentTarget.parentElement.parentElement.childNodes[3].classList.toggle('is-hidden');
        toolboxContent.classList.toggle('is-hidden')
        //e.currentTarget.parentElement.childNodes[3].classList.toggle('is-hidden');
        });
});

// TImeline
// import tl from './tl.json';
import st from "./styles.json";

// URL parameters
// const url = require('url')
// import url from 'url'

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
console.log("URL: ", urlParams.get("id"));

const { DateTime } = require("luxon");
const Mustache = require("mustache");
const countries = require("i18n-iso-countries");

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/pt.json"));
countries.registerLocale(require("i18n-iso-countries/langs/ja.json"));

cytoscape.use(elk);
cytoscape.use(cola);
cytoscape.use(cise);
cytoscape.use(fcose);
cytoscape.use(BubbleSets);

console.log(data);

// let polyglot

const langRes = {};
langRes.pt = ptRes;
langRes.ja = jaRes;

let lang = "en";
console.log("i18n: setting lang to ", lang);
let polyglot = new Polyglot({ allowMissing: true });
polyglot.extend(langRes[lang]);
const updateLanguage = document.getElementById("language");
updateLanguage.onchange = changeLanguage;

function changeLanguage() {
  const value = updateLanguage.value;
  const text = updateLanguage.options[updateLanguage.selectedIndex].text;
  lang = updateLanguage.value;
  console.log("changeLanguage: ", value, text, langRes[lang]);
  polyglot = new Polyglot({ allowMissing: true });
  polyglot.extend(langRes[lang]);
  updateContent();
}

function updateContent() {
  document.getElementById("nav-budo").innerHTML =
    polyglot.t("Budō Lineage Tree");
  updateInfo(cy.elements(":selected"));
  document.getElementById("tab:cy").innerHTML = polyglot.t("Tree");
  document.getElementById("tab:Persons").innerHTML = polyglot.t("Persons");
  document.getElementById("tab:Styles").innerHTML = polyglot.t("Styles");
  document.getElementById("tab:Timeline").innerHTML = polyglot.t("Timeline");
  updateStyleFilter();
  updateTimeline();
  cy.style().update();
}

let edgesShowStyle = true;
let edgesShowPeriod = false;

const style = [
  // the stylesheet for the graph
  {
    selector: "node",
    style: {
      label: (ele) => {
        if (ele.data().native_name && ele.data().native_name.lang == lang) {
          return ele.data().native_name.name;
        } else {
          return ele.data().name;
        }
      },
      "background-image": (ele) => {
        if (ele.data().photo_url_local) {
          return ele.data().photo_url_local;
        } else if (ele.data().photo) {
          return ele.data().photo.url;
        } else if (ele.data().photo_url) {
          return ele.data().photo_url;
        } else {
          return false;
        }
      },
      "background-fit": "cover cover",
      "background-image-opacity": 0.4,
      "background-position-y": "10%",
      // 'label': 'data(name)',
      "font-size": "0.5em",
      "font-family": "Noto Serif JP, serif",
      color: "white", // '#BC002D',
      "text-valign": "center",
      "text-halign": "center",
      shape: "ellipse",
      "text-wrap": "wrap",
      "text-overflow-wrap": (ele) => {
        if (ele.data().native_name && ele.data().native_name.lang == lang) {
          return "anywhere";
        } else {
          return "whitespace";
        }
      },
      "word-break": "break-all",
      "text-max-width": 40,
      width: 55,
      height: 55,
      "background-color": "black",
      "border-width": "1",
      // 'border-color':'white'
    },
  },
  {
    selector: "edge",
    style: {
      width: 1,
      "line-style": "solid",
      "curve-style": "bezier",
      "control-point-step-size": "40",
      "taxi-direction": "auto",
      "line-color": "#888",
      label: (ele) => {
        let edgeLabel = "";
        if (edgesShowStyle) {
          if (
            ele.data().interaction_native &&
            ele.data().interaction_native.lang == lang
          ) {
            edgeLabel = ele.data().interaction_native.name;
          } else {
            edgeLabel = ele.data().interaction;
          }
        } else {
          edgeLabel = "";
        }
        if (edgesShowPeriod) {
          if (
            ele.data().period &&
            (ele.data().period.start || ele.data().period.end)
          ) {
            edgeLabel += "\n";
            if (ele.data().period.start) {
              edgeLabel += ele.data().period.start;
            }
            edgeLabel += " - ";
            if (ele.data().period.end) {
              edgeLabel += ele.data().period.end;
            }
          }
        }
        return edgeLabel;
      },
      // 'label': 'data(interaction)',
      "font-size": "0.4em",
      "font-family": "Noto Serif JP, serif",
      "font-weight": "700",
      "text-wrap": "wrap",
      "text-max-width": 35,
      color: "#444",
      "target-arrow-shape": "triangle",
      "arrow-scale": "0.8",
      "target-arrow-color": "#666",
    },
  },
  {
    selector: "node:selected",
    css: {
      "background-color": "#cb4042", // '#BC002D',
      color: "white",
    },
  },
  {
    selector: "edge:selected",
    css: {
      color: "#cb4042",
      "line-color": "#f9bf45",
      "target-arrow-color": "#f9bf45",
    },
  },
  {
    selector: ".hidden",
    css: {
      display: "none", // '#BC002D',
    },
  },
  {
    selector: ".focused",
    css: {
      "background-color": "#096148",
    },
  },
  {
    selector: ".ancestors",
    css: {
      color: "#f596aa",
    },
  },
  {
    selector: ".descendants",
    css: {
      color: "#f9bf45",
    },
  },
  {
    selector: ".parents",
    css: {
      "background-color": "#446",
      color: "white",
    },
  },
  {
    selector: ".children",
    css: {
      "background-color": "#464",
      color: "white",
    },
  },
  {
      selector: ".stylefocus",
      css: {
          "background-color": "yellow",
          color: "white",
      },
  },
    {
        selector: ":parent",
        css: {
            label: (ele) => {
                console.log("parent title")
                console.log(ele)
                return countries.getName(ele.data().name, lang);
            },
            color: "black",
            shape: "round-rectangle",
            //shape: 'cutrectangle',
            //"shape": 'triangle',
            "background-color": "blue",
            "background-opacity": 0.1,
            "text-valign": "top",
            "text-halign": "left"
        }
    },
    {
        selector: ".matched",
        css: {
            
            "background-color": "gold",
            "color": "#446",
        },
    },
    {
        selector: ".path",
        css: {
            
            "background-color": "#FBE251",
            "color": "#446",
        },
    },
    {
        selector: ".start-path",
        css: {
            
            "background-color": "#FBE251",
            "color": "#446"
        },
    },
    {
        selector: ".end-path",
        css: {
            
            "background-color": "#FB251",
            "color": "#446",
        },
    }        
    
];

const layoutOptions = {
  name: "fcose",
  spacingFactor: 1,
  nodeDimensionsIncludeLabels: true,
  animate: "end",
  refresh: 100,
  animationDuration: 250,
  elk: {
    algorithm: "mrtree",
  },
};

var cy = cytoscape({
    container: $("#cy"), // container to render in
    elements: data.elements,
    style: style,
    userPanningEnabled: true,
    //boxSelectionEnabled: true,
    selectionType: "addictive",
    wheelSensitivity: 0.1,
});

let layout = cy.layout(layoutOptions);
const bb = cy.bubbleSets({
  interactive: false,
});

const layoutButton = document.querySelectorAll("[id=ddlViewBy]");
const availableLayouts = [...layoutButton[0].options].map((o) => o.value);

const langButton = document.querySelectorAll("[id=language]");
const availableLanguages = [...langButton[0].options].map((o) => o.value);

console.log(availableLayouts);

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM content loaded, running layout");

  openTab(true, "tab:cy");
  //    layoutOptions["name"]="elk";
  //    layoutOptions["elk"]["algorithm"] = "stress";

  if (urlParams.get("id") && cy.getElementById(urlParams.get("id")).isNode()) {
    cy.getElementById(urlParams.get("id")).select();
  } else {
    cy.getElementById("JDP-1").select();
  }

  if (
    urlParams.get("layout") &&
    availableLayouts.includes(urlParams.get("layout"))
  ) {
    console.log("Setting layout from URL: ", urlParams.get("layout"));
    // layoutOptions["name"]=urlParams.get('layout');
    updateLayout.value = urlParams.get("layout");
    changeLayout();
  }

  if (urlParams.get("infobox")) {
    setInfoboxVisibility(urlParams.get("infobox"));
  }

  if (urlParams.get("focus")) {
    const isTrueSet = urlParams.get("focus") === "true";
    focusOnIndividual(isTrueSet);
  }

  if (
    urlParams.get("lang") &&
    availableLanguages.includes(urlParams.get("lang"))
  ) {
    console.log(" Setting lang from URL", urlParams.get("lang"));
    updateLanguage.value = urlParams.get("lang");
    changeLanguage();
  }

  // Update content is needed to refresh the infobox, but must be
  // before the style filter since it would otherwise reset the option
  updateContent();

  const styleList = [];
  for (const edge of data.elements.edges) {
    styleList[edge.data.interaction_id] = "";
  }

  updateStyleFilter();
  if (urlParams.get("style") && urlParams.get("style") in styleList) {
    styleFilter.value = urlParams.get("style");
    pickStyle();
  }

  const layout = cy.layout(layoutOptions);
  layout.run();
  console.log(layout);
  nodesByCountry();
  listPersons();

  listStyles();
  listVersions();
  // updateStyleFilter();
  //
  //    updateTimeline();
  // edgesByStyle();
});

function goHome() {
  // console.log("Going home...");
  const homeNode = cy.nodes('[id = "JDP-1"]');
  cy.nodes().unselect();
  cy.nodes(homeNode).select();
  cy.center();
  updateInfo(cy.nodes(homeNode));
  layout.run();
}

function wordToInteger(word) {
  // Simple hash function to convert string to integer
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (hash << 5) - hash + word.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function clusterInfo(node){
    let clusterId;
    if (node.data().nationality) {
        clusterId = node.data().nationality[0]
    } else {
        clusterId = null
    }
    //console.log("Clusterid"+ clusterId)
    return wordToInteger(clusterId)

}


function setCluster(criteria) {
    if (criteria == "nationality")
    {
        cy.nodes().forEach(function (ele) {
            if (ele.data()[criteria]) {
                for (const criteriaEle of ele.data()[criteria]) {
                    if (cy.getElementById(criteriaEle).length == 0 ) {
                        cy.add(
                            {
                                group: 'nodes',
                                data: { id: criteriaEle, name: criteriaEle, type: "grouping"}
                            }
                        )
                    };
                    ele.move({
                        parent: criteriaEle
                    });
                }
            }
        });
    }
}

function changeLayout() {
  // var value = updateLayout.value;
  // var text = updateLayout.options[updateLayout.selectedIndex].text;
  // console.log(value, text);
  switch (updateLayout.value) {
    case "mrtree":
      layoutOptions.name = "elk";
      layoutOptions.elk.algorithm = "mrtree";
      break;
    case "layered":
      layoutOptions.name = "elk";
      layoutOptions.elk.algorithm = "layered";
      break;
    case "breadthfirst":
      layoutOptions.name = "breadthfirst";
      break;
    case "stress":
      layoutOptions.name = "elk";
      layoutOptions.elk.algorithm = "stress";
      break;
    case "cise":
      layoutOptions.name = "cise";
      layoutOptions.allowNodesInsideCircle = false;
      break;
    case "cola":
      layoutOptions.name = "cola";
      break;
    case "fcose":
      layoutOptions.name = "fcose";
      break;
    case "concentric":
      layoutOptions.name = "concentric";
      layoutOptions.concentric = nodeLevel;
      layoutOptions.levelWidth = function () {
        return cy.nodes(":visible").maxDegree() / 6;
      };
      break;
  }

  layout = cy.layout(layoutOptions);
  cy.layout(layoutOptions);
  console.log(layoutOptions.name);
  layout.run();
}

function nodeLevel(node) {
  // console.log("Nodelevel ", node.data().id);
  if (node.selected()) {
    // console.log ("NodeLevel", node.data())
    return cy.nodes(":visible").maxDegree();
  } else {
    // console.log(node.data().name, cy.elements().aStar({ root: cy.$(':selected'), goal: node }).distance);
    return (
      -1 * cy.elements().aStar({ root: cy.$(":selected"), goal: node }).distance
    );
  }
}

var updateLayout = document.getElementById("ddlViewBy");
updateLayout.onchange = changeLayout;

const homeBtn = document.getElementById("home");
homeBtn.addEventListener("click", goHome);

const distance = document.getElementById("distance");

function setDistance(distance) {
  layoutOptions.spacingFactor = distance;
  layout = cy.layout(layoutOptions);
  cy.layout(layoutOptions);
  console.log(layoutOptions.name);
  cy.center();
  layout.run();
}

distance.addEventListener("change", function () {
  // var distanceDisplay = document.getElementById("distanceDisplay");
  // console.log(document.getElementById("distance").textContent = distance.value);
  setDistance(distance.value);
  // distanceDisplay.innerHTML = distance.value;
});
bulmaSlider.attach();

// FIXME: find ou and comment why we need this, or remove it
cy.elements().unbind("mouseover");

const searchNode = document.getElementById("searchNode");
const searchReset = document.getElementById("reset-search");

searchReset.addEventListener("click", function (e) {
    searchNode.value="";
    cy.nodes().removeClass("matched");
    
});
searchNode.addEventListener("input", updateValue);

function updateValue(e) {
    search(e.target.value)
}

function search(pattern) {
    console.log(pattern)
    cy.nodes().removeClass("matched");
    let matchingNodes = cy.elements('node[ name *= "' + pattern + '"]')
    console.log(matchingNodes)
    if (cy.nodes().size() != matchingNodes.size()) {
        matchingNodes.addClass("matched");
    }
}


// Path

const showPath = document.getElementById("show-path");
showPath.addEventListener("click", function (e) {
    if (e.target.checked) {
        getPath(true)
    } else {
        getPath(false)
    }
});

const isolatePath = document.getElementById("isolate-path");
isolatePath.addEventListener("click", function (e) {
    if (e.target.checked) {
        focusPath(true);
    } else {
        focusPath(false);
    }
    
});


const pathOrigin = document.getElementById("pathOrigin");
pathOrigin.onclick = setPathOrigin

const pathEnd = document.getElementById("pathEnd");
pathEnd.onclick = setPathEnd

function setPathOrigin() {
    const originNode = pathOrigin.value;
    cy.nodes().removeClass("start-path");
    cy.nodes('[id = "' + originNode + '"]').addClass("start-path");
}

function setPathEnd() {
    const originNode = pathEnd.value;
    cy.nodes().removeClass("end-path");
    cy.nodes('[id = "' + originNode + '"]').addClass("end-path");
}

function getPath (state) {
    cy.nodes().removeClass("path");
    const root = cy.nodes('[id = "' + pathOrigin.value + '"]')
    const goal = cy.nodes('[id = "' + pathEnd.value + '"]')
    let aStar = cy.elements().aStar( {root: root, goal: goal} );
    if (state) {
        aStar.path.addClass("path");
    } else {

        aStar.path.removeClass("path");
    }
    //console.log("A*");
    // console.log(aStar);
    //aStar.path.select();
    
}
function focusPath (state) {
    const root = cy.nodes('[id = "' + pathOrigin.value + '"]')
    const goal = cy.nodes('[id = "' + pathEnd.value + '"]')    
    let aStar = cy.elements().aStar( {root: root, goal: goal} );
    if (state) {
        aStar.path.addClass("path");
        cy.nodes().difference(aStar.path).addClass("hidden");
    } else {
        cy.nodes().removeClass(["path", "hidden"]);
    }
    layout.run();
}

updateNodeName()

function updateNodeName() {
    pathOrigin.innerHTML = "";
    pathEnd.innerHTML = "";
    const nameList = {};
    for (const node of data.elements.nodes) {
        if (!nameList[node.data.id]) {
            nameList[node.data.id] = {
                name: node.data.name,
                //native_name: node.data.native_name.name,
                //lang: node.data.native_name.lang
            };
        }
    }
   
    const allEl = document.createElement("option");
    //allEl.textContent = polyglot.t("All Styles");
    //allEl.value = "all";
    //styleFilter.appendChild(allEl);
    
    const sorted = [];
    
    for (const [key] of Object.entries(nameList)) {
        sorted.push(key);
    }
    
    sorted.sort((a, b) => nameList[a].name.localeCompare(nameList[b].name));
    
    console.log(sorted)
    // for (const [key, value] of Object.entries(styleList)) {
    for (const key of sorted) {
        const value = nameList[key];
        const el = document.createElement("option");
        if (value.native_name && value.native_name.lang == lang) {
            el.textContent = value.native_name.name;
        } else {
            el.textContent = value.name;
        }
        
        el.value = key;
        pathOrigin.appendChild(el);

        
    }

    for (const key of sorted) {
        const value = nameList[key];
        const el = document.createElement("option");
        if (value.native_name && value.native_name.lang == lang) {
            el.textContent = value.native_name.name;
        } else {
            el.textContent = value.name;
        }
        
        el.value = key;
        
        pathEnd.appendChild(el);
        
    }    
}


const gitRoot =
  "https://github.com/Judo-Documentation-Project/budotree/tree/main/";
// var info = document.getElementById("info");
const cardTitle = document.getElementById("card-title");
const cardFooter = document.getElementById("card-footer");
const cardFooterShare = document.getElementById("card-footer-share");
const cardFooterLink = document.getElementById("card-footer-link");
// var focusedPeople =[]
// var ancestorsOfPeople = []
// var descendantsOfPeople = []
// let styleNodes;
let personNodes;

const pred = document.getElementById("predecessors");
const focus = document.getElementById("focus");

function focusOnIndividual(state) {
  let person;
  if (state) {
    // console.log(cy.elements(":selected"),cy.elements(":selected").isEdge())
    if (cy.elements(":selected").isEdge()) {
      person = cy.elements(":selected").target();
    } else {
      person = cy.elements("node:selected");
    }
    // focusedPeople = person
    personNodes = cy.nodes(":visible");
    const ancestors = person.predecessors("node").filter(":visible");
    const successors = person.successors("node").filter(":visible");
    // ancestorsOfPeople = ancestors
    // descendantsOfPeople = successors
    const family = ancestors.union(successors).union(person);

    cy.nodes().difference(family).addClass("hidden");
    person.addClass("focused");
    ancestors.addClass("ancestors");
    successors.addClass("descendants");
    focus.classList.toggle("focus-on");
  } else {
    personNodes.removeClass(["hidden", "ancestors", "descendants", "focused"]);
    focus.classList.toggle("focus-on");
    // document.getElementById('pickStyle').value="all";
    // pickStyle();
  }
  layout.run();
}

document.addEventListener("DOMContentLoaded", function () {
  pred.addEventListener("click", (e) => {
    // console.log("Predecessors" + ele.data().name);
    if (e.target.checked) {
      focusOnIndividual(true);
    } else {
      focusOnIndividual(false);
    }
  });
});

let pathOriginNode = cy.getElementById("JDP-1").select();
let pathEndNode = cy.getElementById("JDP-1").select();

function updatePath(target) {
    pathOriginNode = pathEndNode
    pathEndNode = target
    
    pathOrigin.value = pathOriginNode.data().id;
    pathEnd.value = pathEndNode.data().id;
}

function updateInfo(target) {
  const template = document.getElementById("template").innerHTML;
    target.select();
    updatePath(target);
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

    if (target.data().rank) {
      for (let i = 0; i < target.data().rank.length; i++) {
        // console.log(event.target.data().teachers[i]);
        for (const person of data.elements.nodes) {
          if (person.data.id == target.data().rank[i].teacher_id) {
            // console.log(person.data.name);
            target.data().rank[i].teacher_name = person.data.name;
            target.data().rank[i].teacher_native = person.data.native_name;
            // console.log(event.target.data().teachers[i]);
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

    if (target.data().native_name && target.data().native_name.lang == lang) {
      cardTitle.innerHTML = target.data().native_name.name;
    } else {
      cardTitle.innerHTML = target.data().name;
    }

    const rendered = Mustache.render(template, target.data());

    document.getElementById("info").innerHTML = rendered;

    // i18n
    document.getElementById("i18n:teachers").innerHTML = polyglot.t("Teachers");
    document.getElementById("i18n:students").innerHTML = polyglot.t("Students");
    document.getElementById("i18n:rank").innerHTML = polyglot.t("Rank");
    document.getElementById("i18n:sources").innerHTML = polyglot.t("Sources");

    document.getElementById("footerId").innerHTML = target.data().id + ": ";
    cardFooterShare.setAttribute(
      "href",
      "https://" + window.location.host + "/tree.html?id=" + target.data().id,
    );
    cardFooterShare.innerHTML =
      '<i class="fas fa-eye mr-3 "></i> ' //+ target.data().id;

    cardFooterLink.setAttribute(
      "href",
      "https://" + window.location.host + "/" + target.data().id + ".html",
    );
    cardFooterLink.innerHTML =
      '<i class="fas fa-share-nodes mr-3 "></i> ' //+ target.data().id;

    cardFooter.setAttribute("href", gitRoot + target.data().source_yaml);
    cardFooter.innerHTML =
      '<i class="fas fa-file-code mr-3"></i> ' //+ target.data().id;

    // Teacher link navigation
    const teachers = document.getElementById("teachers");
    teachers.addEventListener("click", (e) => {
      // console.log("Teacher ID: " + e.target.id);
      target.unselect();
      updateInfo(cy.nodes("#" + e.target.id));
    });

    // Student link navigation
    if (students.length > 0) {
      const studentsInfo = document.getElementById("students");
      studentsInfo.addEventListener("click", (e) => {
        target.unselect();
        updateInfo(cy.nodes("#" + e.target.id));
      });
    }
    cy.nodes().removeClass(["parents"]);
    cy.nodes().removeClass(["children"]);
    target.outgoers("node").addClass("children");
    target.incomers("node").addClass("parents");
  } else {
    // is edge
    // console.log("Tapped on edge: ", target.data());

    for (const person of data.elements.nodes) {
      if (person.data.id == target.data().source) {
        // console.log(person.data.name);
        target.data().teacher_name = person.data.name;
        target.data().teacher_native = person.data.native_name;
        if (person.data.photo_local_url) {
          target.data().teacher_photo_url = person.data.photo_local_url;
        } else {
          target.data().teacher_photo_url = person.data.photo_url;
        }
        // console.log(event.target.data().teachers[i]);
      }
    }
    for (const person of data.elements.nodes) {
      if (person.data.id == target.data().target) {
        // console.log(person.data.name);
        target.data().student_name = person.data.name;
        target.data().student_native = person.data.native_name;
        if (person.data.photo_local_url) {
          target.data().student_photo_url = person.data.photo_local_url;
        } else {
          target.data().student_photo_url = person.data.photo_url;
        }
        // console.log(event.target.data().teachers[i]);
      }
    }

    if (
      target.data().interaction_native &&
      target.data().interaction_native.lang == lang
    ) {
      cardTitle.innerHTML = target.data().interaction_native.name;
    } else {
      cardTitle.innerHTML = target.data().interaction;
    }

    const rendered = Mustache.render(template, target.data());
    document.getElementById("info").innerHTML = rendered;
    // i18n
    document.getElementById("i18n:sources_int").innerHTML =
      polyglot.t("Sources");
  }
}

cy.nodes().bind("tap", (event) => updateInfo(event.target));
cy.edges().bind("tap", (event) => updateInfo(event.target));


cy.nodes().bind("dbltap", (event) => {
  // cy.reset();
  console.log("Centering on ", event.target.data().name);
  cy.center(event.target);
  layout.run();
});

cy.nodes().bind("dbltap", (event) => {
  console.log("Centering on ", event.target.data().name);
  cy.center(event.target);
  // layout.run();
});

const cardToggles = document.getElementsByClassName("card-toggle");

function setInfoboxVisibility(state) {
  switch (state) {
    case "toggle":
      cardToggles[0].parentElement.parentElement.childNodes[3].classList.toggle(
        "is-hidden",
      );
      break;
    case "visible":
      cardToggles[0].parentElement.parentElement.childNodes[3].classList.remove(
        "is-hidden",
      );
      break;
    case "hidden":
      cardToggles[0].parentElement.parentElement.childNodes[3].classList.add(
        "is-hidden",
      );
      break;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  for (let i = 0; i < cardToggles.length; i++) {
    cardToggles[i].addEventListener("click", () => {
      setInfoboxVisibility("toggle");
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const lineType = document.getElementById("lineType");
  lineType.addEventListener("click", (e) => {
    // console.log(style[1]["style"]["curve-style"]);
    if (e.target.checked) {
      cy.style()
        .selector("edge")
        .style({
          "curve-style": "bezier",
        })
        .update();
    } else {
      cy.style()
        .selector("edge")
        .style({
          "curve-style": "taxi",
        })
        .update();
    }
  });
});

const countryNodes = {};
let styleEdges = {};
// var nativeNames = false;

const stringToColour = function (str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour + "33";
};

const stringToColourSimple = function (str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour;
};

function edgesByQuality() {
  // console.log("Setting edges by quality")
  cy.edges().forEach(function (ele) {
    // console.log(ele.data().quality);
    switch (ele.data().quality) {
      case 3:
        ele.style({
          "line-style": "solid",
          width: 3,
        });
        break;
      case 2:
        ele.style({
          "line-style": "solid",
          width: 2,
        });
        break;
      case 1:
        ele.style({
          "line-style": "dashed",
          width: 2,
        });
        break;
      case 0:
        ele.style({
          "line-style": "dashed",
          width: 1,
        });
        break;
      default:
        ele.style({
          "line-style": "dotted",
          width: 1,
        });
    }
  });
}

function edgesByStyle() {
  // console.log ("Setting edges by style");
  cy.edges().forEach(function (ele) {
    ele.style({
      "line-color": stringToColourSimple(ele.data().interaction),
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const styleColor = document.getElementById("styleColor");
  styleColor.addEventListener("click", (e) => {
    if (e.target.checked) {
      edgesByStyle();
    } else {
      cy.style()
        .selector("edge")
        .style({
          "line-color": "#888",
        })
        .update();
      cy.edges().forEach(function (ele) {
        ele.style({
          "line-color": "#888",
        });
      });
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const quality = document.getElementById("quality");
  quality.addEventListener("click", (e) => {
    // console.log(style[1]["style"]["line-type"]);
    if (e.target.checked) {
      edgesByQuality();
    } else {
      // console.log("Resetting styles");
      cy.edges().forEach(function (ele) {
        ele.style({
          "line-style": "solid",
          width: 1,
          "line-color": "#888",
        });
      });
    }
  });
});

function nodesByCountry() {
  const countryList = {};
  let country;
  cy.nodes().forEach(function (ele) {
    for (country of ele.data().nationality) {
      countryList[country] = "";
    }
  });
  for (const [key] of Object.entries(countryList)) {
    // console.log(countryList);
    console.log(key);
    countryNodes[key] = cy.filter((element) => {
      if (element.isNode()) {
        for (country of element.data().nationality) {
          if (country == key) {
            return element;
          }
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const showStyles = document.getElementById("showStyles");
  showStyles.addEventListener("click", (e) => {
    // console.log(style[1]["style"]["line-type"]);
    if (e.target.checked) {
      edgesShowStyle = true;
      cy.style().update();
    } else {
      edgesShowStyle = false;
      cy.style().update();
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const showPeriod = document.getElementById("showPeriod");
  showPeriod.addEventListener("click", (e) => {
    // console.log(style[1]["style"]["line-type"]);
    console.log("Toggle on");
    if (e.target.checked) {
      edgesShowPeriod = true;
      cy.style().update();
    } else {
      edgesShowPeriod = false;
      cy.style().update();
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
    const clusterNationality = document.getElementById("clusterNationality");
    clusterNationality.addEventListener("click", (e) => {
        if (e.target.checked) {
            layoutOptions.clusters = clusterInfo;
        } else {
            layoutOptions.clusters = null;
        }
        layout = cy.layout(layoutOptions);
        layout.run();
    })});

document.addEventListener("DOMContentLoaded", function () {
    const compoundNationality = document.getElementById("compoundNationality");
    compoundNationality.addEventListener("click", (e) => {
        console.log(e.target.checked)
        if (e.target.checked) {
            console.log("Cluster nationality checked")
            setCluster("nationality")
        } else {

            cy.nodes().forEach(function (ele) {
                ele.move({
                    parent: null
                })
            });

            let parents = cy.elements('node[type = "grouping"]')
            console.log("Parents")
            console.log(parents)
            cy.remove(parents)
        }
        layout.run();
    })});

document.addEventListener("DOMContentLoaded", function () {
  const bubbles = document.getElementById("bubbles");
  bubbles.addEventListener("click", (e) => {
    if (e.target.checked) {
      for (const [country, nodes] of Object.entries(countryNodes)) {
        bb.addPath(nodes, null, null, {
          virtualEdges: true,
          style: {
            fill: stringToColour(country),
          },
        });
      }
    } else {
      for (const path of bb.getPaths()) {
        bb.removePath(path);
      }
    }
  });
});

// document.addEventListener('DOMContentLoaded', function() {
//     let nativeName = document.getElementById("nativename");
//     nativeName.addEventListener('click', e => {
//         //console.log("Changing native name");
//         if (e.target.checked) {
//             nativeNames = true
//         } else {
//             nativeNames = false
//         }
//         cy.style().update()
//     })});

// navbar burguer
document.addEventListener("DOMContentLoaded", () => {
  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll(".navbar-burger"),
    0,
  );

  // Add a click event on each of them
  $navbarBurgers.forEach((el) => {
    el.addEventListener("click", () => {
      // Get the target from the "data-target" attribute
      const target = el.dataset.target;
      const $target = document.getElementById(target);

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      el.classList.toggle("is-active");
      $target.classList.toggle("is-active");
    });
  });
});

// Tabs

const tabs = document.getElementById("tabs");
tabs.addEventListener("click", (e) => {
  // console.log("target:",e.target)

  if (e.target.id != "tabs") {
    openTab(e, e.target.id);
  }
});

function openTab(evt, tabName) {
  // console.log("tab name: ",tabName.replace(/tab\:/, ""))
  let i, x, tablinks;
  const info = document.getElementById("infobox");
  x = document.getElementsByClassName("content-tab");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab");
  for (i = 0; i < x.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" is-active", "");
  }
  document.getElementById(tabName.replace(/tab:/, "")).style.display = "block";
  document.getElementById(tabName).parentElement.className += " is-active";
  if (tabName == "tab:cy") {
    info.style.display = "block";
  } else {
    info.style.display = "none";
  }
}

function listVersions() {
  const template = document.getElementById("template:versions").innerHTML;
  const rendered = Mustache.render(template, { cytoscape_version: cytoscape.version,
                                               db_version: dbversion.dbversion});
  document.getElementById("versions").innerHTML = rendered;
}


function listPersons() {
  const template = document.getElementById("template:persons").innerHTML;
  const sorted = data.elements.nodes.sort((a, b) =>
    a.data.name.localeCompare(b.data.name),
  );
  const rendered = Mustache.render(template, { arr: sorted });

  const persons = document.getElementById("Persons");
  persons.addEventListener("click", (e) => {
    cy.nodes().unselect();
    cy.nodes('[id = "' + e.target.id + '"]').select();
    updateInfo(cy.nodes("#" + e.target.id));
    cy.reset();
    // cy.center('[id = "' + e.target.id +  '"]');
    openTab(true, "tab:cy");
  });
  document.getElementById("Persons").innerHTML = rendered;
}

function getNameById(id) {
  for (const person of data.elements.nodes) {
    if (person.data.id == id) {
      return person.data;
    }
  }
}

function listStyles() {
  const template = document.getElementById("template:styles").innerHTML;
  //  const sorted = data.elements.nodes.sort((a, b) => a.data.name.localeCompare(b.data.name))
  const view = [];
  const styleList = {};
  // console.log("data:", data);

  for (const edge of data.elements.edges) {
    // console.log("EDGE: ", edge.data)
    if (!styleList[edge.data.interaction]) {
      styleList[edge.data.interaction] = [];
    }
    // let sourceName = getNameById(edge.data.source).name
    // let targetName = getNameById(edge.data.target).name
    // styleList[edge.data.interaction].indexOf(sourceName) === -1 ? styleList[edge.data.interaction].push(sourceName) : false;
    // styleList[edge.data.interaction].indexOf(targetName) === -1 ? styleList[edge.data.interaction].psh(targetName) : false;
    styleList[edge.data.interaction].indexOf(edge.data.source) === -1
      ? styleList[edge.data.interaction].push(edge.data.source)
      : false;
    styleList[edge.data.interaction].indexOf(edge.data.target) === -1
      ? styleList[edge.data.interaction].push(edge.data.target)
      : false;
  }

  //    for (const [key, value] of Object.entries(styleList)) {
  //        styleList[key] = value.sort((a, b) => a.localeCompare(b))
  //    }

  const sorted = [];

  for (const [key] of Object.entries(styleList)) {
    sorted.push(key);
    styleList[key].sort((a, b) =>
      getNameById(a).name.localeCompare(getNameById(b).name),
    );
  }
  sorted.sort((a, b) => a.localeCompare(b));

  for (const key of sorted) {
    const value = styleList[key];
    const s = {};
    const pp = [];
    s.name = key;
    for (const person of value) {
      const p = {};
      p.name = getNameById(person).name;
      p.id = person;
      pp.push(p);
    }
    s.persons = pp;
    view.push(s);
  }

  const rendered = Mustache.render(template, { arr: view });
  document.getElementById("Styles").innerHTML = rendered;

  const styles = document.getElementById("Styles");
  styles.addEventListener("click", (e) => {
    cy.nodes().unselect();
    cy.nodes('[id = "' + e.target.id + '"]').select();
    updateInfo(cy.nodes("#" + e.target.id));
    cy.reset();
    openTab(true, "tab:cy");
  });
}

// Style filter

const styleFilter = document.getElementById("pickStyle");
styleFilter.onclick = pickStyle;

function updateStyleFilter() {
  styleFilter.innerHTML = "";
  const styleList = {};
  for (const edge of data.elements.edges) {
    if (!styleList[edge.data.interaction_id]) {
      styleList[edge.data.interaction_id] = {
        name: edge.data.interaction,
        native_name: edge.data.interaction_native,
      };
    }
  }

  // const sorted = data.elements.nodes.sort((a, b) => a.data.name.localeCompare(b.data.name))
  // styleList = styleList.sort((a, b) => a.name_native.localeCompare(b.name_native))

  // console.log("Style list: ", styleList);
  const allEl = document.createElement("option");
  allEl.textContent = polyglot.t("All Styles");
  allEl.value = "all";
  styleFilter.appendChild(allEl);

  const sorted = [];

  for (const [key] of Object.entries(styleList)) {
    sorted.push(key);
  }

  sorted.sort((a, b) => styleList[a].name.localeCompare(styleList[b].name));

  // for (const [key, value] of Object.entries(styleList)) {
  for (const key of sorted) {
    const value = styleList[key];
    const el = document.createElement("option");
    if (value.native_name && value.native_name.lang == lang) {
      el.textContent = value.native_name.name;
    } else {
      el.textContent = value.name;
    }

    el.value = key;
    styleFilter.appendChild(el);
  }
}

function pickStyle() {
  const value = styleFilter.value;
  // let text = styleFilter.options[styleFilter.selectedIndex].text;
  const clearButton = document.getElementById("i18n:clear");
  const lock = document.getElementById("lock-style");
  let styleNodes;

  cy.nodes().removeClass(["hidden", "ancestors", "descendants", "focused"]);
  // console.log("pickStyle: ", value, text);

  if (value == "all") {
    cy.nodes().removeClass(["hidden"]);
    cy.edges().removeClass(["hidden"]);
    // focus.classList.toggle('focus-on');
    clearButton.classList.remove("focus-style");
    clearButton.classList.add("is-dark");
    // clearButton.classList.toggle("is-dark");
    // clearButton.classList.toggle("has-text-dark");
    lock.classList.remove("fa-lock");
    lock.classList.add("fa-lock-open");
  } else {
    cy.edges().removeClass(["hidden"]);
    styleEdges = cy.edges('[interaction_id = "' + value + '"]');
    styleNodes = styleEdges.connectedNodes();
    // styleNodes.addClass("stylefocus")
    cy.nodes().difference(styleNodes).addClass("hidden");
    cy.edges().difference(styleEdges).addClass("hidden");
    // clearButton.classList.toggle("focus-style");
    // clearButton.classList.toggle("is-dark");
    // clearButton.classList.toggle("has-text-dark");
    lock.classList.add("fa-lock");
    lock.classList.remove("fa-lock-open");
    clearButton.classList.remove("is-dark");
    clearButton.classList.add("focus-style");
  }
  // console.log("Style Edges", styleEdges);
  cy.reset();
  cy.center();
  cy.fit(styleNodes);
  layout.run();
  updateTimeline();
}

document.addEventListener("DOMContentLoaded", function () {
  const clearStyle = document.getElementById("i18n:clear");
  // let clearButton = document.getElementById("i18n:clear");
  clearStyle.addEventListener("click", () => {
    // console.log("Clear style:", e);
    document.getElementById("pickStyle").value = "all";
    pickStyle();
  });
});

// Toolbox interact

// const position = { x: 0, y: 0 }

const positions = {};

interact(".draggable")
  .allowFrom(".drag-handle")
  .draggable({
    listeners: {
      // start (event) {
      // console.log(event.type, event.target.id)
      // },
      move(event) {
        if (!positions[event.target.id]) {
          positions[event.target.id] = { x: 0, y: 0 };
        }
        positions[event.target.id].x += event.dx;
        positions[event.target.id].y += event.dy;

        event.target.style.transform = `translate(${
          positions[event.target.id].x
        }px, ${positions[event.target.id].y}px)`;
      },
    },
  });

function getStyleById(id) {
  const tree = st;
  if (id in tree) {
    return tree[id];
  } else {
    return false;
  }
}

function createTimeline(nodes, title) {
  const tlOutput = {};
  const events = [];
  tlOutput.title = title;
  // create events
  for (const node of nodes) {
    const person = node.data();
    const event = {};
    // console.log(person);
    if (person.birth.date) {
      event.start_date = { year: DateTime.fromISO(person.birth.date).year };
      if (person.death.date) {
        event.end_date = { year: DateTime.fromISO(person.death.date).year };
      }
      if (person.description) {
        event.text = { headline: person.name, text: person.description.en };
      } else {
        event.text = { headline: person.name };
      }
      if (person.photo_local_url) {
        event.media = { url: person.photo_local_url };
      } else if (person.photo_url) {
        event.media = { url: person.photo_url };
      }
      // event["group"] = person.data.nationality[0]
      events.push(event);
    }
  }
  tlOutput.events = events;
  console.debug("Created timeline from database", tlOutput);
  return tlOutput;
}

function updateTimeline() {
  // let timeline;
  const selectedStyle = styleFilter.value;
  const styleData = st[selectedStyle];
  let url;
  let caption;
  let credit;
  let headline;
  let text;
  let background;

  if (selectedStyle == "all") {
    url =
      "https://res.cloudinary.com/duu3v9gfg/image/fetch/t_w_640_auto/https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2019/01/jpn-03-1548749418-1548749418.jpg";
    caption = "Judo practiced at the Fujimi-cho Kodokan dojo";
    credit = "Image by Hishida Shunso, copyright Kodokan Institute";
    headline = polyglot.t("A timeline of Budōka");
    text = polyglot.t(
      "The history of martial arts through the Budō tree database.",
    );
  } else {
    if (styleData.description && styleData.description[lang]) {
      text = styleData.description[lang];
    } else {
      text = polyglot.t("A timeline through the Budō tree database.");
    }
    if (
      styleData.media &&
      styleData.media.video_url &&
      styleData.media.photo_url
    ) {
      url = styleData.media.video_url;
      background = { url: styleData.media.photo_url };
    } else if (styleData.media && styleData.media.video_url) {
      url = styleData.media.video_url;
    } else if (styleData.media && styleData.media.photo_url) {
      url = styleData.media.photo_url;
    } else {
      url = "";
    }
    caption = "";
    credit = "";
    headline = getStyleById(selectedStyle).name;
  }
  console.log(
    "Update Timeline, selected style:",
    selectedStyle,
    getStyleById(selectedStyle),
  );
  const title = {
    media: { url, caption, credit },
    text: {
      headline,
      text,
    },
    background,
  };

  const tl = createTimeline(cy.nodes(":visible"), title);
  // timeline =
  new Timeline("timeline-embed", tl);
}

// Modal info screen
// From Bulma example in docs
document.addEventListener('DOMContentLoaded', () => {
  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      closeAllModals();
    }
  });
});
