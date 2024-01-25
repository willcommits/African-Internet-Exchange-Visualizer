import { AS } from './classes.js';
import { IXP } from './classes.js';
import { Link } from './classes.js';
import { saveJSON } from './saveJSON.js'
import { SelectedIXPname } from './SimulateIXPMap.js';

let simulation;

let selectedNode = null; 
document.addEventListener("countrySelected", function() {
  fetchData(SelectedIXPname)
});

const nodesIXP = [];
const nodesAS = [];
const links = [];

const graphData = {
    nodes: [],
    links: []
};
 /** This function will fetch data From the Database and Create classes
and create nodes with that Data**/
function fetchData(name) {
       // Clear previous data
       graphData.nodes.length = 0;
       graphData.links.length = 0;
       nodesIXP.length = 0;
       nodesAS.length = 0;
       links.length = 0;
    $.ajax({
        url: '/IXPinfo',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 'name': name }),
        success: function (response) {
            response.forEach(ixp => {
                const ixpNode = new IXP(ixp);
                nodesIXP.push(ixpNode);
               
                if (ixp.as_info != "") {
                    ixp.as_info.forEach(asInfo => {
                        const asInfoNode = new AS(asInfo);
                        nodesAS.push(asInfoNode);
                        //add the As Node to the IXP AS list
                        ixpNode.addAS(asInfoNode);
                        //add the IXP node to the IXP list
                        asInfoNode.addIXP(ixpNode);
                        //Create a link class for the new IXP-AS relationship
                        links.push(new Link(ixpNode, asInfoNode));
                    });
                }

            });
            createGraphData(nodesIXP,nodesAS,links)
            draw(graphData)
        }
    });

}
//This event listener is added to the button with the ID 'downloadBtn'.
document.getElementById('downloadBtn').addEventListener('click', function () {
    saveJSON(graphData, SelectedIXPname);
    const p = document.getElementById('timedParagraph');
    p.innerText = `The File has been save in downloads as ${SelectedIXPname}.json`
    setTimeout(function () {
        p.innerText = ""
    }, 2000)

});
/** This function will create the Graph data for drawing
    will manipulte the graphData dictionary*/  
function createGraphData(ixpData, asData, linkData) {
  
    ixpData.forEach(ixpNode=> {
        graphData.nodes.push({
            id: ixpNode.id,
            name: ixpNode.name,
            city: ixpNode.city,
            country: ixpNode.country,
            netCount: ixpNode.net_count,
            website: ixpNode.website,
            status: ixpNode.status,
            group: 'IXP', 
        });
    });

    // Add AS nodes
    asData.forEach(asNode  => {
        graphData.nodes.push({
            id: asNode.id,
            asn: asNode.ans,
            name: asNode.name,
            city: asNode.city,
            country: asNode.country,
            netCount: asNode.info_traffic,
            website: asNode.website,
            status: asNode.status,
            group: 'AS', // Set the group based on your criteria

            // Add other properties as needed
        });
    });

    // Add links
    linkData.forEach(link => {
        graphData.links.push({
            source: link.source.id,
            target: link.target.id,

            // Add other properties as needed
        });
    });
}
/**
 * The 'draw' function visualizes the network graph based on the provided 'graphData'.
 * It initializes and sets up the graph layout, styles, interactions, and behavior,
 * handles user interactions like clicking, dragging, and zooming on nodes and links,
 * and dynamically updates the graph visualization when data changes (e.g. adding/removing nodes or links).
 * If there is any previously drawn graph, it will be removed before drawing the new one.
 */
