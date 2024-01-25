from pymongo import MongoClient
import time
import requests
from pymongo.server_api import ServerApi
from copy import deepcopy  # For deep copying
import random

def get_all_ixp(allIxp):
    response = requests.get("https://www.peeringdb.com/api/ix?region_continent=Africa")

    if response.status_code == 200:
        data = response.json()
        if 'data' in data:
            for ixp in data['data']:
                #Confirm that the IXP belong to the African country
                if ixp['region_continent'] == 'Africa':
                    allIxp.append(ixp)
    else:
        print("There has been an error fething the data")
    print("request for IXP's Done")


def addAsToIxp(allIxpAs,allIxp):
    allIxpAs.extend(deepcopy(allIxp))  # Deep copy
    # Fetch AS info for each IXP and add it to the corresponding 'ixp' object
    for ixp in allIxpAs:
        response = requests.get(f"https://peeringdb.com/api/net?ix={ixp['id']}")
        data = response.json()
        print(f"request {ixp['id']} Done")
        if data['data']:
            ixp['as_info'] = data['data']
        #amke the code wait a bit beofere making another request
        time.sleep(3)

def addCordinatesByCity(allIXPs):
    key ="kFSkaej2H1epwHjmEOv6pw==6AZKMXtC2Bwdr5EQ"
    for ixp in allIXPs:
        city = ixp["city"]
        country =  ixp["country"]
        print(city)
        api_url = f'https://api.api-ninjas.com/v1/geocoding?city={city}&country={country}'
        response = requests.get(api_url, headers={'X-Api-Key': key})
        data = response.json()
        if data != []:
            latitude = data[0]["latitude"]
            longitude = data[0]["longitude"]
            r = 0.1
            # Randomly vary the coordinates within the defined "radius"
            latitude += random.uniform(-r,r)
            longitude += random.uniform(-r,r)
        else:
            #swaziland -26.628238, 31.509752
            latitude = -26.62
            longitude = 31.50


        ixp['latitude'] = latitude
        ixp['longitude'] = longitude



def main():
    allIxp = []
    allIxpAs = []
    
    #Call The APIS
    get_all_ixp(allIxp)
    addCordinatesByCity(allIxp)
    addAsToIxp(allIxpAs,allIxp)

    print("DONE")
    #Do in the Format I want

    #Publish to the DATABASE
    url = "mongodb+srv://zyonmathegu:hmFK9DmKUFuG2kxs@cluster0.yatajyo.mongodb.net/?retryWrites=true&w=majority"
    
    # Connect to the MongoDB server running on localhost at the default port 27017
    #client = MongoClient("mongodb://localhost:27017/")
    client = MongoClient(url, server_api=ServerApi('1'))
    # # Access the database named 'mydatabase'
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)
    
    db = client['AfricaHope']

    # # Access the collection named 'mycollection'
    #collection = db['IXPcollections']
    collectionWithAS = db['africanIXPandAS-2']
    # # Data to be inserted
    # my_data = {'name': 'John', 'age': 30, 'occupation': 'Engineer'}

    #Clear the Datbase first
    # # Insert the data into the collection
    #result = collection.insert_many(allIxp)
    result2 = collectionWithAS.insert_many(allIxpAs)

    # # Print the _id of the new document

    
if __name__ == '__main__':
    main()
