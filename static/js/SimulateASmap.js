export let SelectedCountry = "";
let SelectedCountryName

// Add your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNsbGZpMnp6azEwNm4zaHF5ajl0eDM1cDgifQ.hp1zC4l--aQhVKAz4rGJ4Q';

// Initialize the map focused on Africa
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [18.6, 9.4],
    zoom: 3
});

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Search for an African country...',
    countries: 'AO,BF,BI,BJ,BW,CD,CF,CG,CI,CM,DJ,DZ,EG,ER,ET,GA,GM,GH,GN,GQ,GW,KE,KM,LR,LS,LY,MA,MG,ML,MR,MU,MW,MZ,NA,NE,NG,RE,RW,SC,SD,SL,SN,SO,SS,ST,SY,SZ,TD,TG,TN,TZ,UG,ZA,ZM,ZW'  // ISO 3166-1 alpha-2 country codes for African countries
});

mapCountries()
// Close card button event
document.getElementById('close-card').addEventListener('click', function () {
    const card = document.getElementById('country-info');
    card.style.opacity = 0; // Start the fade-out transition

    // Wait for the fade-out transition to complete, then hide the card
    setTimeout(() => card.style.display = 'none', 500);
});

map.addControl(geocoder);
function mapCountries() {
    // Variable to hold the ID of the hovered feature
    let hoveredFeatureId = null;

    map.loadImage('/static/Images/locations.png', function (error, image) {
        if (error) throw error;

        map.addImage('my-icon-id', image);
        // Wait for the map to load before adding markers
        map.on('load', function () {
            // Add a GeoJSON source containing the coordinates
            map.addSource("countries", {
                "type": "geojson",
                "data": "/static/data/africa2.geojson"
            });
        
            map.addLayer({
                "id": "countries-fills",
                "type": "fill",
                "source": "countries",
                "layout": {},
                "paint": {
                    "fill-color": "#627BC1",
                    "fill-opacity": 0.5
                }
            });
        
            map.addLayer({
                "id": "countries-borders",
                "type": "line",
                "source": "countries",
                "layout": {},
                "paint": {
                    "line-color": "#627BC1",
                    "line-width": 2
                }
            });
        
            map.addLayer({
                "id": "countries-fills-hover",
                "type": "fill",
                "source": "countries",
                "layout": {},
                "paint": {
                    "fill-color": "#1f273d",
                    "fill-opacity": 1
                },
                "filter": ["==", "name", ""]
            });

            // Mouse enter event
            map.on('mouseenter', 'icon-layer-normal', function (e) {
                if (e.features.length > 0) {
                    if (hoveredFeatureId !== null) {
                        // Remove hover effect from previously hovered feature
                    }
                    hoveredFeatureId = e.features[0].id;
                    map.setFilter('icon-layer-hover', ['==', 'id', hoveredFeatureId]);
                }
            });

            // Mouse leave event
            map.on('mouseleave', 'icon-layer-normal', function () {
                if (hoveredFeatureId !== null) {
                    // Remove hover effect
                    map.setFilter('icon-layer-hover', ['==', 'id', '']);
                }
                hoveredFeatureId = null;
            });
            // Add click interactivity for either circle
            map.on('click', function (e) {
                var features = map.queryRenderedFeatures(e.point, { layers: ["countries-fills"] });
                console.log(features[0].properties.iso_a2);
                let coordinates = features[0].geometry.coordinates[0][0].slice();
                if(Array.isArray(coordinates[0])){
                    coordinates = coordinates[0]
                }
                console.log(coordinates)
                const pixelSpace = map.project(coordinates);

                // Show the card at the clicked position
                const card = document.getElementById('country-info');
                card.style.left = `${pixelSpace.x}px`;
                card.style.top = `${pixelSpace.y}px`;

                // Populate the card with country info
                SelectedCountry = features[0].properties.iso_a2;
                SelectedCountryName = features[0].properties.name;
                document.getElementById('country-name').textContent = SelectedCountryName;
                const events = new Event("country");
                document.dispatchEvent(events);

                // Make the card visible and animate it in
                card.style.display = 'block';
                setTimeout(() => card.style.opacity = 1, 50);

            });
        })
    }

)}