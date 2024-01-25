import json
from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from pymongo.server_api import ServerApi

app = Flask(__name__)


url = "mongodb+srv://zyonmathegu:hmFK9DmKUFuG2kxs@cluster0.yatajyo.mongodb.net/?retryWrites=true&w=majority"
    
# Connect to the MongoDB server
client = MongoClient(url, server_api=ServerApi('1'))
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
#Access the database named 'AfricanHope'
db = client['AfricaHope']

#Access the collection named 'AfricanIXP'
collection = db['africanIXPandAS-2']

#These routes represents the different urls
@app.route('/')
def index():
    return render_template('home.html')

@app.route('/test')
def test():
    return render_template('dataTest.html')

@app.route('/asView')
def asView():
    return render_template('asView.html')

@app.route('/ixpView')
def ixpView():
    return render_template('ixpView.html')

@app.route('/editStudio')
def edit():
    return render_template('edit.html')

@app.route('/experimentAS')
def experimentAS():
    return render_template('SimulateAS.html')

@app.route('/editIXP')
def editIXP():
    return render_template('SimulateIXP.html')

@app.route('/documentation')
def document():
    return render_template('documentation.html')

#this API route will fetch the all the IXP data to be plotted on top of the map
@app.route('/IXPfilter', methods=['POST'])
def filter_data():
    cursor = collection.find()
    
    results = []
    n = 1
    for doc in cursor:
       
        transformed_data = {
            "type": "Feature",
            "id": n,
            "geometry":{
           
                "type":"Point",
                "coordinates":[
                    doc.get("longitude", ""),
                    doc.get("latitude", "")
                ]
            },
            "properties":{
                "id": doc.get("id", ""),
                "name": doc.get("name", ""),
                "name_long": doc.get("name_long", ""),
                "city": doc.get("city", ""),
                "country": doc.get("country", ""),
                "website": doc.get("website", ""),
                "net_count": doc.get("net_count", 0),
                "status": doc.get("status", ""),
            }

        }
        n = n +1 
        results.append(transformed_data)
    
    return jsonify(results)


#Indvidual IXP api call when an IXP anme is posted
#Fetches the details and the AS connected from the DB
@app.route('/IXPinfo', methods=['POST'])
def IXPinfo():
    ixpName = request.json.get('name')
    cursor = collection.find({'name': ixpName})
    results = []
    for doc in cursor:
        transformed_data = {
        "id": doc.get("id", ""),
        "name": doc.get("name", ""),
        "city": doc.get("city", ""),
        "country": doc.get("country", ""),
        "website": doc.get("website", ""),
        "net_count": doc.get("net_count", 0),
        "status": doc.get("status", ""),
        "as_info": doc.get("as_info",""), 
        "group": "IXP"
        }
        results.append(transformed_data)
    return jsonify(results)


#This Method will add be used to request the AS's for a specefic Country
@app.route('/NationalView', methods=['POST'])
def nationalView():
    #get the Country Name
    database = client["CountryView-Test"]
    countryName = request.json.get('name')
    IXcount = request.json.get('count')
    #GEt the countries exact stuff
    collection = database[countryName]
    results = []
    #do a ssearch for the country
    try:
        cursor = collection.find()
        for doc in cursor:
            transformed_data = {
                "id": doc.get("id", ""),
                "asn": doc.get("asn", ""),
                "name": doc.get("asnName", ""),
                "ConeSize": doc.get("totalDegree", ""),
                "customerSize": doc.get("customerDegree", 0),
                "providerSize": doc.get("providerDegree", 0),
                "peerSize": doc.get("peerDegree", 0),
                "siblingSize": doc.get("siblingDegree", 0),
                "providers": doc.get("providers", []),
                "customers": doc.get("customers", []),
                "siblings": doc.get("siblings", []),
                "peers": doc.get("peers", []),
                "group": "AS"
                }
            results.append(transformed_data)
        return jsonify(results), 200

    except Exception as e:
        print(f'The API call failed due to: {e}')
        return jsonify({"error": "The API call failed to the Database"}), 500

if __name__ == '__main__':
    app.run(debug=True)