function draw(graphData) {
    if(simulation){
        simulation.stop();
    }
    d3.selectAll(".network").selectAll("*").remove();
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const svg = d3.selectAll(".network");
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const zoomed = () => {
        const { transform } = d3.event;
        svg.selectAll('g').attr("transform", transform);
    };

    const zoom = d3.zoom()
        .scaleExtent([0.5, 5]) 
        .on("zoom", zoomed);

    svg.call(zoom);
    /**
 * 'simulation' is responsible for calculating the position of each node and link in the graph over time.
 * It applies forces to the nodes and simulates the motion of the nodes as if they were physical objects.
 * - It can make nodes attract or repel each other.
 * - It positions linked nodes closer together.
 * - It ensures that nodes don’t overlap.
 * - It automatically moves and positions nodes in a way that visualizes the structure of the graph clearly.
 * The 'simulation' is repeatedly recalculated, and the graph is updated until the nodes settle into their final positions.
 **/

     simulation = d3.forceSimulation(graphData.nodes)
    .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(150))  
    .force("charge", d3.forceManyBody().strength(-400))  
    .force("collide", d3.forceCollide().radius(function (d) {
        return nodeRadius(d) + 5;
    }))
    .force("center", d3.forceCenter(400, 300));


    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graphData.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", 'grey')
        .style("opacity", 1);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", nodeRadius)
        .attr("fill", d => color(d.group))
        .style("opacity", 1)  
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const label = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("class", "label")
        .text(d => d.name)
        .style("font-size", "10px")
        .style("opacity", 1);
    node.on("mouseover", function (d) {
        let connectedNodes = graphData.links.filter(l => l.source === d || l.target === d).length;
        let [x, y] = d3.mouse(this);
        d3.select("#tooltip")
            .style("left", `${x}px`)
            .style("top", `${y - 30}px`)
            .style("visibility", "visible")
            .text(`Connected to ${connectedNodes} nodes`);
    });

    node.on("mouseout", function (d) {
        d3.select("#tooltip")
            .style("visibility", "hidden");
    });

    simulation
        .nodes(graphData.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graphData.links);

    
        node.on("click", function (d) {
            node.style("stroke", "none")
        .style("stroke-width", "0px");

            selectedNode = d;
            node.style("opacity", 1)
                .attr("fill", d => color(d.group));
            link.style("opacity", 1);
            label.style("opacity", 1);
            let connectedNodeIds = graphData.links
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .map(l => l.source.id === d.id ? l.target.id : l.source.id);
    
            node.filter(n => !connectedNodeIds.includes(n.id) && n.id !== d.id)
                .style("opacity", 0.3)
                .attr("fill", "grey");  
    
            link.filter(l => l.source.id !== d.id && l.target.id !== d.id)
                .style("opacity", 0.3);
    
            label.filter(l => !connectedNodeIds.includes(l.id) && l.id !== d.id)
                .style("opacity", 0.3);
            d3.select(this)
                .style("opacity", 1)
                .attr("fill", d => color(d.group))
                .style("stroke", "#17255A")
                .style("stroke-width", "2px");
    
            link.filter(l => l.source.id === d.id || l.target.id === d.id)
                .style("opacity", 1);
    
            label.filter(l => connectedNodeIds.includes(l.id) || l.id === d.id)
                .style("opacity", 1);
    
           
        });
    

    function nodeRadius(d) {
        return d.group === "IXP" ? 25 : 10;
    }

    /*** 'ticked' is a function that is called at each step (or 'tick') of the simulation.
 * It's responsible for updating the visual elements of the graph (nodes, links, etc.) 
 * to reflect the current state of the simulation. */
    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }
/***  is triggered when the user starts dragging a node.
 * - It 'wakes up' the simulation and sets it in motion again by adjusting the 'alphaTarget' of the simulation. */
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

/**
 * 'dragged' function is called continuously as the user moves the mouse after initiating a drag operation.
 * It's responsible for updating the fixed position ('fx', 'fy') of the dragged node to follow the mouse cursor, 
 * ensuring the node moves along with the cursor during the drag.
 */
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

/**
 * 'dragended' function is called once, when the user releases the mouse button, ending the drag operation.
 * It's responsible for releasing the fixed position ('fx', 'fy') of the dragged node,
 * allowing the simulation to take over and position the node based on the forces applied to it.
 */
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

}
/**Allows a user to be able to delete a node based on obtaining its ID from click */
document.getElementById("deleteNodeBtn").addEventListener('click', function() {
    if (selectedNode) {
        // Remove node
        graphData.nodes = graphData.nodes.filter(node => node.id !== selectedNode.id);

        // Remove links connected to the node
        graphData.links = graphData.links.filter(link => link.source.id !== selectedNode.id && link.target.id !== selectedNode.id);

        // Re-draw the graph
        draw(graphData);

        // Reset selectedNode
        selectedNode = null;
    } else {
        alert("No node selected to delete!");
    }
});
// allows the user to update information of the node based on input it has obtained from the forms
function updateSelectedNodeDetails() {
    if (selectedNode === null) {
        alert("Please select a node first.");
        return; 
    }
    d3.selectAll(".network").selectAll("*").remove();
    let nodeToUpdate = graphData.nodes.find(node => node.id === selectedNode.id);
if (nodeToUpdate) {
    nodeToUpdate.name = document.getElementById("Name").value;
    nodeToUpdate.website = document.getElementById("Website").value;
    nodeToUpdate.city = document.getElementById("City").value;
    nodeToUpdate.status = document.getElementById("Status").value;
}
draw(graphData);
}

//updates the details of the node to that of the form input on click
document.getElementById("saveNodeBtn").addEventListener('click', function(e) {
    e.preventDefault(); // To prevent the form from submitting if it does so
    updateSelectedNodeDetails();
});


