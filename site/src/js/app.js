import cytoscape from 'cytoscape';
import elk from 'cytoscape-elk';
import cola from 'cytoscape-cola';
import cise from 'cytoscape-cise';
import fcose from 'cytoscape-fcose';
import BubbleSets from 'cytoscape-bubblesets';
import $ from 'jquery';
import Polyglot from 'node-polyglot';
import yaml from 'js-yaml';
import interact from 'interactjs'
import { Timeline } from '@knight-lab/timelinejs';


const { DateTime } = require("luxon");
const Mustache = require('mustache');
const countries = require("i18n-iso-countries");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/pt.json"));
countries.registerLocale(require("i18n-iso-countries/langs/ja.json"));

cytoscape.use( elk );
cytoscape.use( cola );
cytoscape.use( cise );
cytoscape.use( fcose );
cytoscape.use(BubbleSets);

import data from './tree.json';
console.log(data);



let polyglot;


import pt_res from '../i18n/pt.json';
import ja_res from '../i18n/ja.json';

let langRes = {};
langRes["pt"] = pt_res;
langRes["ja"] = ja_res;

let lang ="en"
console.log("i18n: setting lang to ", lang)
polyglot = new Polyglot({allowMissing: true});
polyglot.extend(langRes[lang]);
var updateLanguage = document.getElementById("language");
updateLanguage.onchange = changeLanguage

function changeLanguage () {
    var value = updateLanguage.value;
    var text = updateLanguage.options[updateLanguage.selectedIndex].text;
    lang = updateLanguage.value;
    console.log("changeLanguage: ", value, text, langRes[lang]);
    polyglot = new Polyglot({allowMissing: true});
    polyglot.extend(langRes[lang]);
    updateContent();
}

function updateContent () {
    document.getElementById('nav-budo').innerHTML = polyglot.t("Budō Lineage Tree");
    updateInfo(cy.elements(":selected"));
    document.getElementById('tab:cy').innerHTML = polyglot.t("Tree");
    document.getElementById('tab:Persons').innerHTML = polyglot.t("Persons");
    document.getElementById('tab:Styles').innerHTML = polyglot.t("Styles");
    document.getElementById('tab:Timeline').innerHTML = polyglot.t("Timeline");
    updateStyleFilter();
    updateTimeline();
    cy.style().update();
}


const style = [ // the stylesheet for the graph
    {
        selector: 'node',
        style: {
            'label': (ele) => {
                if (ele.data().native_name && ele.data().native_name.lang == lang) {
                    return ele.data().native_name.name
                } else {
                    return ele.data().name
                }
            },
            'background-image': (ele) => {
                if (ele.data().photo_local_url) {
                    return ele.data().photo_local_url
                }
                else if (ele.data().photo_url) {
                    return ele.data().photo_url
                } else
                    return false
            },
            "background-fit": "cover cover",
            "background-image-opacity": 0.4,
            //'label': 'data(name)',
            'font-size': '0.5em',
            'font-family': 'Noto Serif JP, serif',
            'color': 'white',//'#BC002D',
            'text-valign': 'center',
            'text-halign' : 'center',
            'shape': 'ellipse',
            'text-wrap': 'wrap',
            'text-overflow-wrap': (ele) => {
                if (ele.data().native_name && ele.data().native_name.lang == lang) {
                    return "anywhere"
                } else {
                    return "whitespace"
                }
            },
            'word-break': 'break-all',
            'text-max-width': 40,
            'width': 55,
            'height': 55,
            'background-color': "black",
            'border-width':'1',
            //'border-color':'white'

            }
    },
    {
        selector: 'edge',
        style: {
            'width': 1,
            'line-style': 'solid',
            'curve-style': 'bezier',
            'control-point-step-size': '40',
            'taxi-direction': 'auto',
            'line-color': '#888',
            'label': (ele) => {
                if (ele.data().interaction_native && ele.data().interaction_native.lang == lang) {
                    return ele.data().interaction_native.name
                } else {
                    return ele.data().interaction
                }
            },
            //'label': 'data(interaction)',
            'font-size': '0.4em',
            'font-family': 'Noto Serif JP, serif',
            'font-weight': '700',
            'text-wrap': 'wrap',
            'text-max-width': 35,
            'color': '#444',
            'target-arrow-shape': 'triangle',
            'arrow-scale':'0.8',
            'target-arrow-color': '#666',
        }
    },
    {
        selector: 'node:selected',
        css: {
            'background-color':  '#cb4042',//'#BC002D',
            'color': 'white',
        }
    },
    {
        selector: 'edge:selected',
        css: {
            'color': '#cb4042',
            'line-color': '#f9bf45',
            'target-arrow-color':  '#f9bf45'

        }
    },
    {
        selector: '.hidden',
        css: {
            'display':  'none',//'#BC002D',
        }
    },
    {
        selector: '.focused',
        css: {
            'background-color':  '#096148'
        }
    },
    {
        selector: '.ancestors',
        css: {
            'color':  '#f596aa',
        }
    },
    {
        selector: '.descendants',
        css: {
            'color':  '#f9bf45',
        }
    },
    {
        selector: '.parents',
        css: {
            'background-color':  '#446',
            'color': 'white'
        }
    },
    {
        selector: '.children',
        css: {
            'background-color':  '#464',
            'color': 'white'
        }
    },
    {
        selector: '.stylefocus',
        css: {
            'background-color':  'yellow',
            'color': 'white'
        }
    }
];

