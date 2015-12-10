var fs = require('fs');
var storedCollabsByPersonFile = "./mockCollabsByPerson.json";

var args = process.argv.slice(2);
var source = args[0];
var target = args[1];

bellmanFord = function (source, target){
	var vertices = JSON.parse(fs.readFileSync(storedCollabsByPersonFile, 'utf8'));

	var dists = {};
	var prev = {}
	var path = []

	//Set inital distances to 1 assuming they are next to each other and set neighbor on shortest path from the source to undefined for all vertices
	Object.keys(vertices).forEach((key) => {
		dists[key] = Infinity;
		prev[key] = undefined;
	});

	//set distance from source to source to be 0
	dists[source] = 0;
	//start algorithm at the source
	//while vertices are still graph
	Object.keys(vertices).forEach((currentVertex)=>{
		//store edges before deleting object
		var currentEdges = vertices[currentVertex];

		//find new shortest paths to all neighboring vertices if available
		Object.keys(currentEdges).forEach((neighbor) => {
			var testDist = -(currentEdges[neighbor]+dists[currentVertex]);
			if(testDist > dists[neighbor] || dists[neighbor] === Infinity){
				prev[neighbor] = currentVertex;
				dists[neighbor] = testDist;
			}
		});
	})
	//prepend the target to the list
	path.unshift(currentVertex);
	while(prev[currentVertex] != undefined){
		//preprend prev to list and set new current to be the previous
		path.unshift(prev[currentVertex])
		currentVertex = prev[currentVertex]
	}
	return path;
}
console.log(bellmanFord(source, target))
module.exports = reverseDijk;
