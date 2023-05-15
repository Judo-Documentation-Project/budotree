import cytoscape from 'cytoscape';
import elk from 'cytoscape-elk';
import cola from 'cytoscape-cola';
import cise from 'cytoscape-cise';
import fcose from 'cytoscape-fcose';
import BubbleSets from 'cytoscape-bubblesets';
import $ from 'jquery';
const { DateTime } = require("luxon");
const Mustache = require('mustache');
const countries = require("i18n-iso-countries");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

cytoscape.use( elk );
cytoscape.use( cola );
cytoscape.use( cise );
cytoscape.use( fcose );
cytoscape.use(BubbleSets);

import data from './tree.json';
console.log(data);


const style = [ // the stylesheet for the graph
    {
        selector: 'node',
        style: {
            'label': (ele) => {
                if (nativeNames && ele.data().native_name) {
                    return ele.data().native_name
                } else {
                    return ele.data().name
                }
            },
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
                if (nativeNames && ele.data().interaction_native) {
                    return ele.data().interaction_native
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
    // cy.nodes('[id = "JDP-1"]').style('background-color', '#BC002D');
    // cy.nodes('[id = "JDP-1"]').style('color', 'white');
    // cy.nodes('[id = "JDP-1"]').style('color', 'white');

    //console.log("Filtering by POR" + cy.nodes('[nationality = "POR"]'));
    //cy.nodes('[nationality = "POR"]');
    nodesByCountry();
    //edgesByStyle();
    // Add images from photo_url.
    cy.nodes().forEach(function( ele ) {
        if (ele.data().photo_url) {
            //console.log(ele.data().photo_url)
            ele.style({
                'background-image': ele.data().photo_url,
                'color': 'white',
                "background-fit": "cover cover",
                "background-image-opacity": 0.4
            });
        }
    });
});


function goHome() {
    console.log("Going home...");
    cy.nodes('[id = "JDP-1"]').select();
    cy.center();
    layout.run();
}

function onChange() {
    var value = e.value;
    var text = e.options[e.selectedIndex].text;
    console.log(value, text);
    switch(e.value) {
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

var e = document.getElementById("ddlViewBy");
e.onchange = onChange;
onChange();


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


var gitRoot = "https://github.com/Judo-Documentation-Project/budotree/tree/main/";
var info = document.getElementById("info");
var cardTitle = document.getElementById("card-title");
var cardFooter = document.getElementById("card-footer");
var focusedPeople =[]

document.addEventListener('DOMContentLoaded', function() {
    let pred = document.getElementById("predecessors");
    let focus = document.getElementById("focus");
    pred.addEventListener('click', e => {
	//console.log("Predecessors" + ele.data().name);
        if (e.target.checked) {
	    let person = cy.elements("node:selected")
	    focusedPeople = person
	    let ancestors = person.predecessors('node')
	    let successors = person.successors('node')
	    let family = ancestors.union(successors).union(person)	    
	    //ancestors.style("color", "#f8c3cd");
	    //successors.style("color", "f75c2f");
	    cy.nodes().difference(family).style("display", "none")
            focus.classList.toggle('focus-on');
	    person.style("background-color", "#096148")
        } else {
	    cy.nodes().style("display", "element");
	    //cy.nodes().style('color', "white");
	    //cy.nodes().style('background-color', "black");
	    //person.addClass("selected");
	    focusedPeople.style("background-color", "black")  
	    focus.classList.toggle('focus-on');
	}
	layout.run();	
    })});



cy.nodes().bind("tap", (event) => {
    const template = document.getElementById('template').innerHTML;
    event.target.select()
    for (var i = 0; i < event.target.data().teachers.length; i++) {
        //console.log(event.target.data().teachers[i]);
        for (let person of data.elements.nodes) {
            if (person.data.id == event.target.data().teachers[i].id) {
                //console.log(person.data.name);
                event.target.data().teachers[i]["teacher_name"] = person.data.name;
                //console.log(event.target.data().teachers[i]);
            }
        }

    };

    if (event.target.data().rank) {
        for (var i = 0; i < event.target.data().rank.length; i++) {
            //console.log(event.target.data().teachers[i]);
            for (let person of data.elements.nodes) {
                if (person.data.id == event.target.data().rank[i].teacher_id) {
                    //console.log(person.data.name);
                    event.target.data().rank[i]["teacher_name"] = person.data.name;
                    //console.log(event.target.data().teachers[i]);
                }
            }
        };
    };


    event.target.data().birth["country_local"] = function () {
        return countries.getName(this.country_code, "en");
    };
    
    event.target.data().death["country_local"] = function () {
        return countries.getName(this.country_code, "en");
    };
    
    
    if (event.target.data().birth.date) {
        event.target.data().birth.date_local =  DateTime.fromISO(event.target.data().birth.date).toFormat("yyyy");
    };
    if (event.target.data().death.date) {
        event.target.data().death.date_local =  DateTime.fromISO(event.target.data().death.date).toFormat("yyyy");
    };
    cardTitle.innerHTML = event.target.data().name;
    const rendered = Mustache.render(template, event.target.data());
    document.getElementById('info').innerHTML = rendered;
    cardFooter.setAttribute("href", gitRoot + event.target.data().source_yaml);
    cardFooter.innerHTML = '<i class="ml-1 fas fa-light fa-file-lines mr-3"></i> ' + event.target.data().id;
    console.log("Click on node, adding Selected to ", event.target.selected())
    //event.target.addClass("selected");
    //event.target.style('background-color','#cb4042')
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


document.addEventListener('DOMContentLoaded', function() {
    let nativeName = document.getElementById("nativename");    
    nativeName.addEventListener('click', e => {
        //console.log("Changing native name");
        if (e.target.checked) {
            nativeNames = true
        } else {
            nativeNames = false
        }
        cy.style().update()
    })});

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