var layoutOptions = {
    name: 'fcose',
    spacingFactor: 1,
    nodeDimensionsIncludeLabels: true,
    animate: 'end',
    refresh: 100,
    animationDuration: 250,
    elk: {
            algorithm: 'mrtree',
    }
};


var cy = cytoscape({
    container: $('#cy'), // container to render in
    elements: data.elements,
    style: style,
    wheelSensitivity: 0.1
});

var layout = cy.layout(layoutOptions);
var bb = cy.bubbleSets({
    interactive: false,}
);
document.addEventListener('DOMContentLoaded', function() {

    console.log("DOM content loaded, running layout");
    openTab(true,"tab:cy");
//    layoutOptions["name"]="elk";
//    layoutOptions["elk"]["algorithm"] = "stress";
    layout = cy.layout(layoutOptions);
    cy.nodes('[id = "JDP-1"]').select();
    layout.run();
    console.log(layout);
    nodesByCountry();
    listPersons();
    listStyles();
    updateStyleFilter();
    updateTimeline();
    //edgesByStyle();



});


function goHome() {
    //console.log("Going home...");
    let homeNode = cy.nodes('[id = "JDP-1"]')
    cy.nodes().unselect();
    cy.nodes(homeNode).select();
    cy.center();
    updateInfo(cy.nodes(homeNode))
    layout.run();
}

function changeLayout() {
    var value = updateLayout.value;
    var text = updateLayout.options[updateLayout.selectedIndex].text;
    //console.log(value, text);
    switch(updateLayout.value) {
    case "mrtree":
        layoutOptions["name"]="elk";
        layoutOptions["elk"]["algorithm"] = "mrtree";
        break;
    case "layered":
        layoutOptions["name"]="elk";
        layoutOptions["elk"]["algorithm"] = "layered";
        break;
    case "breadthfirst":
        layoutOptions["name"]="breadthfirst";
        break;
    case "stress":
        layoutOptions["name"]="elk";
        layoutOptions["elk"]["algorithm"] = "stress";
        break;
    case "cise":
        layoutOptions["name"]="cise";
        break;
    case "cola":
        layoutOptions["name"]="cola";
        break;
    case "fcose":
        layoutOptions["name"]="fcose";
        break;
    case "concentric":
        layoutOptions["name"]="concentric";
        layoutOptions["concentric"] = nodeLevel;
        layoutOptions["levelWidth"] = function(node) {return cy.nodes(":visible").maxDegree() / 6   }
        break;
    }

    layout = cy.layout(layoutOptions);
    cy.layout(layoutOptions);
    console.log( layoutOptions["name"]);
    layout.run();
}


