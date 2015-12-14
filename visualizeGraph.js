var width = 1400 - 20,
    height = 900-40;

var margin = 20;

var color = d3.scale.category20();

var force = d3.layout.force()
    .linkDistance(20)
    .charge(-120)
    .gravity(0.2)
    .size([width, height]);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate("+margin+","+margin+")")
    .attr("class", "graph");
d3.json("https://raw.githubusercontent.com/benkahle/githubCollab/master/bdCollabsByPerson.json", function(error1, fullData) {
  if (error1) throw error1;
  d3.json("https://raw.githubusercontent.com/benkahle/githubCollab/master/graph.json", function(error2, graph) {
    if (error2) throw error2;

    // graph = {
    //   nodes: [
    //     {
    //       name: "ben"
    //     },
    //     {
    //       name: "austin"
    //     },
    //     {
    //       name: "nitya"
    //     },
    //     {
    //       name: "sean"
    //     }
    //   ],
    //   links: [
    //     {
    //       source: 0,
    //       target: 1,
    //       value: 1
    //     },
    //     {
    //       source: 1,
    //       target: 2,
    //       value: 10
    //     },
    //     {
    //       source: 1,
    //       target: 3,
    //       value: 25
    //     }
    //   ]
    // };

    var nodes = graph.nodes.slice(),
        links = graph.links.slice(),
        bilinks = [];

    var sourceList = document.getElementById("source");
    var targetList = document.getElementById("target");

    var nodesByName = {};

    nodes.forEach(function(node, i) {
      var option = document.createElement("option");
      option.value = node.name;
      option.text = node.name;
      sourceList.add(option);
      var option2 = option.cloneNode(true);
      targetList.add(option2);
    });

    force
        .nodes(nodes)
        .links(links)
        .start();

    var link = svg.selectAll(".link")
        // .data(bilinks)
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .style("stroke", function(d) {
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
        });

    var gnodes = svg.selectAll("g.gnode")
        .data(graph.nodes)
        .enter().append("g").classed("gnode", true);

    var node = gnodes.append("circle")
        .attr("class", "node")
        .attr("r", 4)
        .style("fill", function(d) {
          nodesByName[d.name] = d;
          return color(d.group);
        })
        .call(force.drag)
        .on("mouseover", fade(true)).on("mouseout", resetStyling);

    var labels = gnodes.append("text").text(function(d) { return d.name; });

    node.append("title")
        .text(function(d) { return d.name; });

    var linkedByIndex = {};
    graph.links.forEach(function(d) {
      linkedByIndex[d.source.index + "," + d.target.index] = d;
    });

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

    function fade(mouseover) {
      return function(d) {
        var opacity = 1;
        if (mouseover) {
          d3.select(this.parentElement).attr("class", "gnode-active");
          opacity = 0.1;
        } else {
          d3.select(this.parentElement).attr("class", "gnode");
          opacity = 1;
        }
        node.style("stroke-opacity", function(o) {
          var connectionWeight = isConnected(d, o).value;
          var thisOpacity = connectionWeight ? 1 : opacity;
          this.setAttribute('fill-opacity', thisOpacity);
          if (mouseover) {
            if (connectionWeight > 3) {
              d3.select(this.parentElement).attr("class", "gnode-connected");
            }
          } else {
            d3.select(this.parentElement).attr("class", "gnode");
          }
          return thisOpacity;
        });

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

    document.getElementById("run").onclick = function() {
      var type = document.querySelector('input[name="search-type"]:checked').value;
      var results = document.getElementById("results");
      results.textContent = "Searching....";
      var resultsList = [];
      var source = sourceList.value;
      var target = targetList.value;
      if (type === "shortest") {
        resultsList = dijk(source, target);
      } else {

      }
      var stringResults = "Path:\n\n"+resultsList.join("\n");
      results.textContent = stringResults;
      resetStyling();
      focusPath(resultsList);
    };

    document.getElementById("clear").onclick = function() {
      resetStyling();
    };

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
      });
    }

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
              .style("stroke-opacity", 1);
          }
        }
      });
    }

    function dijk(source, target){

    	var dists = {};
    	var prev = {}
    	var path = []
      var vertices = JSON.parse(JSON.stringify(fullData));
    	//Set inital distances to infinity (and beyond) and set neighbor on shortest path from the source to undefined for all vertices
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
  });
});
