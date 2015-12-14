var fs = require('fs');
var storedCollabsByPersonFile = "./collabsByPerson.json";
var initVertices = JSON.parse(fs.readFileSync(storedCollabsByPersonFile, 'utf8'));

var args = process.argv.slice(2);
var source = args[0];
var target = args[1];
bellmanFord = function (source, target, vertices){

	var cycles = false;
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

	for(var i=0; i<Object.keys(vertices).length-1; i++){
		Object.keys(vertices).forEach((currentVertex)=>{
			//store edges before deleting object
			var currentEdges = vertices[currentVertex];
			//find new shortest paths to all neighboring vertices if available
			Object.keys(currentEdges).forEach((neighbor) => {
				var testDist = (-1.0/currentEdges[neighbor])+dists[currentVertex];
				if(testDist < dists[neighbor]){
					prev[neighbor] = currentVertex;
					dists[neighbor] = testDist;
				}
			});
		})
	}
	//prepend the target to the list
	currentVertex = target;
	path.unshift(currentVertex);
	// console.log(prev);
	while(prev[currentVertex] != source){
		// console.log("VERTEX:",currentVertex);
		// console.log("PREV:",prev[currentVertex]);
		//preprend prev to list and set new current to be the previous
		if(path.indexOf(prev[currentVertex])==-1){
			path.unshift(prev[currentVertex])
			currentVertex = prev[currentVertex]
		} else{
			// console.log("CYCLE IS:",currentVertex, "to", prev[currentVertex]);
			// console.log(vertices[prev[currentVertex]][currentVertex]);
			delete vertices[prev[currentVertex]][currentVertex] //= -10;
			// console.log(vertices[currentVertex][prev[currentVertex]]);
			cycles = true;
			break
		}
	}
	if(!cycles){
		path.unshift(source)
		return path;
	} else {
		// console.log("RECURRRRRRRR")
		return bellmanFord(source, target, vertices)
	}
}
console.log(bellmanFord(source, target, initVertices))
module.exports = bellmanFord;