function nodeLevel(node) {
    //console.log("Nodelevel ", node.data().id);
    if (node.selected()) {
        //console.log ("NodeLevel", node.data())
        return cy.nodes(":visible").maxDegree()
    } else {
        //console.log(node.data().name, cy.elements().aStar({ root: cy.$(':selected'), goal: node }).distance);
        return  -1 * cy.elements().aStar({ root: cy.$(':selected'), goal: node }).distance;
    }
}

var updateLayout = document.getElementById("ddlViewBy");
updateLayout.onchange = changeLayout;


var homeBtn = document.getElementById("home");
homeBtn.addEventListener("click", goHome);

var distance = document.getElementById("distance");

function setDistance(distance) {

    layoutOptions["spacingFactor"] = distance;
    layout = cy.layout(layoutOptions);
    cy.layout(layoutOptions);
    console.log( layoutOptions["name"]);
    cy.center();
    layout.run();
}



distance.addEventListener("change", function () {
    var distanceDisplay = document.getElementById("distanceDisplay");
    //console.log(document.getElementById("distance").textContent = distance.value);
    setDistance(distance.value);
    // distanceDisplay.innerHTML = distance.value;

});


import bulmaSlider from 'bulma-slider';
bulmaSlider.attach();
// Popper stuff

import popper from "cytoscape-popper";
cytoscape.use(popper);

cy.elements().unbind("mouseover");

function show_image(src, width, height, alt) {
    var img = document.createElement("img");
    img.src = src;
    img.width = width;
    img.height = height;
    img.alt = alt;

    // This next line will just add it to the <body> tag
    document.body.appendChild(img);
}

//document.addEventListener('DOMContentLoaded', function() {

//    })});

var gitRoot = "https://github.com/Judo-Documentation-Project/budotree/tree/main/";
var info = document.getElementById("info");
var cardTitle = document.getElementById("card-title");
var cardFooter = document.getElementById("card-footer");
var focusedPeople =[]
var ancestorsOfPeople = []
var descendantsOfPeople = []

let styleNodes;
let personNodes;

document.addEventListener('DOMContentLoaded', function() {
    let pred = document.getElementById("predecessors");
    let focus = document.getElementById("focus");
    pred.addEventListener('click', e => {
        //console.log("Predecessors" + ele.data().name);
        let person;
        if (e.target.checked) {
            console.log(cy.elements(":selected"),cy.elements(":selected").isEdge())
            if (cy.elements(":selected").isEdge()) {
                person = cy.elements(":selected").target();
            } else {
                person = cy.elements("node:selected");
            }
            //focusedPeople = person
            personNodes = cy.nodes(":visible");
            let ancestors = person.predecessors('node').filter(":visible");
            let successors = person.successors('node').filter(":visible");
            //ancestorsOfPeople = ancestors
            //descendantsOfPeople = successors
            let family = ancestors.union(successors).union(person)

            cy.nodes().difference(family).addClass("hidden")
            person.addClass("focused");
            ancestors.addClass("ancestors");
            successors.addClass("descendants");
            focus.classList.toggle('focus-on');

        } else {
            personNodes.removeClass(["hidden", "ancestors", "descendants","focused"]);
            focus.classList.toggle('focus-on');
            //document.getElementById('pickStyle').value="all";
            //pickStyle();
        }
        layout.run();
    })});

