const fs = require('fs');
const yaml = require('js-yaml');

function importYAML (dirPath) {
    var yamlFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.yaml'));   
    let persons = {};
    for (const file of yamlFiles) {
	let filePath = `${dirPath}/${file}`;
	let contents = fs.readFileSync(filePath, 'utf8');
	let parsedYaml = yaml.load(contents);
	let id = parsedYaml.person.id;
	//console.log(parsedYaml);
	persons[id] = parsedYaml.person;
    }
    return persons;
}


function getNameById (id, tree) {
    if (id in tree) {
	return tree[id].name;
    } else {
	return false;
    }
}

function createCYJS (data) {
    let nodes = [];
    let edges = [];
    let cyOutput = {};
    for (const [id, person] of Object.entries(data)) {
	// console.log(`${id}: ${person}`);
	console.log(`* ${id}`);
	let node = {};
	node["data"] = person;
	nodes.push(node);
	// Build the edges
	for (teacher of person.teachers) {
	    // console.log(teacher.id);
	    if ("id" in teacher && teacher.id !== null) {
		//console.log(`Teacher: ${teacher.id}`);
		let edge = {};
		let edgeData = {};
		var edgeId = "JDP" + Math.random().toString(16).slice(2);
		edgeData["id"] = edgeId;
		edgeData["name"] = `${getNameById(teacher.id, data)} (${teacher["style"]}) ${person.name}`;
		edgeData["source"] = person.id;
		edgeData["target"] = teacher.id;
		edgeData["interaction"] = teacher.style;
		edgeData["place"] = teacher.place;
		edge["data"] = edgeData;
		edges.push(edge);
	    }
	}
    }
    cyOutput["format_version"] = "1.0";
    cyOutput["generated_by"] = "Judo Tree JS";
    cyOutput["elements"] = {"nodes":nodes, "edges": edges};
    return cyOutput;
}


function writeJSON (data, filePath) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
	if (err) {
	    console.error(err);
	    return;
	}
	console.log(`Data saved to ${filePath}`);
    });
}

module.exports = { importYAML, createCYJS, writeJSON };
