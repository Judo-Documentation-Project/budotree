const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const {
    glob,
    globSync,
    globStream,
    globStreamSync,
    Glob,
} = require('glob');

function importYAML (dirPath) {
    //var yamlFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.yaml'));
    const yamlFiles = globSync(dirPath + '/**/*.yaml');
    let persons = {};
    for (const filePath of yamlFiles) {
        let contents = fs.readFileSync(filePath, 'utf8');
        let parsedYaml = yaml.load(contents);
        let id = parsedYaml.person.id;
	parsedYaml.person.source_yaml = filePath; 
        //console.log(parsedYaml);
        persons[id] = parsedYaml.person;

    }
    return persons;
};

function importStylesYAML (dirPath) {
    var yamlFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.yaml'));
    let styles = {};
    for (const file of yamlFiles) {
        let filePath = `${dirPath}/${file}`;
        let contents = fs.readFileSync(filePath, 'utf8');
        let parsedYaml = yaml.load(contents);
        let id = parsedYaml.style.id;
        styles[id] = parsedYaml.style;
    }
    return styles;
};

function getNameById (id, tree) {
    if (id in tree) {
        return tree[id].name;
    } else {
        return false;
    }
}
function getStyleById (id, tree) {
    if (id in tree) {
        return tree[id].name;
    } else {
        return false;
    }
}

function createCYJS (data, styles) {
    let nodes = [];
    let edges = [];
    let cyOutput = {};
    for (const [id, person] of Object.entries(data)) {
        // console.log(`${id}: ${person}`);
        process.stdout.write(`${id}: ${person.name} | `);
        //console.log(`* ${id}`);
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
                let style = "";
		        var edgeId = "JDP" + Math.random().toString(16).slice(2);
                if ("style_id" in teacher && teacher.style_id !== null) {
                    style = getStyleById(teacher.style_id, styles)
                } else {
                    style = teacher["style"]
                }
		        edgeData["id"] = edgeId;
		        edgeData["name"] = `${getNameById(teacher.id, data)} (${style}) ${person.name}`;
		        edgeData["source"] = person.id;
		        edgeData["target"] = teacher.id;
		        edgeData["interaction"] = style;
		        edgeData["place"] = teacher.place;
                edgeData["quality"] = teacher.quality;
		        edge["data"] = edgeData;
		        edges.push(edge);
	        }
	    }
    }
    cyOutput["format_version"] = "1.0";
    cyOutput["generated_by"] = "Judo Tree JS";
    cyOutput["elements"] = {"nodes":nodes, "edges": edges};
    return cyOutput;
};


function writeJSON (data, filePath) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
	    if (err) {
	        console.error(err);
	        return;
	    }
	    console.log(`\n\nData saved to ${filePath}`);
    });
};

module.exports = { importYAML, importStylesYAML, createCYJS, writeJSON };



// persons = importYAML("database/persons");
// styles = importStylesYAML("database/styles");
// console.log(styles);
// tree = createCYJS(persons, styles);
// writeJSON(tree, "/tmp/n.md");

// console.log(getStyleById("JDP-S-1", styles));


// const hostname = '127.0.0.1';
// const port = 3000;

// const server = http.createServer((req, res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('Hello World');const hostname = '127.0.0.1';
// });

// server.listen(port, hostname, () => {
//     console.log(`Server running at http://${hostname}:${port}/`);
// });