function updateInfo (target) {
    const template = document.getElementById('template').innerHTML;
    target.select()
    console.log(event);

    if (target.isNode()) {
        for (var i = 0; i < target.data().teachers.length; i++) {
            //console.log(event.target.data().teachers[i]);
            for (let person of data.elements.nodes) {
                if (person.data.id == target.data().teachers[i].id) {
                    //console.log(person.data.name);
                    target.data().teachers[i]["teacher_name"] = person.data.name;
                    target.data().teachers[i]["teacher_native"] = person.data.native_name;
                    console.log(target.data().teachers[i]["teacher_name"]);
                }
            }

        };

        if (target.data().rank) {
            for (var i = 0; i < target.data().rank.length; i++) {
                //console.log(event.target.data().teachers[i]);
                for (let person of data.elements.nodes) {
                    if (person.data.id == target.data().rank[i].teacher_id) {
                        //console.log(person.data.name);
                        target.data().rank[i]["teacher_name"] = person.data.name;
                        target.data().rank[i]["teacher_native"] = person.data.native_name;
                        //console.log(event.target.data().teachers[i]);
                    }
                }
            };
        };

        //console.log("Students? ", target.outgoers('node'))
        let students = []
        target.outgoers('node').forEach( e => {
            students.push(e.data())
        });

        target.data().students = students;

        target.data().birth["country_local"] = function () {
            return countries.getName(this.country_code, lang);
        };

        target.data().death["country_local"] = function () {
            return countries.getName(this.country_code, lang);
        };

        if (target.data().description) {
            target.data().description_lang = target.data().description[lang];
        }
        if (target.data().birth.date) {
            target.data().birth.date_local =  DateTime.fromISO(target.data().birth.date).toFormat("yyyy");
        };
        if (target.data().death.date) {
            target.data().death.date_local =  DateTime.fromISO(target.data().death.date).toFormat("yyyy");
        };


        if (target.data().native_name && target.data().native_name.lang == lang) {
            cardTitle.innerHTML = target.data().native_name.name;
        } else {
            cardTitle.innerHTML = target.data().name;
        }

        const rendered = Mustache.render(template, target.data());

        document.getElementById('info').innerHTML = rendered;

        // i18n
        document.getElementById('i18n:teachers').innerHTML = polyglot.t("Teachers");
        document.getElementById('i18n:students').innerHTML = polyglot.t("Students");
        document.getElementById('i18n:rank').innerHTML = polyglot.t("Rank");
        document.getElementById('i18n:sources').innerHTML = polyglot.t("Sources");

        cardFooter.setAttribute("href", gitRoot + target.data().source_yaml);
        cardFooter.innerHTML = '<i class="ml-1 fas fa-light fa-file-lines mr-3"></i> ' + target.data().id;

        // Teacher link navigation
        let teachers = document.getElementById("teachers");
        teachers.addEventListener('click', e => {
            //console.log("Teacher ID: " + e.target.id);
            target.unselect();
            updateInfo(cy.nodes('#' + e.target.id));
        });


        // Student link navigation
        if (students.length > 0) {
            let studentsInfo = document.getElementById("students");
            studentsInfo.addEventListener('click', e => {
                target.unselect();
                updateInfo(cy.nodes('#' + e.target.id));
            });
        }
        cy.nodes().removeClass(["parents"]);
        cy.nodes().removeClass(["children"]);
        target.outgoers("node").addClass("children");
        target.incomers("node").addClass("parents");

    } else { // is edge
        console.log("Tapped on edge: ", target.data());

        for (let person of data.elements.nodes) {
            if (person.data.id == target.data().source) {
                //console.log(person.data.name);
                target.data()["teacher_name"] = person.data.name;
                target.data()["teacher_native"] = person.data.native_name;
                if (person.data.photo_local_url) {
                    target.data()["teacher_photo_url"] = person.data.photo_local_url;
                } else {
                    target.data()["teacher_photo_url"] = person.data.photo_url;
                }
                        //console.log(event.target.data().teachers[i]);
            }
        }
        for (let person of data.elements.nodes) {
            if (person.data.id == target.data().target) {
                //console.log(person.data.name);
                target.data()["student_name"] = person.data.name;
                target.data()["student_native"] = person.data.native_name;
                if (person.data.photo_local_url) {
                    target.data()["student_photo_url"] = person.data.photo_local_url;
                } else {
                    target.data()["student_photo_url"] = person.data.photo_url;
                }
                //console.log(event.target.data().teachers[i]);
            }
        }

        if (target.data().interaction_native && target.data().interaction_native.lang == lang) {
            cardTitle.innerHTML = target.data().interaction_native.name;
        } else {
            cardTitle.innerHTML = target.data().interaction;
        }

        const rendered = Mustache.render(template, target.data());
        document.getElementById('info').innerHTML = rendered;
        // i18n
        document.getElementById('i18n:sources_int').innerHTML = polyglot.t("Sources");

    };
};


