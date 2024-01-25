import { NationalAS } from './classes.js';
import { asLink } from './classes.js';
import { Graph } from './classes.js';
import { route } from './route.js';
import { SelectedCountry } from './aSmap.js';

let simulation;
let selectedNode = null;
let selectedNodes = [];
let Route = new route()
let globalNodes = []
let originalLinks
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
            processRange(Input[0].value, Input[1].value)
            //Copy the Links
            originalLinks = [...links]
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
function processRange(min, max) {
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
    fetchCountryData(SelectedCountry, min, max)
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
        processRange(Min, Max,)
    })
})
//processRange(Input[0].value, Input[1].value)
//Create a handler for the Links CheckBoxes

function checkboxHandeler(element, relationsKey) {
    if (element) {
        element.addEventListener("change", function () {
            if (this.checked) {
                links = originalLinks.filter(link => link.type == relationsKey);
                processRange(Input[0].value, Input[1].value)
            }
            else {
                links = [...originalLinks];
                processRange(Input[0].value, Input[1].value)
            }
        });
    }
}
// //Now we Handle the Relationships
// //PeerToPeer relationship only
checkboxHandeler(document.querySelector(".p2p"),"P2P")
// //Provider to Customer relationships only
checkboxHandeler(document.querySelector(".p2c"),"P2C")
// //SiblingToSibling relationshsips only
checkboxHandeler(document.querySelector(".s2s"),"S2S")


function fetchCountryData(country, minDegree, maxDegree) {
    //Clear Canva simulation
    createGraphData(nodesAS, links, minDegree, maxDegree, () => {
        draw(graphData);
    })
}


function createGraphData(asData, linkData, minDegree, maxDegree, callback) {
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
    d3.selectAll(".countryview").selectAll("*").remove();
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const svg = d3.selectAll(".countryview");
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