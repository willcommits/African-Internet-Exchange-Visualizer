//This class defines function to be used in saving the JSON file to the local directory
//Used in different views 
function saveJSON(graphData, fileName = "data.json") {
    //Chnage GraphData to other things
    let TempNodes = graphData.links.map(data=>({
        source: data.source.id,
        target: data.target.id
    }))

    graphData.links = TempNodes
    //JSON data string
    //Start with Nodes
    const jsonString = JSON.stringify(graphData, null, 2);

    //Create a blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
export { saveJSON };