cy.nodes().bind("tap", event => updateInfo(event.target));
cy.edges().bind("tap", event => updateInfo(event.target));

cy.nodes().bind("dbltap", event => { //cy.reset();
                                     console.log("Centering on ", event.target.data().name);
                                     cy.center(event.target);
                                     layout.run();
                                   });


cy.nodes().bind("dbltap", event => {
    console.log("Centering on ", event.target.data().name);
    cy.center(event.target);
    //layout.run();
});
document.addEventListener('DOMContentLoaded', function() {
    let cardToggles = document.getElementsByClassName('card-toggle');
    for (let i = 0; i < cardToggles.length; i++) {
        cardToggles[i].addEventListener('click', e => {
            e.currentTarget.parentElement.parentElement.childNodes[3].classList.toggle('is-hidden');
        });
    }
});



document.addEventListener('DOMContentLoaded', function() {
    let lineType = document.getElementById("lineType");
    lineType.addEventListener('click', e => {
            //console.log(style[1]["style"]["curve-style"]);
            if (e.target.checked) {
                cy.style()
                        .selector('edge')
                        .style({
                            'curve-style': 'bezier'
                        }).update();
            } else {
                cy.style()
                        .selector('edge')
                        .style({
                            'curve-style': 'taxi'
                        }).update();
            }})});


var countryNodes = {};
var styleEdges = {};
var nativeNames = false;

var stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour+'33';
}

var stringToColourSimple = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

function edgesByQuality () {
    //console.log("Setting edges by quality")
    cy.edges().forEach(function(ele) {
        //console.log(ele.data().quality);
        switch (ele.data().quality) {
        case 3:
            ele.style({
                'line-style': 'solid',
                'width': 3,
            });
            break;
        case 2:
            ele.style({
                'line-style': 'solid',
                'width': 2,
            });
            break;
        case 1:
            ele.style({
                'line-style': 'dashed',
                'width': 2,
            });
            break;
        case 0:
            ele.style({
                'line-style': 'dashed',
                'width': 1,
            });
            break;
        default:
            ele.style({
                'line-style': 'dotted',
                'width': 1,

            })
        }
    });

};

function edgesByStyle () {
    //console.log ("Setting edges by style");
    cy.edges().forEach(function(ele) {
        ele.style({
            'line-color': stringToColourSimple(ele.data().interaction)
        });

    })
}


document.addEventListener('DOMContentLoaded', function() {
    let styleColor = document.getElementById("styleColor");
    styleColor.addEventListener('click', e => {
            if (e.target.checked) {
            edgesByStyle()
            } else {
                cy.style()
                        .selector('edge')
                        .style({
                            'line-color': '#888'
                        }).update();
            cy.edges().forEach(function(ele) {
                ele.style({
                    'line-color': '#888'
                });

            })
            }})});


document.addEventListener('DOMContentLoaded', function() {
    let quality = document.getElementById("quality");
    quality.addEventListener('click', e => {
        //console.log(style[1]["style"]["line-type"]);
            if (e.target.checked) {
            edgesByQuality()
            } else {
            //console.log("Resetting styles");
                cy.edges().forEach(function(ele) {
                ele.style({
                    'line-style': 'solid',
                    'width': 1,
                    'line-color': '#888'
                });

            })
            }})});

function nodesByCountry () {
    let countryList = {};
    let country;
    cy.nodes().forEach(function( ele ) {
        for (country of ele.data().nationality) {
            countryList[country] = ""
        }
    })
    for (const [key, value] of Object.entries(countryList)) {
        //console.log(countryList);
        countryNodes[key] = cy.filter(function(element,i) {
            if (element.isNode()) {
                for (country of element.data().nationality) {
                    if (country == key) {
                        return element;
                    }
                }
            }
        })
    };
};


