import { NationalAS } from './classes.js';
import { asLink } from './classes.js';
import { Graph } from './classes.js';
import { route } from './route.js';
import { saveJSON } from './saveJSON.js'
// In newMain.js
import { SelectedCountry } from './SimulateASmap.js';
//Import the routing file

let simulation;
let selectedNode = null;
let selectedNodes = [];
let Route = new route()
let globalNodes = []

let nodesAS = [];
let links = [];
//Create the graphData ot hold the links and the AS
const graphData = {
    nodes: [],
    links: []
};


//The dynamic Global Max
let MaxDegree = 0;

//Listens to the Event 'country' for when a country is selected.
document.addEventListener("country", function () {
    graphData.nodes.length = 0;
    graphData.links.length = 0;
    nodesAS.length = 0;
    links.length = 0;
    globalNodes = []
    console.log("Country Clicked")
    $.ajax({
        url: '/NationalView',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 'name': SelectedCountry }
        ),
        success: function (response) {
            globalNodes = response
            const graph = new Graph();
            //Create the Objects
            globalNodes.forEach(AS => {
                const ASnode = new NationalAS(AS.asn, AS.name, AS.ConeSize, AS.customerSize, AS.providerSize, AS.peerSize, AS.siblingSize)
                nodesAS.push(ASnode)
                //Add the node to the grpah for all the algorithms
                graph.addNode(ASnode)
                //Egt the Nodes's Customers
                if (AS.customers || AS.customers != []) {
                    AS.customers.forEach(customer => {
                        const customerNode = new NationalAS(customer)
                        graph.addLink(ASnode, customerNode)
                        //Add the neighbor
                        //ASnode.addNeighbor(Cus)
                        //Create a link class for the Drawing Data
                        links.push(new asLink(ASnode, customerNode, "P2C"));
                    })
                }
                if (AS.siblings || AS.siblings != []) {
                    AS.siblings.forEach(sibling => {
                        const siblingNode = new NationalAS(sibling)
                        graph.addLink(ASnode, siblingNode)
                        //Add the neighbor
                        //ASnode.addNeighbor(Peer)
                        //Create a link class for the Drawing Data
                        links.push(new asLink(ASnode, siblingNode, "S2S"));
                    })
                }
                if (AS.peers || AS.peers != []) {
                    AS.peers.forEach(peer => {
                        const PeerNode = new NationalAS(peer)
                        graph.addLink(ASnode, PeerNode)
                        //Add the neighbor
                        //ASnode.addNeighbor(Peer)
                        links.push(new asLink(ASnode, PeerNode, "P2P"));
                    })
                }

            })
            fetchCountryData(SelectedCountry, "none", 0, 20000)
        }

    })
});

let relations = "none"
let count = 0
//declare the Min and Max values
let minV = document.getElementById("min-value")
let maxV = document.getElementById("max-value")

//Configure Slider Details
function setSlider(element, max, value) {
    element.setAttribute("max", max);
    element.setAttribute("value", value);
}
function processRange(min, max, relation) {
    //check if the are passing each other to swap them
    if (min > max) {
        let temp = max
        max = min
        min = temp
    }
    //Set the Min MAx value to the HTML
    minV.innerHTML = min;
    maxV.innerHTML = max;
    //Fetch Witht the New Range
    fetchCountryData(SelectedCountry, relation, min, max)
    setSlider(minV, 0, MaxDegree)
    setSlider(minV, 0, MaxDegree)
}
//Input
const Input = document.querySelectorAll(".range-slider input")

Input.forEach((element) => {
    element.addEventListener("change", (e) => {
        let Min = parseInt(Input[0].value)
        let Max = parseInt(Input[1].value);

        //Swap and Update
        processRange(Min, Max, relations)
    })
})



//Download button event listener
document.getElementById('downloadBtn').addEventListener('click', function () {
    saveJSON(graphData, SelectedCountry);
    //Response to the User
    const p = document.getElementById('timedParagraph');
    p.innerText = `The File has been save in downloads as ${SelectedCountry}.json`
    setTimeout(function () {
        p.innerText = ""

    }, 2000)

});

function fetchCountryData(country, relations, minDegree, maxDegree) {
    //Clear Canva simulation
    createGraphData(nodesAS, links, relations, minDegree, maxDegree, () => {
        draw(graphData);
    })
}


function createGraphData(asData, linkData, relations, minDegree, maxDegree, callback) {
    //Clear the GraphData
    graphData.nodes.length = 0;
    graphData.links.length = 0;
    asData.forEach(asNode => {
        //get Nodes data into the graphData
        graphData.nodes.push(asNode.toObject())
    });
    linkData.forEach(link => {
        //get link data into the graphData
        graphData.links.push(link.toObject());
    });

    //Filter bases on the Range Details
    graphData.nodes = graphData.nodes.filter(node =>
        node.coneSize >= minDegree && node.coneSize < maxDegree
    );
    graphData.links = graphData.links.filter(link =>
        graphData.nodes.some(node => node.id === link.source) &&
        graphData.nodes.some(node => node.id === link.target)
    );

    const remainingNodeIds = new Set();
    //Filter for the Links

    //draw after processing al the filters and graph data
    callback()
}

