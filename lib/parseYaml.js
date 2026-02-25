const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const scrape = require('html-metadata');

const {
    glob,
    globSync,
    globStream,
    globStreamSync,
    Glob,
} = require('glob');

let sourcesMap = {};

function importYAML (dirPath) {
    //var yamlFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.yaml'));
    const yamlFiles = globSync(dirPath + '/**/*.yaml');
    let persons = {};
    for (const filePath of yamlFiles) {
        let contents = fs.readFileSync(filePath, 'utf8');
        let parsedYaml = yaml.load(contents);
        let id = parsedYaml.id;
        delete parsedYaml['@context'];
        parsedYaml.source_yaml = filePath;
        //console.log(parsedYaml);
        persons[id] = parsedYaml;

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
        let id = parsedYaml.id;
        delete parsedYaml['@context'];
        styles[id] = parsedYaml;
    }
    return styles;
};

function importPlacesYAML (dirPath) {
    const yamlFiles = globSync(dirPath + '/**/*.yaml');
    let places = {};
    for (const filePath of yamlFiles) {
        let contents = fs.readFileSync(filePath, 'utf8');
        let parsedYaml = yaml.load(contents);
        let id = parsedYaml.id;
        delete parsedYaml['@context'];
        places[id] = parsedYaml;
    }
    return places;
};

function importOrgsYAML (dirPath) {
    const yamlFiles = globSync(dirPath + '/**/*.yaml');
    let orgs = {};
    for (const filePath of yamlFiles) {
        let contents = fs.readFileSync(filePath, 'utf8');
        let parsedYaml = yaml.load(contents);
        let id = parsedYaml.id;
        delete parsedYaml['@context'];
        orgs[id] = parsedYaml;
    }
    return orgs;
};

function importSourcesYAML (dirPath) {
    const yamlFiles = globSync(dirPath + '/**/*.yaml');
    let sources = {};
    for (const filePath of yamlFiles) {
        let contents = fs.readFileSync(filePath, 'utf8');
        let parsedYaml = yaml.load(contents);
        let id = parsedYaml.id;
        delete parsedYaml['@context'];
        sources[id] = parsedYaml;
    }
    return sources;
};

