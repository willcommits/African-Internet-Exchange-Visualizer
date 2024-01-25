import { AS } from './classes.js';
import { IXP } from './classes.js';
import { Link } from './classes.js';

const nodesIXP = [];
const nodesAS = [];
const links = [];
let simulation;

let selectedNode = null;
const graphData = {
    nodes: [],
    links: []
};



document.addEventListener('DOMContentLoaded', function() {
    /**
 * This function is triggered when an HTML element with the id "DownloadJSON" is clicked.
 * Upon click, it creates a hidden input element simulating a file input, and restricts file selection to JSON files.
 * 
 * Once a user selects a file, it reads the file content and tries to parse it as JSON. 
 * After successful parsing, it checks if the JSON structure contains 'nodes' and 'links' properties.
 * If these properties are present, the function will update the 'graphData' object with the selected JSON file’s ‘nodes’ and ‘links’, and then redraws the graph.
 * 
 * If the JSON structure is not as expected or if the parsing fails, it alerts the user about the 'Invalid JSON structure.'
 *
 * This functionality could typically be used for applications where the user needs to upload JSON files that represent graph structures, such as network diagrams or mind maps.
 */
    document.getElementById("DownloadJSON").addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json'; // Only accept JSON files
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    try {
                        const jsonContent = JSON.parse(content);
                        // Assuming your JSON content has a nodes and links array structure similar to graphData
                        if (jsonContent.nodes && jsonContent.links) {
                            graphData.nodes = jsonContent.nodes;
                            graphData.links = jsonContent.links;
                            draw(graphData); // Update your graph
                        } else {
                            alert('Invalid JSON structure.');
                        }
                    } catch (error) {
                        alert('Invalid JSON Structure.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    });
//clears the connections with the data setting them to be empty and clears the svg
    document.getElementById("clear").addEventListener('click', function() {
        d3.selectAll(".network").selectAll("*").remove();
        graphData.nodes = []; 
        graphData.links = []; 
        if (simulation) simulation.restart(); 
    });
    
    
});

/**
 * The createGraphData function is intended to generate the necessary data for drawing a graph by manipulating the 'graphData' object. 
 * It takes three arguments: ixpData, asData, and linkData which represent the different nodes and links that need to be illustrated in the graph.
 * 
 * 1. ixpData represents the data points for IXP (Internet Exchange Point) nodes. 
 * 2. asData represents the data points for AS (Autonomous System) nodes.
 * 3. linkData represents the connections between the nodes.
 * 
 * This function goes through each data point in ixpData and asData, and creates corresponding node objects with relevant properties 
 * (id, name, city, country, netCount, website, status, and group) to push to the 'nodes' array of the 'graphData' object.
 * The 'group' property is statically assigned as 'IXP' or 'AS' based on the type of node being processed.
 **/
function createGraphData(ixpData, asData, linkData) {
    //This function will create the Grpah data for drawing
    //will manipulte the graphData dictionary
    ixpData.forEach(ixpNode=> {
        graphData.nodes.push({
            id: ixpNode.id,
            name: ixpNode.name,
            city: ixpNode.city,
            country: ixpNode.country,
            netCount: ixpNode.net_count,
            website: ixpNode.website,
            status: ixpNode.status,
            group: 'IXP', // Set the group based on your criteria
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
 * The draw function renders a graph visualization using D3.js based on the provided graphData object, which contains nodes and links.
 * If there is an ongoing simulation, it stops it before starting a new one.
 * It first clears any existing elements in the ".network" svg element, sets up zooming, color scales, and other required properties and variables.
 * 
 * The function then initializes a D3 force simulation to handle the positioning and interactions of nodes and links in the graph.
 * Nodes and links are appended to the svg as "circle" and "line" elements respectively, and are styled and set up with drag events and other interactions.**/
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
        .scaleExtent([0.5, 5]) // This limits the zoom out at 0.5x and the zoom in at 5x
        .on("zoom", zoomed);

    svg.call(zoom);

     simulation = d3.forceSimulation(graphData.nodes)
    .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(150))  // Set distance between linked nodes
    .force("charge", d3.forceManyBody().strength(-400))  // Set force strength
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
        .style("opacity", 1);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", nodeRadius)
        .attr("fill", d => color(d.group))
        .style("opacity", 1)  // Show all nodes, removing any IXP-only filtering
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
    
            // Reset the visibility and color of all nodes and links to make them fully visible
            node.style("opacity", 1)
                .attr("fill", d => color(d.group));
            link.style("opacity", 1);
            label.style("opacity", 1);
    
            // Compute IDs of nodes that are connected to the clicked node
            let connectedNodeIds = graphData.links
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .map(l => l.source.id === d.id ? l.target.id : l.source.id);
    
            // Dim nodes, links and labels that are not connected to the clicked node
            node.filter(n => !connectedNodeIds.includes(n.id) && n.id !== d.id)
                .style("opacity", 0.3)
                .attr("fill", "grey");  // Instead of making them transparent, set them to a dim color
    
            link.filter(l => l.source.id !== d.id && l.target.id !== d.id)
                .style("opacity", 0.3);
    
            label.filter(l => !connectedNodeIds.includes(l.id) && l.id !== d.id)
                .style("opacity", 0.3);
    
            // Highlight the clicked node
            d3.select(this)
                .style("opacity", 1)
                .attr("fill", d => color(d.group))
                .style("stroke", "#17255A")
                .style("stroke-width", "2px");
    
            // Highlight the links connected to the clicked node
            link.filter(l => l.source.id === d.id || l.target.id === d.id)
                .style("opacity", 1);
    
            // Highlight the labels of nodes connected to the clicked node
            label.filter(l => connectedNodeIds.includes(l.id) || l.id === d.id)
                .style("opacity", 1);
    
            populateCardWithData(d);
        });
    
    //sets the radius for the nodes

    function nodeRadius(d) {
        return d.group === "IXP" ? 25 : 10;
    }
//populates the display card with information
    function populateCardWithData(data) {
        document.getElementById("ixpname").innerText = data.name || "-";
        document.getElementById("ixpid").innerText = data.id || "-";  // fixed the ID reference
        document.getElementById("ixpWebsite").innerText = data.website || "-";
        
        // Assuming you want to display net_count as text, not a link:
        document.getElementById("ixpNetCount").innerText = parseInt(data.netCount) || 0; 
        
        document.getElementById("ixpCity").innerText = data.city || "-";
        document.getElementById("ixpStatus").innerText = data.status || "-";  // fixed case of status
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
// allows the user to update information of the node based on input it has obtained from the form
function updateSelectedNodeDetails() {
    if (selectedNode === null) {
        alert("Please select a node first.");
        return; // Exit the function early
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
  
  document.getElementById("createNodeBtn").addEventListener('click', function() {
    
    createNode();
  });
  
 
  
//Creates event listeners for all the buttons
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.AddSource').addEventListener('click', addSource);
    document.querySelector('.AddDestination').addEventListener('click', addDestination);
    document.querySelector('.createlink').addEventListener('click', createLink);
 
    
   
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



// Event listener to open file dialogue when "Import JSON" button is clicked
document.getElementById("importcsv").addEventListener('click', function() {
    document.getElementById('csvInput').click();
});
document.getElementById('csvInput').addEventListener('change', handleFiles, false);
/**
 * The handleFiles function is triggered when a file is chosen via the file input. It primarily deals with reading and parsing a selected CSV file.
 *
 * It takes an event object as a parameter, from which it extracts the selected file. If a file is selected, it creates a new FileReader object to read the file.
 * 
 * Once the file is read, the onload event of the FileReader object is triggered, and the content of the file is passed to a validation function validateCSV.
 * 
 * If validateCSV returns true, implying that the CSV file is of the correct type and format, the content is then passed to the parseCSV function, which is expected to parse the content of the CSV file accordingly.
 * 
 * If validateCSV returns false, indicating that the file is not a correctly formatted or typed CSV, an alert is shown to the user indicating "Incorrect CSV type."
 * 
 * Essentially, this function serves as a handler for file inputs, specifically focusing on reading, validating, and invoking parsing for CSV files.
 */
function handleFiles(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const content = evt.target.result;
            if (validateCSV(content)) {
                parseCSV(content);
            } else {
                alert("Incorrect CSV type.");
            }
        };
        reader.readAsText(file);
    }
}
/**
 * The validateCSV function validates the content of a CSV file based on specific criteria.
 * 
 * It takes a string representing the content of a CSV file and begins by splitting this string into an array of lines.
 * It expects at least two lines; one for headers and at least one for data, returning false if there's not at least one row of data.
 * 
 * The function then compares the headers from the first line of the file against a predefined list of required headers: ['Type', 'ID', 'Name', 'Website', 'City', 'Status', 'Source', 'Destination'].
 * 
 * The function returns true only if every required header is found within the file's headers, indicating that the CSV file has the correct structure and can be parsed accordingly.
 * If the CSV content does not meet the expected structure or is missing any of the required headers, the function returns false, indicating an incorrect CSV type.
 * 
 * This function ensures that only correctly formatted CSV files, conforming to the expected structure, proceed to the parsing stage, preventing issues related to unexpected or incorrect data structure.
 */
function validateCSV(csvContent) {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return false; // At least one row of data
    
    const headers = lines[0].split(',');
    const requiredHeaders = ['Type', 'ID', 'Name', 'Website', 'City', 'Status', 'Source', 'Destination'];
    return requiredHeaders.every(header => headers.includes(header));
}
/**
 * The parseCSV function is responsible for parsing the content of a validated CSV file to extract and structure the necessary data to render a graph.
 * 
 * It starts by splitting the CSV content into lines. It initializes a graphData object with empty nodes and links arrays to store the structured data.
 * 
 * The function then iterates over each line (excluding the header), starting from the second line (index 1), as the first line is assumed to be the header.
 * It splits each line into columns and assigns each column to a variable representing a property of a node or link.
 * 
 * If the type of the data row is 'IXP' or 'AS', it creates a new node object with the appropriate properties and pushes it to the nodes array in graphData.
 * If the source and destination columns are present, it creates a new link object and pushes it to the links array in graphData.
 * 
 * After processing all lines in the CSV content, it calls the draw function, passing the constructed graphData object to it, allowing for the visual rendering of the parsed graph data.
 * 
 * In essence, this function transforms the raw CSV content into a structured format suitable for graphical representation, ensuring the visualization reflects the input data accurately.
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const graphData = { nodes: [], links: [] };
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const type = cols[0];
        const id = cols[1];
        const name = cols[2];
        const website = cols[3];
        const city = cols[4];
        const status = cols[5];
        const source = cols[6];
        const destination = cols[7];

        if (type === 'IXP') graphData.nodes.push({ id, name, website, city, status, group: 'IXP' });
        if (type === 'AS') graphData.nodes.push({ id, name, website, city, status, group: 'AS' });
        if (source && destination) graphData.links.push({ source, target: destination });
    }
    draw(graphData);
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

  
  



  
  