function draw(graphData) {
    //Clear simulation Canva
    if (simulation) {
        simulation.stop();  // Stop the existing simulation if there's one
    }
    //Clear routing Table
    const tbody = document.getElementById("pathDetails");
    tbody.innerHTML = '';
    d3.selectAll(".network").selectAll("*").remove();
    console.log("Draw function called", graphData);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const svg = d3.selectAll(".network");

    // const width = +svg.attr("width");
    // const height = +svg.attr("height");

    const zoomed = () => {
        const { transform } = d3.event;
        svg.selectAll('g').attr("transform", transform);
    };

    const zoom = d3.zoom()
        .scaleExtent([0.15, 5]) // This limits the zoom out at 0.5x and the zoom in at 5x
        .on("zoom", zoomed);

    svg.call(zoom);

    simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide().radius(function (d) {
            return nodeRadius(d) + 5; // +5 for some padding
        }))

        .force("center", d3.forceCenter(400, 300));

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graphData.links)
        .enter().append("line")
        .attr("class", "link")
        //.attr("stroke", "red");
        .attr("stroke", d => linkColor(d.type));

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", nodeRadius)
        .attr("fill", "#415e73");

    const label = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("class", "label")
        .text(d => d.id)
        .style("font-size", "10px"); // Only show labels for IXP nodes initially

    node.on("click", function (d) {
        // Reset the previous highlighted nodes and links
        node.style("fill", "#415e73");
        node.style("opacity", 1);
        node.style("stroke-width", "0px");
        link.style("stroke", d => linkColor(d.type));
        //Write the Node Id to the Source Details(ID) 
        document.getElementById("pathSource").innerText = d.id;
        document.getElementById("pathDestination").innerText = "______";
        selectedNode = d;
        // Add this node to the list of selected nodes
        selectedNodes.push(d.id);

        //Add a stroke to the selected Node for highlighting
        d3.select(this)
            .style("opacity", 1)
            .attr("fill", d => color(d.group))
            .style("stroke", "#17255A")
            .style("stroke-width", "2px");
        //when two Nodes have been Created
        if (selectedNodes.length === 2) {
            const [start, end] = selectedNodes;
            //Write the Node Id to the Source Details(ID) and the Destinations 
            document.getElementById("pathSource").innerText = start;
            document.getElementById("pathDestination").innerText = end;
            // Find the path between the selected nodes
            const path = Route.findShortestPathBFS(start, end, graphData.links);
            console.log(path)
            if (path) {
                //process the Path links
                const pathLinks = Route.findPathLinks(path, graphData.links)
                //Fill up the Table
                Route.fillUpTable("pathDetails", pathLinks)
                document.getElementById("message").innerText = "Nodes Are Connected";
                document.getElementById("message").style.color = "green";
                // Highlight the nodes in the path
                node.filter(n => path.includes(n.id)).style("fill", "green");
                //Dim other Nodes and Hide the Links and labels
                node.filter(n => !path.includes(n.id) && n.id !== d.id)
                    .style("opacity", 0.3)
                    .attr("fill", "grey");
                link.style("stroke", "white")
                // Highlight the links in the path
                link.filter(l => {
                    //Filter the Links involved in the Path
                    for (let i = 0; i < path.length - 1; i++) {
                        if ((l.source.id === path[i] && l.target.id === path[i + 1]) ||
                            (l.source.id === path[i + 1] && l.target.id === path[i])) {
                            return true;
                        }
                    }
                    return false;
                }).style("stroke", "green");
            } else {
                document.getElementById("message").innerText = "Nodes Are Not Connected";
                document.getElementById("message").style.color = "red";
            }

            // Clear the list of selected nodes
            selectedNodes = [];
        }
        populateCardWithData(d)
    });
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

    function nodeRadius(d) {
        return d.count ? 25 : 20;
    }
    function linkColor(type) {
        switch (type) {
            case "P2P":
                return "blue";
            case "P2C":
                return "red";
            case "S2S":
                return "green";
            default:
                return "grey";
        }
    }

    function ticked() {
        link
            .attr("x1", d => d.source.x ? d.source.x : 0)
            .attr("y1", d => d.source.y ? d.source.y : 0)
            .attr("x2", d => d.target.x ? d.target.x : 0)
            .attr("y2", d => d.target.y ? d.target.y : 0);

        node
            .attr("cx", d => d.x ? d.x : 0)
            .attr("cy", d => d.y ? d.y : 0);

        label
            .attr("x", d => d.x ? d.x : 0)
            .attr("y", d => d.y ? d.y : 0);
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }


    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }


    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

}
//method to populate the NodeAS details
function populateCardWithData(data) {
    document.getElementById("name").innerText = data.name || "-";
    document.getElementById("asn").innerText = data.id || "-";  // fixed the ID reference
    document.getElementById("rank").innerText = data.rank || "-";
    document.getElementById("customers").innerText = data.CustomerCount || 0;
    document.getElementById("providers").innerText = data.ProviderCount || 0;
    document.getElementById("siblings").innerText = data.SiblingCount || 0;
    document.getElementById("total").innerText = data.coneSize || 0;
    document.getElementById("peers").innerText = data.PeerCount || 0;
}