document.addEventListener('DOMContentLoaded', function() {
    let bubbles = document.getElementById("bubbles");
    bubbles.addEventListener('click', e => {
            if (e.target.checked) {
            for (const [country, nodes] of Object.entries(countryNodes)) {
                bb.addPath(nodes, null, null, {
                    virtualEdges: true,
                    style: {
                        fill: stringToColour(country)

                    }
                });
            };
        } else {
            for (let path of bb.getPaths()) {
                bb.removePath(path)
                }}})});


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
document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Add a click event on each of them
    $navbarBurgers.forEach( el => {
        el.addEventListener('click', () => {

            // Get the target from the "data-target" attribute
            const target = el.dataset.target;
            const $target = document.getElementById(target);

            // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');

        });
    });

});

// Tabs

var tabs = document.getElementById("tabs");
tabs.addEventListener('click', e => {
    console.log("target:",e.target)
    if (e.target.id != "tabs") {
        openTab(e,e.target.id)
    }
});



function openTab(evt, tabName) {
    //console.log("tab name: ",tabName.replace(/tab\:/, ""))
    var i, x, tablinks;
    let info = document.getElementById("infobox");
    x = document.getElementsByClassName("content-tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" is-active", "");
    }
    document.getElementById(tabName.replace(/tab\:/,"")).style.display = "block";
    document.getElementById(tabName).parentElement.className += " is-active";
    if (tabName == "tab:cy") {
        info.style.display = "block";
    } else {
        info.style.display = "none";
    }
}

function listPersons () {
    const template = document.getElementById('template:persons').innerHTML;
    const sorted = data.elements.nodes.sort((a, b) => a.data.name.localeCompare(b.data.name))
    const rendered = Mustache.render(template, {arr:sorted});

    let persons = document.getElementById("Persons");
    persons.addEventListener('click', e => {
        cy.nodes().unselect()
        cy.nodes('[id = "' + e.target.id +  '"]').select()
        updateInfo(cy.nodes('#' + e.target.id));
        cy.reset();
        //cy.center('[id = "' + e.target.id +  '"]');
        openTab(true, "tab:cy")
    });
    document.getElementById('Persons').innerHTML = rendered;
}


function getNameById (id) {
    for (let person of data.elements.nodes) {
        if (person.data.id == id) {
            return person.data
        }
    }
}


function listStyles() {
    const template = document.getElementById('template:styles').innerHTML;
    //  const sorted = data.elements.nodes.sort((a, b) => a.data.name.localeCompare(b.data.name))
    let view = [];
    let styleList = {};
    //console.log("data:", data);

    for (const edge of data.elements.edges) {
        //console.log("EDGE: ", edge.data)
        if (! styleList[edge.data.interaction]) {
            styleList[edge.data.interaction] = [];
        }
        let sourceName = getNameById(edge.data.source).name
        let targetName = getNameById(edge.data.target).name
        //styleList[edge.data.interaction].indexOf(sourceName) === -1 ? styleList[edge.data.interaction].push(sourceName) : false;
        //styleList[edge.data.interaction].indexOf(targetName) === -1 ? styleList[edge.data.interaction].psh(targetName) : false;
        styleList[edge.data.interaction].indexOf(edge.data.source) === -1 ? styleList[edge.data.interaction].push(edge.data.source) : false;
        styleList[edge.data.interaction].indexOf(edge.data.target) === -1 ? styleList[edge.data.interaction].push(edge.data.target) : false;
    }

//    for (const [key, value] of Object.entries(styleList)) {
//        styleList[key] = value.sort((a, b) => a.localeCompare(b))
//    }

    let sorted = [];

    for (const [key, value] of Object.entries(styleList)) {
        sorted.push(key);
        styleList[key].sort((a, b) => getNameById(a).name.localeCompare(getNameById(b).name));
    }
    sorted.sort((a, b) => a.localeCompare(b))

    for (const key of sorted) {
        let value = styleList[key]
        let s = {}
        let pp = []
        s["name"] = key;
        for (const person of value) {
            let p = {}
            p["name"] = getNameById(person).name;
            p["id"] = person;
            pp.push(p)
        }
        s["persons"] = pp;
        view.push(s)
    }

    const rendered = Mustache.render(template, {arr:view});
    document.getElementById('Styles').innerHTML = rendered;

    let styles = document.getElementById("Styles");
    styles.addEventListener('click', e => {
        cy.nodes().unselect()
        cy.nodes('[id = "' + e.target.id +  '"]').select()
        updateInfo(cy.nodes('#' + e.target.id));
        cy.reset();
        openTab(true, "tab:cy")
    });
};

