**Africa Internet eXchange Visualizer - AIXV**

The project will implement a web application for visualising Internet interconnections within a country, and through IXPs. The IXP (Internet eXchange Point) view will focus on autonomous systems (AS) available at each African IXP; National view to display AS relationships within each country. 
The platform allow researchers to visualise peering scenarios and the impact of different interconnections within each country (e.g. addition or removal of peering links, IXPs,customer-provider links, and nodes(AS’s)(specify their propoerties) etc). The application visualise AS relationship datasets from CAIDA (https://www.caida.org/data/as-relationships/ ) and IXP data from PeeringDB. The application will also use IP geolocation information,such as from MaxMind ( https://www.maxmind.com/en/geoip2-services-and-databases ). The web
application is able to distinguish and represent different types of AS relationships, i.e., customer-to-provider (c2p), peer-to-peer (p2p), and sibling-to-sibling (s2s).

*Code Sections*

1. app.y
    - A Python script delineates the routing of HTML pages, outlining how the Flask server should manage web pages. It acts as a connector between the front end and the back end of the platform by retrieving data from the database and passing it to the HTML pages.
2. populateIXPDB.py
    - This populate the IXP database with the data from the many API we have aquired, this may take atleast 30 minutes because of some of the slow responses with the API.
    - if it fails The application uses a a backup Database if the Admin fails to populate properly
3. populateASDB.py
    - This Script will populate the AS database, though it runs much faster than the IXP, it take atlest 15minutes to complet
    - A backup is also there for when there is failure
4. /Template
    - This folder holds all the html files that are used the webapplication including all the Simulation pages and the Views

5. /static
    - Contains all the Jabascript files and the CSS including the images for the frontend 
    - In the JS we have classes defined and compnest for the frontend

*Running the Application*
- run pip install -r requirements.txt
- run python app.py inside the ouside Directory, a link will appear to run it locally
- An internet Connection is required to connect to the Database.