document.getElementById("deleteNodeBtn").addEventListener('click', function () {
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
// Add an event listener to your save button
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
    console.log("graph data", graphData)
    draw(graphData);

}


document.getElementById("saveNodeBtn").addEventListener('click', function (e) {
    e.preventDefault(); // To prevent the form from submitting if it does so
    updateSelectedNodeDetails();
});


// Add this function to create a new node based on form inputs
function createNode() {
    console.log("Something is off")
    const asn = document.getElementById("asnX");
    const name = document.getElementById("nameX");
    const coneSize = document.getElementById("coneSize");
    const country = document.getElementById("countryX");

    //Validate the coneSIze integer
    if (!Number.isInteger(Number(coneSize.value)) || Number(coneSize.value) < 0) {

        alert("Enter Valid Integer in coneSize")
        return
    }
    if (!asn.value || !name.value || !coneSize.value) {
        alert("Please fill in all required fields.");
        return;
    }
    //Create the node object
    const ASnode = new NationalAS(parseInt(asn.value), name.value, parseInt(coneSize.value), 0, 0, 0, 0)
    nodesAS.push(ASnode)
    //Add the node to the grpah for all the algorithms
    fetchCountryData(SelectedCountry, "none", 0, 20000)

}

// Add event listener for the 'Create Node' button
document.getElementById("createNodeBtn").addEventListener('click', function () {
    createNode();
});


//Link Nodes
// Add this code inside your DOMContentLoaded event or at the end of your script
document.addEventListener("DOMContentLoaded", function () {
    document.querySelector('.AddSource').addEventListener('click', addSource);
    document.querySelector('.AddDestination').addEventListener('click', addDestination);
    document.querySelector('.createlink').addEventListener('click', createLink);
    document.querySelector('.AddRemoveSource').addEventListener('click', addSource);
    document.querySelector('.AddRemoveDestination').addEventListener('click', addDestination);
    document.querySelector('.removeLinkBtn').addEventListener('click', createLink);


});

// Declare your function as usual, or modify it according to your requirements
function addSource() {
    if (selectedNode) {
        const sourceInput = document.getElementById("source");
        sourceInput.value = selectedNode.id;
    } else {
        alert("Please select a source node first.");
    }
}

function addDestination() {
    if (selectedNode) {
        const destinationInput = document.getElementById("destination");
        destinationInput.value = selectedNode.id;
    } else {
        alert("Please select a destination node first.");
    }
}


function createLink() {
    event.preventDefault();
    const sourceInput = document.getElementById("source").value;
    const destinationInput = document.getElementById("destination").value;
    const selectElement = document.getElementById('linktype').value;


    if (sourceInput && destinationInput && selectElement) {
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
        //Find the source Node in NodesAS
        const source = nodesAS.find(
            node => node.id === parseInt(sourceInput)
        );
        const target = nodesAS.find(
            node => node.id === parseInt(destinationInput)
        );
        if (source && target) {
            links.push(new asLink(source, target, selectElement))
        }
        //fetchCountryData(SelectedCountry, "none", 0, 20000)
    } else {
        alert("Please specify both source and destination.");
    }
}


function addRemoveSource() {
    if (selectedNode) {
        const removeSourceInput = document.getElementById("removeSource");
        removeSourceInput.value = selectedNode.id;
    } else {
        alert("Please select a source node first.");
    }
}

function addRemoveDestination() {
    if (selectedNode) {
        const removeDestinationInput = document.getElementById("removeDestination");
        removeDestinationInput.value = selectedNode.id;
    } else {
        alert("Please select a destination node first.");
    }
}

function removeLink(event) {
    event.preventDefault();

    const SourceI = parseInt(document.getElementById("removeSource").value);
    const DestinationI = parseInt(document.getElementById("removeDestination").value);

    if (SourceI && DestinationI) {
        const linkToRemove = links.find(link => 
            (link.source.id === SourceI && link.target.id === DestinationI) || 
            (link.source.id === DestinationI && link.target.id === SourceI)
        );
        //Remove the Link require
        if (linkToRemove) {
            links = links.filter(link=> link!== linkToRemove)
        }
        // Re-draw the graph
        fetchCountryData(SelectedCountry, "none", 0, 20000)
    } else {
        alert("Please specify both source and destination.");
    }
}




// To set the event listener to your buttons
document.querySelector(".AddRemoveSource").addEventListener("click", addRemoveSource);
document.querySelector(".AddRemoveDestination").addEventListener("click", addRemoveDestination);
document.querySelector(".removeLinkBtn").addEventListener("click", removeLink);




