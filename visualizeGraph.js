var width = 1400,
    height = 900;

var color = d3.scale.category20();

// Settings to configure d3 force-layout
var force = d3.layout.force()
  .linkDistance(20)
  .charge(-120)
  .gravity(0.5)
  .size([width, height]);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "graph");

// Get collaborator JSON data from our Github repository
d3.json("https://raw.githubusercontent.com/benkahle/githubCollab/master/bdCollabsByPerson.json",
  function(error1, fullData) {
  if (error1) {
    throw error1;
  }
  // Get collaborator JSON data in format for d3 from out Github repository
  d3.json("https://raw.githubusercontent.com/benkahle/githubCollab/master/graph.json",
  function(error2, graph) {
    if (error2) {
      throw error2;
    }

    var nodes = graph.nodes.slice(),
      links = graph.links.slice(),
      bilinks = [];

    var sourceList = document.getElementById("source");
    var targetList = document.getElementById("target");

    var nodesByName = {};

    // Get a list of all names in the graph
    var names = [];
    nodes.forEach(function(node, i) {
      names.push(node.name);
    });

    // Sort the names alphabeticly and add them to the drop down menus
    names.sort();
    names.forEach(function(name) {
      var option = document.createElement("option");
      option.value = name;
      option.text = name;
      sourceList.add(option);
      var option2 = option.cloneNode(true);
      targetList.add(option2);
    });

    // Start the d3 force-layout with our graph
    force
      .nodes(nodes)
      .links(links)
      .start();

    // Get a reference to links and append path elements
    var link = svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link");

    // Make a reference to node groups and append g elements
    var gnodes = svg.selectAll("g.gnode")
      .data(graph.nodes)
      .enter().append("g").classed("gnode", true);

    // Get a reference to all nodes, store them by name, and configure mouse effects
    var node = gnodes.append("circle")
      .attr("class", "node")
      .attr("r", 4)
      .style("i", function(d) {
        nodesByName[d.name] = d;
      })
      .call(force.drag)
      .on("mouseover", fade(true)).on("mouseout", resetStyling);

    // Add text labels to node groups
    var labels = gnodes.append("text").text(function(d) { return d.name; });
    // Add text labels on hover
    node.append("title").text(function(d) { return d.name; });

    // Style the nodes and links to highlight highly connected nodes more prominantly
    resetStyling();

    // Build reference from node indices to links
    var linkedByIndex = {};
    graph.links.forEach(function(d) {
      linkedByIndex[d.source.index + "," + d.target.index] = d;
    });

    // Utility function to get link if nodes are connected
    function isConnected(a, b) {
      if (linkedByIndex[a.index + "," + b.index]) {
        return linkedByIndex[a.index + "," + b.index];
      } else if (linkedByIndex[b.index + "," + a.index]) {
        return linkedByIndex[b.index + "," + a.index];
      } else if (a.index === b.index) {
        return {value: 1};
      } else {
        return 0;
      }
    }

    // Mouse over effect
    function fade(mouseover) {
      return function(d) {
        var opacity = 1;
        if (mouseover) {
          opacity = 0.1;
        }
        node.style("stroke-opacity", function(o) {
          var connectionWeight = isConnected(d, o).value;
          var thisOpacity = connectionWeight ? 1 : opacity;
          this.setAttribute('fill-opacity', thisOpacity);
          if (mouseover) {
            if (connectionWeight > 3) {
              d3.select(this.parentElement).attr("class", "gnode-connected");
            } else if (connectionWeight > 0) {
              d3.select(this.parentElement).attr("class", "gnode-linked");
            }
          } else {
            d3.select(this.parentElement).attr("class", "gnode");
          }
          return thisOpacity;
        });

        if (mouseover) {
          d3.select(this.parentElement).attr("class", "gnode-active");
        } else {
          d3.select(this.parentElement).attr("class", "gnode");
        }

        link.style("opacity", function(o) {
          var thisOpacity;
          if (o.source === d || o.target === d) {
            if (o.value >= 5) {
              thisOpacity = 1;
            } else {
              thisOpacity = o.value/3;
            }
          } else {
            thisOpacity = opacity;
          }
          return thisOpacity;
        });
      };
    }

    // Update the graph position when d3 force-layout calculates a new timestep
    force.on("tick", function() {
      link.attr("d", function(d) {
        return "M"+d.source.x+","+d.source.y + " "+d.target.x+","+d.target.y;
      });
      gnodes.attr("transform", function(d) {
        if (d.x > width) {
          d.x = width;
        }
        if (d.x < 0) {
          d.x = 0;
        }
        if (d.y > height) {
          d.y = height;
        }
        if (d.y < 0) {
          d.y = 0;
        }
        return "translate(" + d.x + "," + d.y + ")";
      });
    });

    // Click handler for "Find Path" button
    document.getElementById("run").onclick = function() {
      var type = document.querySelector('input[name="search-type"]:checked').value;
      var results = document.getElementById("results");
      results.textContent = "Searching....";
      var resultsList = [];
      var source = sourceList.value;
      var target = targetList.value;
      // Run shortest path or longest path algorithm
      if (type === "shortest") {
        resultsList = dijk(source, target);
      } else {
        resultsList = bellmanFord(source, target, JSON.parse(JSON.stringify(fullData)));
      }
      resetStyling();
      var stringResults;
      // If a path is found, show links on side bar and highlight nodes and links in graph
      if (resultsList.length > 0) {
        stringResults = "Path: (Length: "+resultsList.length+")\n\n"+resultsList.join("\n");
        focusPath(resultsList);
      } else {
        stringResults = "No path found";
      }
      results.textContent = stringResults;
    };

    // Reset styling on "Clear" button click
    document.getElementById("clear").onclick = function() {
      resetStyling();
    };

    // Function to style graph highlighting highly connected nodes
    function resetStyling() {
      node.style("stroke-opacity", function(o) {
        d3.select(this.parentElement).attr("class", "gnode");
        return 1;
      }).style("fill-opacity", 1);
      link.style("stroke", function(d) {
        d3.select(this).attr("class", "link");
        var colors = [
          "#0002ff",
          "#0064ff",
          "#00a4ff",
          "#00ffd0",
          "#00ff36",
          "#65ff00",
          "#b0ff00",
          "#fdff00",
          "#FFf000",
          "#FFb400",
          "#FFa000",
          "#FF8c00",
          "#FF7800",
          "#FF6400",
          "#FF5000",
          "#FF3c00",
          "#FF2800",
          "#FF2800",
          "#FF1400",
          "#FF0000",
          "#FF0000",
          "#FF0050",
          "#FF0050",
          "#FF0050",
          "#FF0050",
          "#FF0050",
          "#FF0050",
          "#FF0050",
        ];
        return colors[d.value];
      })
      .style("opacity", function(d) {
        if (d.value > 4) {
          return 1;
        } else if (d.value > 2) {
          return d.value/5; //3/5 (.6) or 4/5 (.8)
        } else if (d.value === 2){
          return d.value/6; //2/6 (.3)
        } else {
          return 0.2; //(.2)
        }
      })
      .style("stroke-width", function(d) {
        var base = 3;
        if (d.value > 4) {
          return 1*base+"px";
        } else if (d.value > 2) {
          return (d.value/5)*base+"px"; //3/5 (.6) or 4/5 (.8)
        } else if (d.value === 2){
          return (d.value/6)*base+"px"; //2/6 (.3)
        } else {
          return 0.2*base+"px"; //(.2)
        }
      });
    }

    // Function to highlight a path of nodes and links
    function focusPath(pathList) {
      node.style("stroke", function(o) {
        if (pathList.indexOf(o.name) !== -1) {
          d3.select(this.parentElement).attr("class", "gnode-connected");
        }
      });
      link.style("stroke", function(l) {
        for (var i = 0; i < pathList.length-1; i++) {
          var link = isConnected(nodesByName[pathList[i]], nodesByName[pathList[i+1]]);
          if (l === link) {
            d3.select(this).attr("class", "connected-link")
              .style("opacity", 1)
              .style("stroke-opacity", 1)
              .style("stroke-width", "2px");
          }
        }
      });
    }

    // Bellman-Ford Algorithm modified for longest path with dynamic cycling pruning
    function bellmanFord(source, target, vertices) {
    	var cycles = false;
    	var dists = {};
    	var prev = {};
    	var path = [];
    	//Set inital distances to 1 assuming they are next to each other and set
      //neighbor on shortest path from the source to undefined for all vertices
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
    		console.log("Found a cycle with path length", path.length);
    		return bellmanFord(source, target, vertices)
    	}
    }

    // Dijkstra's Algorithm for shortest path finding
    function dijk(source, target){
    	var dists = {};
    	var prev = {};
    	var path = [];
      var vertices = JSON.parse(JSON.stringify(fullData));
    	//Set inital distances to infinity (and beyond) and set neighbor on shortest path from the
      //source to undefined for all vertices
    	Object.keys(vertices).forEach((key) => {
    		dists[key] = Infinity;
    		prev[key] = undefined;
    	});

    	//set distance from source to source to be 0
    	dists[source] = 0;
    	//start algorithm at the source
    	var currentVertex = source;
    	//while vertices are still graph
    	while (Object.keys(vertices).length >0){
    		//preset minDistance not visted yet to infinity
    		var minDist = Infinity;
    		//find unvisited node with minimum distance from source
    		Object.keys(vertices).forEach((vertex) =>{
    			var vertDist = dists[vertex];
    			if(dists[vertex] < minDist) {
    				minDist = dists[vertex];
    				currentVertex = vertex;
    			}
    		});

    		//store edges before deleting object
    		var currentEdges = vertices[currentVertex];
    		//delete the current vertex from graph because we have now visited it
    		delete vertices[currentVertex];

        // If no more edges, no path is possible
        if (!currentEdges) {
          return [];
        } else {
          //find new shortest paths to all neighboring vertices if available
          Object.keys(currentEdges).forEach((neighbor) => {
            var testDist = currentEdges[neighbor]+dists[currentVertex];
            if(testDist < dists[neighbor]){
              prev[neighbor] = currentVertex;
              dists[neighbor] = testDist;
            }
          });

          //if our current vertex is the target, go down the prev tree to find the whole path
          if(currentVertex === target){
            //prepend the target to the list
            path.unshift(currentVertex);
            while(prev[currentVertex] != undefined){
              //preprend prev to list and set new current to be the previous
              path.unshift(prev[currentVertex])
              currentVertex = prev[currentVertex]
            }
            return path;
          }
        }
    	}
    }
  });
});