// Style filter

let styleFilter  = document.getElementById("pickStyle")
styleFilter.onchange = pickStyle;

function updateStyleFilter() {
    styleFilter.innerHTML = "";
    let styleList = {};
    for (const edge of data.elements.edges) {
        if (! styleList[edge.data.interaction_id]) {
            styleList[edge.data.interaction_id] = {name: edge.data.interaction, native_name: edge.data.interaction_native};
        }
    }

    //const sorted = data.elements.nodes.sort((a, b) => a.data.name.localeCompare(b.data.name))
    //styleList = styleList.sort((a, b) => a.name_native.localeCompare(b.name_native))

    console.log("Style list: ", styleList);
    let allEl = document.createElement("option");
    allEl.textContent= polyglot.t("All Styles");
    allEl.value = "all";
    styleFilter.appendChild(allEl);

    let sorted = [];

    for (const [key, value] of Object.entries(styleList)) {
        sorted.push(key)
    }

    sorted.sort((a, b) => styleList[a].name.localeCompare(styleList[b].name))

    //for (const [key, value] of Object.entries(styleList)) {
    for (const key of sorted) {
        let value = styleList[key];
        let el = document.createElement("option");
        if (value.native_name && value.native_name.lang == lang) {
            el.textContent = value.native_name.name;
        } else {
            el.textContent = value.name;
        }

        el.value = key;
        styleFilter.appendChild(el)
    }
}
function pickStyle () {
    let value = styleFilter.value;
    let text = styleFilter.options[styleFilter.selectedIndex].text;
    let clearButton = document.getElementById("i18n:clear");
    let lock = document.getElementById("lock-style");
    let styleNodes;

    cy.nodes().removeClass(["hidden", "ancestors", "descendants","focused"]);
    console.log("pickStyle: ", value, text);

    if (value == "all") {
        cy.nodes().removeClass(["hidden"]);
        cy.edges().removeClass(["hidden"]);
        //focus.classList.toggle('focus-on');
        clearButton.classList.remove("focus-style");
        clearButton.classList.add("is-dark");
        //clearButton.classList.toggle("is-dark");
        //clearButton.classList.toggle("has-text-dark");
        lock.classList.remove("fa-lock");
        lock.classList.add("fa-lock-open");
    } else {
        styleEdges = cy.edges('[interaction_id = "' + value + '"]');
        styleNodes = styleEdges.connectedNodes()
        //styleNodes.addClass("stylefocus")
        cy.nodes().difference(styleNodes).addClass("hidden");
        cy.edges().difference(styleEdges).addClass("hidden");
        //clearButton.classList.toggle("focus-style");
        //clearButton.classList.toggle("is-dark");
        //clearButton.classList.toggle("has-text-dark");
        lock.classList.add("fa-lock");
        lock.classList.remove("fa-lock-open");
        clearButton.classList.remove("is-dark");
        clearButton.classList.add("focus-style");
    }
    console.log("Style Edges", styleEdges);
    cy.reset();
    cy.center();
    cy.fit(styleNodes);
    layout.run();
    updateTimeline();
}

document.addEventListener('DOMContentLoaded', function() {
    let clearStyle = document.getElementById("i18n:clear");
    let clearButton = document.getElementById("i18n:clear");
    clearStyle.addEventListener('click', e => {
        console.log("Clear style:", e);
        document.getElementById('pickStyle').value="all";
        pickStyle();
    })});

// Toolbox interact

const position = { x: 0, y: 0 }

const positions = {};

