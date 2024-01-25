import { AS } from './classes.js';
import { IXP } from './classes.js';
import { Link } from './classes.js';
import { SelectedIXPname  } from './IXPmap.js';

let simulation;
let selectedNode = null; 
document.addEventListener("countrySelected", function () {
    fetchData(SelectedIXPname )
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
            
            createGraphData(nodesIXP, nodesAS, links)
            draw(graphData)
        }
    });

}
/** This function will create the Graph data for drawing
    will manipulte the graphData dictionary*/  
function createGraphData(ixpData, asData, linkData) {
    ixpData.forEach(ixpNode => {
        graphData.nodes.push({
            id: ixpNode.id,
            name: ixpNode.name,
            city: ixpNode.city,
            country: ixpNode.country,
            net_count: ixpNode.net_count,
            website: ixpNode.website,
            status: ixpNode.status,
            group: 'IXP', 
        });
    });

    // Add AS nodes
    asData.forEach(asNode => {
        graphData.nodes.push({
            id: asNode.id,
            asn: asNode.ans,
            name: asNode.name,
            city: asNode.city,
            country: asNode.country,
            net_count: asNode.info_traffic,
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
        .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(200))  
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

//sets the node radius of the different nodes on the screen
    function nodeRadius(d) {
        return d.group === "IXP" ? 25 : 10;
    }
//Populates the card to that of the current selected node
    function populateCardWithData(data) {
        document.getElementById("ixpname").innerText = data.name || "-";
        document.getElementById("ixpid").innerText = data.id || "-";  
        document.getElementById("ixpWebsite").innerText = data.website || "-";
        document.getElementById("ixpWebsite").href=data.website || "-";;
        document.getElementById("ixpNetCount").innerText = data.net_count || 0;
        document.getElementById("ixpCity").innerText = data.city || "-";
        document.getElementById("ixpStatus").innerText = data.status || "-";  
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
    draw(graphData);

}





