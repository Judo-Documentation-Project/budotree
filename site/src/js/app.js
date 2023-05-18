import cytoscape from 'cytoscape';
import elk from 'cytoscape-elk';
import cola from 'cytoscape-cola';
import cise from 'cytoscape-cise';
import fcose from 'cytoscape-fcose';
import BubbleSets from 'cytoscape-bubblesets';
import $ from 'jquery';
import Polyglot from 'node-polyglot';
import yaml from 'js-yaml';

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
polyglot = new Polyglot();
polyglot.extend(langRes[lang]);
var updateLanguage = document.getElementById("language");
updateLanguage.onchange = changeLanguage

function changeLanguage () {
    var value = updateLanguage.value;
    var text = updateLanguage.options[updateLanguage.selectedIndex].text;
    lang = updateLanguage.value;
    console.log("changeLanguage: ", value, text, langRes[lang]);
    polyglot = new Polyglot();
    polyglot.extend(langRes[lang]);
    updateContent();
}

function updateContent () {
    document.getElementById('nav-budo').innerHTML = polyglot.t("Budō Lineage Tree");
    updateInfo(cy.elements(":selected"));
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
                if (ele.data().photo_url) {
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
        selector: ':selected',
        css: {
            'background-color':  '#cb4042',//'#BC002D',
            'color': 'white',
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
//    layoutOptions["name"]="elk";
//    layoutOptions["elk"]["algorithm"] = "stress";
    layout = cy.layout(layoutOptions);
    cy.nodes('[id = "JDP-1"]').select();
    layout.run();
    console.log(layout);
    nodesByCountry();
    //edgesByStyle();
});


function goHome() {
    console.log("Going home...");
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
    console.log(value, text);
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
    }

    layout = cy.layout(layoutOptions);
    cy.layout(layoutOptions);
    console.log( layoutOptions["name"]);
    layout.run();
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
            let ancestors = person.predecessors('node')
            let successors = person.successors('node')
            //ancestorsOfPeople = ancestors
            //descendantsOfPeople = successors
            let family = ancestors.union(successors).union(person)
            cy.nodes().difference(family).addClass("hidden")
            person.addClass("focused");
            ancestors.addClass("ancestors");
            successors.addClass("descendants");
            focus.classList.toggle('focus-on');
        } else {
            cy.nodes().removeClass(["hidden", "ancestors", "descendants","focused"]);
            focus.classList.toggle('focus-on');
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
        console.log("Click on node, adding Selected to ", target.selected())
        // Teacher link navigation
        let teachers = document.getElementById("teachers");
        teachers.addEventListener('click', e => {
            console.log("Teacher ID: " + e.target.id);
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
    } else { // is edge
        console.log("Tapped on edge");

        for (let person of data.elements.nodes) {
            if (person.data.id == target.data().source) {
                console.log(person.data.name);
                target.data()["teacher_name"] = person.data.name;
                target.data()["teacher_native"] = person.data.native_name;
                target.data()["teacher_photo_url"] = person.data.photo_url;
                        //console.log(event.target.data().teachers[i]);
            }
        }
        for (let person of data.elements.nodes) {
            if (person.data.id == target.data().target) {
                console.log(person.data.name);
                target.data()["student_name"] = person.data.name;
                target.data()["student_native"] = person.data.native_name;
                target.data()["student_photo_url"] = person.data.photo_url;
                //console.log(event.target.data().teachers[i]);
            }
        }

        if (target.data().interaction_native && target.data().interaction_native.lang == lang) {
            cardTitle.innerHTML = target.data().interaction_native.name
        } else {
            cardTitle.innerHTML = target.data().interaction;
        }

        const rendered = Mustache.render(template, target.data());
        document.getElementById('info').innerHTML = rendered;

    };
};


cy.nodes().bind("tap", event => updateInfo(event.target));
cy.edges().bind("tap", event => updateInfo(event.target));


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
            console.log(style[1]["style"]["curve-style"]);
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
    console.log("Setting edges by quality")
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
    console.log ("Setting edges by style");
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
        console.log(countryList);
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