// Add this function to create a new node based on form inputs
function createNode() {
    const nodeType = document.getElementById("nodeType").value;
    const name = document.getElementById("name").value;
    const website = document.getElementById("website").value;
    const city = document.getElementById("city").value;
    const status = document.getElementById("status").value;
  
    if (!nodeType || !name || !city || !status) {
      alert("Please fill in all required fields.");
      return;
    }
    const newId = Date.now().toString();
    const newNode = {
      id: newId,
      name: name,
      website: website,
      city: city,
      status: status,
      group: nodeType,  
    };
    graphData.nodes.push(newNode);
    draw(graphData);
  }
  
  // Add event listener for the 'Create Node' button
  document.getElementById("createNodeBtn").addEventListener('click', function() {
    createNode();
  });
  
 
//Creates event listeners for all the buttons
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.AddSource').addEventListener('click', addSource);
    document.querySelector('.AddDestination').addEventListener('click', addDestination);
    document.querySelector('.createlink').addEventListener('click', createLink);
    document.querySelector('.AddRemoveSource').addEventListener('click', addSource);
    document.querySelector('.AddRemoveDestination').addEventListener('click', addDestination);
    document.querySelector('.removelink').addEventListener('click', createLink);
    
   
});

// captures the id of the current clicked node and sets it as sourceinput
function addSource() {
    if (selectedNode) {
        const sourceInput = document.getElementById("source");
        sourceInput.value = selectedNode.id;
    } else {
        alert("Please select a source node first.");
    }
}
// captures the id of the current clicked node and sets it as destinationinput
function addDestination() {
    if (selectedNode) {
        const destinationInput = document.getElementById("destination");
        destinationInput.value = selectedNode.id;
    } else {
        alert("Please select a destination node first.");
    }
}

//creates the link between the nodes of the ID's marked as sourceinput and destinationinput
function createLink() {
    event.preventDefault();
    const sourceInput = document.getElementById("source").value;
    const destinationInput = document.getElementById("destination").value;
    if (sourceInput && destinationInput) {
        // Check if source and destination are the same
        if (sourceInput === destinationInput) {
            alert("Source and Destination nodes are the same. Please choose different nodes.");
            return;
        }
        // Check if link already exists
        const linkExists = graphData.links.some(link => 
            (link.source === sourceInput && link.target === destinationInput) ||
            (link.source === destinationInput && link.target === sourceInput)
        );
        if (linkExists) {
            alert("Link already exists between the selected nodes.");
            return;
        }
        // Add link to graph data
        graphData.links.push({
            source: sourceInput,
            target: destinationInput
        });
        // Re-draw the graph
        draw(graphData);
    } else {
        alert("Please specify both source and destination.");
    }
}

// captures the id of the current clicked node and sets it as removesourceinput
function addRemoveSource() {
  if (selectedNode) {
    const removeSourceInput = document.getElementById("removeSource");
    removeSourceInput.value = selectedNode.id;
  } else {
    alert("Please select a source node first.");
  }
}
// captures the id of the current clicked node and sets it as removedestinationinput
function addRemoveDestination() {
  if (selectedNode) {
    const removeDestinationInput = document.getElementById("removeDestination");
    removeDestinationInput.value = selectedNode.id;
  } else {
    alert("Please select a destination node first.");
  }
}
//removes the link between the nodes specified as the removesourceinput and removedestinationinput
function removeLink(event) {
    event.preventDefault();
    const removeSourceInput = document.getElementById("removeSource").value;
    const removeDestinationInput = document.getElementById("removeDestination").value;
    if (removeSourceInput && removeDestinationInput) {
      // Find the link index that needs to be removed
      const linkIndex = graphData.links.findIndex(link =>
        (link.source.id || link.source === removeSourceInput) && 
        (link.target.id || link.target === removeDestinationInput) ||
        (link.source.id || link.source === removeDestinationInput) && 
        (link.target.id || link.target === removeSourceInput)
      );
      if (linkIndex === -1) {
        alert("No link exists between the selected nodes.");
        return;
      }
      // Remove link from graph data
      graphData.links.splice(linkIndex, 1);
      // Re-draw the graph
      draw(graphData);
    } else {
      alert("Please specify both source and destination.");
    }
  }
  
  
  

// Sets the event listeners for all the buttons listed below
document.querySelector(".AddRemoveSource").addEventListener("click", addRemoveSource);
document.querySelector(".AddRemoveDestination").addEventListener("click", addRemoveDestination);
document.querySelector(".removeLinkBtn").addEventListener("click", removeLink);

  
  

