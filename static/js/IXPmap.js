// Configuration parameters
export let SelectedIXPname = "";
mapboxgl.accessToken = 'pk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNsbTN4YXo5djE0Z3Yzc256bjY4N2EzYXEifQ.byJP_44MvuipgZLvQ1tokg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [18.6, 9.4],
    zoom: 3
});
let ixps
//  filters the available IXP (Internet Exchange Points) based on the input search query.
function searchIXP(query) {
    return ixps
        .filter(ixp => {
            const queryLower = query.toLowerCase();
            const nameLower = ixp.properties.name.toLowerCase();
            const long_nameLower = ixp.properties.name_long.toLowerCase(); 
    return nameLower.includes(queryLower) || long_nameLower.includes(queryLower);
        })
        .map(ixp => ({
            type: "Feature",
            geometry: ixp.geometry,
            place_name: ixp.properties.name,
            place_type: ["IXP"],
            properties: ixp.properties,
            context: []
        }));
}
/**
 * The geocoder is an instance of MapboxGeocoder and it serves to add a search control to the map.
 * It is customized to search for Internet Exchange Points (IXP) within predefined countries.**/
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Search for IXP...',
    countries: 'AO,BF,BI,BJ,BW,CD,CF,CG,CI,CM,DJ,DZ,EG,ER,ET,GA,GM,GH,GN,GQ,GW,KE,KM,LR,LS,LY,MA,MG,ML,MR,MU,MW,MZ,NA,NE,NG,RE,RW,SC,SD,SL,SN,SO,SS,ST,SY,SZ,TD,TG,TN,TZ,UG,ZA,ZM,ZW',
    localGeocoder: searchIXP // Add this line
});

/**
 * This is an event listener for the 'result' event on the geocoder.
 * It triggers when a user selects an item from the search suggestions dropdown.
 **/
geocoder.on('result', function (event) {
    const feature = event.result;
    if (feature.place_type[0] === "IXP") {
        map.flyTo({
            center: feature.geometry.coordinates,
            zoom: 10
        });
    }
});
//adds the geocoder to the Map
map.addControl(geocoder);
// Fetch country coordinates
function fetchCountryCoords(callback) {
    $.ajax({
        url: '/IXPfilter',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 'country': 'all' }),
        success: response => callback(response)
    });
}
/**
 * The fetchCountryCoords function is used to make an asynchronous HTTP POST request to the '/IXPfilter' endpoint
 * to fetch coordinate data for countries or specific features within countries (such as IXPs).
 * It sends a payload specifying 'country': 'all',  to fetch data for all countries.
 **/
fetchCountryCoords(function (africanIXPdata) {
    const dispatch = new Event("MapON")
    map.on('load', function () {
        document.dispatchEvent(dispatch)
    })
   
    try {
        mapCountries(africanIXPdata);
    } catch (error) {
        console.error("Error in mapCountries:", error);
    }
    ixps = africanIXPdata
});


// Close card button event
document.getElementById('close-card').addEventListener('click', () => {
    const card = document.getElementById('country-info');
    card.style.opacity = 0; // Start the fade-out transition
    setTimeout(() => card.style.display = 'none', 500); // Hide the card after fade-out
});

/**
 * The mapCountries function is designed to map the features from the provided 'africanIXPdata' on the map 
 * and attach specific interactivities to them.
 **/
function mapCountries(africanIXPdata) {
    let hoveredFeatureId = null;
    if (map.loaded()) {
        addLayersAndHandlers();
    } else {
        map.on('load', addLayersAndHandlers);
    }
   /**
 * adding a new source to the map object.**/
    function addLayersAndHandlers() {
     
        // Add a GeoJSON source containing the coordinates
        map.addSource('africanIXPdata', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': africanIXPdata
            }
        });
     
        // Add a layer for the outer circle
        map.addLayer({
            'id': 'outer-circle',
            'type': 'circle',
            'source': 'africanIXPdata',
            'paint': {
                'circle-radius': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    30,
                    15
                ],
                'circle-color': '#071F28',
                'circle-opacity': 0.4
            }
        });
       
     //  This code snippet adds a new layer, 'inner-circle', to the map, which represents features from the 'africanIXPdata' source as circles.
        map.addLayer({
            'id': 'inner-circle',
            'type': 'circle',
            'source': 'africanIXPdata',
            'paint': {
                'circle-radius': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    15,
                    10
                ],
                'circle-color': '#071F28'
            }
        });

        // Add hover interactivity
        map.on('mouseenter', 'inner-circle', function (e) {
            if (e.features.length > 0) {
                if (hoveredFeatureId !== null) {
                    map.setFeatureState(
                        { source: 'africanIXPdata', id: hoveredFeatureId },
                        { hover: false }
                    );
                }
                hoveredFeatureId = e.features[0].id;
                map.setFeatureState(
                    { source: 'africanIXPdata', id: hoveredFeatureId },
                    { hover: true }
                );
            }
        });
    /*** This event listener detects when the mouse pointer leaves the 'inner-circle' layer on the map. */
        map.on('mouseleave', 'inner-circle', function () {
            if (hoveredFeatureId !== null) {
                map.setFeatureState(
                    { source: 'africanIXPdata', id: hoveredFeatureId },
                    { hover: false }
                );
            }
            hoveredFeatureId = null;
        }
        )    // Add click interactivity for either circle
        map.on('click', 'inner-circle', function (e) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const pixelSpace = map.project(coordinates);

            // Show the card at the clicked position
            const card = document.getElementById('country-info');
            card.style.left = `${pixelSpace.x}px`;
            card.style.top = `${pixelSpace.y}px`;


            // Populate the card with country info
            SelectedIXPname = e.features[0].properties.name;

            document.getElementById('country-name').textContent = SelectedIXPname;
            document.getElementById('label-1').textContent = e.features[0].properties.city;
            document.getElementById('label-2').textContent = e.features[0].properties.net_count;
            document.getElementById('IXPcountryName').textContent = SelectedIXPname;
            const event = new Event("countrySelected");
            document.dispatchEvent(event);

            document.getElementById("ixpname").innerText = SelectedIXPname || "-";
            document.getElementById("ixpid").innerText = e.features[0].properties.id|| "-";  // fixed the ID reference
            document.getElementById("ixpWebsite").innerText = e.features[0].properties.website || "-";
            document.getElementById("ixpWebsite").href=e.features[0].properties.website;
            // Assuming you want to display net_count as text, not a link:
            document.getElementById("ixpNetCount").innerText = e.features[0].properties.net_count || 0;

            document.getElementById("ixpCity").innerText = e.features[0].properties.city  || "-";
            document.getElementById("ixpStatus").innerText = e.features[0].properties.status || "-";

            // Make the card visible and animate it in
            card.style.display = 'block';
            setTimeout(() => card.style.opacity = 1, 50);

        });
    }
}