interact('.draggable').allowFrom('.drag-handle').draggable({
    listeners: {
        start (event) {
            //console.log(event.type, event.target.id)
        },
        move (event) {
            if (!positions[event.target.id]) {
                positions[event.target.id] = {x: 0, y:0};
            }
            positions[event.target.id].x += event.dx
            positions[event.target.id].y += event.dy

            event.target.style.transform =
                `translate(${positions[event.target.id].x}px, ${positions[event.target.id].y}px)`
        },
    }

})

/* "Toolbox" activation

document.addEventListener('DOMContentLoaded', function() {
    let toolboxToggle = document.getElementById('toolbox-icon');
    let toolboxContent = document.getElementById('toolbox-content');
    toolboxToggle.addEventListener('click', e => {
        //console.log("Hide: ", e.currentTarget.parentElement.parentElement.childNodes)
        //e.currentTarget.parentElement.parentElement.childNodes[3].classList.toggle('is-hidden');
        toolboxContent.classList.toggle('is-hidden')
        //e.currentTarget.parentElement.childNodes[3].classList.toggle('is-hidden');
        });
});
*/
// TImeline
//import tl from './tl.json';
import st from './styles.json'

function getStyleById (id) {
    let tree = st;
    if (id in tree) {
        return tree[id];
    } else {
        return false;
    }
}

function createTimeline (nodes, title) {
    let tlOutput = {};
    let events = [];
    tlOutput["title"] = title;
    // create events
    for (const node of nodes) {
        let person = node.data();
        let event = {}
        //console.log(person);
        if (person.birth.date) {
            event["start_date"] = { year: DateTime.fromISO(person.birth.date).year};
            if (person.death.date) {
                event["end_date"] = { year: DateTime.fromISO(person.death.date).year };
            }
            if (person.description) {
                event["text"] = { headline: person.name,
                                  text: person.description.en}
            } else {
                event["text"] = { headline: person.name }
            }
            if (person.photo_local_url) {
                event["media"] = {url: person.photo_local_url}
            } else if (person.photo_url) {
                event["media"] = {url: person.photo_url}
            }
            //event["group"] = person.data.nationality[0]
            events.push(event)
        }
    }
    tlOutput["events"] = events;
    console.debug("Created timeline from database", tlOutput);
    return tlOutput;
}


function updateTimeline() {
    let timeline;
    let selectedStyle = styleFilter.value;
    let styleData = st[selectedStyle];
    let url;
    let caption;
    let credit;
    let headline;
    let text;
    let background;

    if (selectedStyle == "all") {
        url = "https://res.cloudinary.com/duu3v9gfg/image/fetch/t_w_640_auto/https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2019/01/jpn-03-1548749418-1548749418.jpg";
        caption = "Judo practiced at the Fujimi-cho Kodokan dojo";
        credit = "Image by Hishida Shunso, copyright Kodokan Institute";
        headline =  polyglot.t("A timeline of Budōka");
        text = polyglot.t("The history of martial arts through the Budō tree database.");
    } else {
        if (styleData.description && styleData.description[lang]) {
            text = styleData.description[lang]
        } else {
            text = polyglot.t("A timeline through the Budō tree database.")
        }
        if (styleData.media && styleData.media.video_url && styleData.media.photo_url) {
            url = styleData.media.video_url;
            background = { url: styleData.media.photo_url };
        } else if (styleData.media && styleData.media.video_url) {
            url = styleData.media.video_url;
        } else if (styleData.media && styleData.media.photo_url) {
            url = styleData.media.photo_url;
        } else {
            url = "";
        }
        caption = ""
        credit = "";
        headline = getStyleById(selectedStyle).name;

    }
    console.log("Update Timeline, selected style:", selectedStyle, getStyleById(selectedStyle));
    let title = { media:
                  { url: url,
                    caption: caption,
                    credit: credit
                  },
                  text: {
                      headline: headline,
                      text: text
                  },
                  background: background
                };

    let tl = createTimeline(cy.nodes(":visible"), title);
    timeline = new Timeline('timeline-embed', tl);
}
