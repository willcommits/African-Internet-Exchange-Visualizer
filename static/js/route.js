//This class defines the path routing algorith anbd functions that can be used to fillup a tbable on the links connect together with a function to find thise links
export class route {
    findShortestPathBFS(start, end, links) {
        let visited = new Set();
        let queue = [[start, []]];  // Queue for BFS, each element is [current_node, path_to_current_node]

        while (queue.length > 0) {
            let [currentNode, path] = queue.shift();

            // If this node is the destination
            if (currentNode === end) {
                return [...path, end];
            }

            // Mark the node as visited
            visited.add(currentNode);

            // Add neighbors to the queue
            const neighbors = links.filter(link => link.source.id === currentNode || link.target.id === currentNode)
                .map(link => link.source.id === currentNode ? link.target.id : link.source.id);

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);  // Mark as visited before pushing into queue to avoid duplicate processing
                    queue.push([neighbor, [...path, currentNode]]);
                }
            }
        }

        return null;  // Return null if no path exists
    }

    //This method when given an array of Nodes link will return their Links from the Link array
    //This is utilised in filling up the table
    findPathLinks(pathArray, linksArray) {
        //Create dumy Links from the path
        const pathLinks = pathArray.slice(0, -1).map((nodeID, index) => {
            return {
                source: { id: nodeID },
                target: { id: pathArray[index + 1] }
            };
        })

        //Filter from the Large Links to get the desired links
        const results = linksArray.filter(link =>
            pathLinks.some(pathLink =>
                (pathLink.source.id === link.source.id && pathLink.target.id === link.target.id) ||
                (pathLink.target.id === link.source.id && pathLink.source.id === link.target.id)
            )
        )

        //return the Result array of Links
        return results
    }

    //This method is used to fill up a Three column Table in html
    //it will create the Rows as the table fills up
    fillUpTable(TableElementID, pathLinks) {
        const tbody = document.getElementById(TableElementID);
        tbody.innerHTML = '';
        //Looop Through each pathLink Array to fill up the table
        pathLinks.forEach(link => {
            const tr = document.createElement('tr');

            const sourceTd = document.createElement('td');
            sourceTd.textContent = link.source.id;
            tr.appendChild(sourceTd);

            //Target(destination Location)
            const targetTd = document.createElement('td');
            targetTd.textContent = link.target.id;
            tr.appendChild(targetTd);

            //Link type
            const typeTd = document.createElement('td');
            typeTd.textContent = link.type;
            tr.appendChild(typeTd);

            //Apped row to the Table
            tbody.appendChild(tr);
        })
    }
}