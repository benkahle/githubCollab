var fs = require('fs');

var storedCollabsByPersonFile = "./collabsByPerson.json";
var graphFile = "./graph.json";
var collabObject = JSON.parse(fs.readFileSync(storedCollabsByPersonFile, "utf-8"));

// {
//   nodes: [
//     {
//       name: "ben",
//       group: 1
//     }
//   ],
//   links: [
//     {
//       source: 0, //index of node
//       target: 1,
//       value: 3
//     }
//   ]
// }

var names = Object.keys(collabObject);
var nodes = [];
var nodeIndices = {};
var links = [];

names.forEach(name => {
  var length = nodes.push({
    name: name,
    group: 1
  });
  nodeIndices[name] = length - 1;
});

names.forEach(name => {
  Object.keys(collabObject[name]).forEach(linkedName => {
    if (!nodeIndices[linkedName]) {
      var length = nodes.push({
        name: linkedName,
        group: 1
      });
      nodeIndices[linkedName] = length - 1;
    }
    links.push({
      source: nodeIndices[name],
      target: nodeIndices[linkedName],
      value: collabObject[name][linkedName]
    });
  });
});

var output = {
  nodes: nodes,
  links: links
};

fs.writeFileSync(graphFile, JSON.stringify(output));