function resolveName(nameMap) {
    // Resolve a language map to a single display string
    if (typeof nameMap === 'string') return nameMap;
    if (!nameMap || typeof nameMap !== 'object') return '';

    // Prefer romanized variants (ending with -Latn)
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

function getNameById (id, tree) {
    if (id in tree) {
        return resolveName(tree[id].name);
    } else {
        return false;
    }
}

function getStyleById (id, tree) {
    if (id in tree) {
        // Return full name language map instead of [name, native_name]
        return tree[id].name;
    } else {
        return false;
    }
}

function getPlaceById (id, tree) {
    if (id in tree) {
        return tree[id].name;
    } else {
        return null;
    }
}

function getOrgById (id, tree) {
    if (id in tree) {
        return tree[id].name;
    } else {
        return null;
    }
}

async function updateSource (uri) {
  let options =  {
    url: uri,
    timeout: 3000
    }

    await scrape(options)
        .then(metadata => metadata)
        .then((metadata) => {
            process.stdout.write(".");
            sourcesMap[uri] = metadata.general.title
        })
        .catch((error) => {
            //console.log(error)
        });
}

async function updateSources(data, styles) {
    //return true;
    let promises = [];
    console.log("Building source citations...")

    for (const [id, person] of Object.entries(data)) {
        for (source of person.sources) {
            promises.push(updateSource(source.uri));
        }
        if (person.teachers){
            for (teacher of person.teachers) {
                if (teacher.interactions) {
                    for (interaction of teacher.interactions) {
                        if (interaction.sources) {
                            for (source of interaction.sources) {
                                if (! source.cite) {
                                    promises.push(updateSource(source.uri));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return Promise.allSettled(promises)
}

function createCYJS (data, styles, places, orgs) {
    let nodes = [];
    let edges = [];
    let cyOutput = {};
    console.log("\nBuilding CytoScape JSON...");
    for (const [id, person] of Object.entries(data)) {
        // console.log(`${id}: ${person}`);
        process.stdout.write(`${id}: ${resolveName(person.name)} | `);
        //console.log(`* ${id}`);
        let node = {};

        // Flatten geo fields for backward compatibility
        for (const event of ['birth', 'death']) {
            if (person[event] && person[event].geo) {
                person[event].location = person[event].geo.name || null;
                person[event].wikidata = person[event].geo.wikidata || null;
                person[event].country_code = person[event].geo.country_code || null;
            }
        }

        // Transform nationality from new object format to old array format for backward compatibility
        if (person.nationality && Array.isArray(person.nationality)) {
            const nationalityCodes = [];
            const nationalityQids = [];
            
            for (const entry of person.nationality) {
                if (typeof entry === 'object' && entry !== null) {
                    if (entry.code) nationalityCodes.push(entry.code);
                    if (entry.wikidata) nationalityQids.push(entry.wikidata);
                } else if (typeof entry === 'string') {
                    // Handle legacy format during transition
                    nationalityCodes.push(entry);
                }
            }
            
            // Replace with old format arrays
            person.nationality = nationalityCodes.length > 0 ? nationalityCodes : null;
            person.nationality_qid = nationalityQids.length > 0 ? nationalityQids : null;
        }

        if (person.rank) {
            for (r of person.rank) {
                if ("style_id" in r && r.style_id !== null) {
                    const styleName = getStyleById(r.style_id, styles);
                    if (styleName) {
                        r["style"] = resolveName(styleName);
                        r["style_name"] = styleName;  // Store full language map
                    }
                }
                if ("org_id" in r && r.org_id !== null && orgs) {
                    r["org"] = getOrgById(r.org_id, orgs);
                }
            }
        }
        // Build the edges
        for (source of person.sources) {
            source["cite"] = sourcesMap[source.uri];
        }
        node["data"] = person;
        nodes.push(node);

        for (teacher of person.teachers) {
            // console.log(teacher.id);
            if ("id" in teacher && teacher.id !== null) {
                //console.log(`Teacher: ${teacher.id}`);
                let edge = {};
                let edgeData = {};
                let style = "";
                let style_name = null;
                var edgeId = "JDP" + Math.random().toString(16).slice(2);
                if ("style_id" in teacher && teacher.style_id !== null) {
                    let resolved = getStyleById(teacher.style_id, styles);
                    if (resolved) {
                        style = resolveName(resolved);
                        style_name = resolved;  // Full language map
                    }
                }

                // Aggregate interactions: first place, earliest start → latest end, union sources
                let firstPlaceId = null;
                let firstPlace = null;
                let earliestStart = null;
                let latestEnd = null;
                let allSources = [];

                if (teacher.interactions) {
                    for (interaction of teacher.interactions) {
                        if (firstPlaceId === null && interaction.place_id) {
                            firstPlaceId = interaction.place_id;
                            firstPlace = places ? getPlaceById(interaction.place_id, places) : null;
                        }
                        if (interaction.period) {
                            const s = interaction.period.start || null;
                            const e = interaction.period.end || null;
                            if (s && (earliestStart === null || s < earliestStart)) earliestStart = s;
                            if (e && (latestEnd === null || e > latestEnd)) latestEnd = e;
                            if (!earliestStart && s) earliestStart = s;
                        }
                        if (interaction.sources) {
                            for (source of interaction.sources) {
                                if (! source["cite"]){
                                    source["cite"] = sourcesMap[source.uri];
                                }
                                allSources.push(source);
                            }
                        }
                    }
                }

                edgeData["id"] = edgeId;
                edgeData["name"] = `${getNameById(teacher.id, data)} (${style}) ${resolveName(person.name)}`;
                edgeData["source"] = teacher.id;
                edgeData["target"] = person.id;
                edgeData["interaction"] = style;
                edgeData["interaction_id"] = teacher.style_id;
                edgeData["interaction_name"] = style_name;  // Store full language map
                edgeData["place"] = firstPlace;
                edgeData["place_id"] = firstPlaceId;
                // Map confidence.level to quality for backward compatibility
                edgeData["quality"] = teacher.confidence ? teacher.confidence.level : teacher.quality;
                edgeData["period"] = (earliestStart || latestEnd)
                    ? { start: earliestStart, end: latestEnd }
                    : null;
                edgeData["sources"] = allSources.length > 0 ? allSources : null;
                // Preserve full interactions array for consumers that want detail
                edgeData["interactions"] = teacher.interactions || null;
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


module.exports = { importYAML, importStylesYAML, importPlacesYAML, importOrgsYAML, importSourcesYAML, createCYJS, writeJSON, updateSources, resolveName};



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
