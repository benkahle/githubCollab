var fs = require('fs');
var vertices = JSON.parse(fs.readFileSync("./collabsByPerson.json", "utf-8"));
var dijk = require("./dijk");

var names = Object.keys(vertices);

names.forEach(name => {
  Object.keys(vertices[name]).forEach(linkedName => {
    if (names.indexOf(linkedName) === -1) {
      names.push(linkedName);
    }
  });
});

var length = names.length;

var checked = {};

var longestPath = 0;
var count = 0;
names.forEach(name => {
  console.log(count+"/"+length);
  count += 1;
  names.forEach(otherName => {
    if (name !== otherName && !checked[name+","+otherName] && !checked[otherName+","+name]) {
      checked[name+","+otherName] = true;
      var path = dijk(name, otherName, vertices);
      if (path) {
        if (path.length > longestPath) {
          longestPath = path.length;
        }
      }
    }
  });
});

console.log(longestPath);
