import json
import requests
import re
import time
from pymongo import MongoClient
from pymongo.server_api import ServerApi
countryASN = {"DZ": [], "AO": [], "BJ": [], "BW": [], "BF": [], "BI": [], "CV": [], "CM": [], "CF": [], "TD": [], "KM": [], "CG": [], "CD": [], "DJ": [], "EG": [], "GQ": [], "ER": [], "SZ": [], "ET": [], "GA": [], "GM": [], "GH": [], "GN": [], "GW": [], "CI": [], "KE": [], "LS": [], "LR": [], "LY": [], "MG": [], "MW": [], "ML": [], "MR": [], "MU": [], "MA": [], "MZ": [], "NA": [], "NE": [], "NG": [], "RE": [], "RW": [], "ST": [], "SN": [], "SC": [], "SL": [], "SO": [], "ZA": [], "SS": [], "SD": [], "TZ": [], "TG": [], "TN": [], "UG": [], "EH": [], "ZM": [], "ZW": []}
countryASNRel = {"DZ": [], "AO": [], "BJ": [], "BW": [], "BF": [], "BI": [], "CV": [], "CM": [], "CF": [], "TD": [], "KM": [], "CG": [], "CD": [], "DJ": [], "EG": [], "GQ": [], "ER": [], "SZ": [], "ET": [], "GA": [], "GM": [], "GH": [], "GN": [], "GW": [], "CI": [], "KE": [], "LS": [], "LR": [], "LY": [], "MG": [], "MW": [], "ML": [], "MR": [], "MU": [], "MA": [], "MZ": [], "NA": [], "NE": [], "NG": [], "RE": [], "RW": [], "ST": [], "SN": [], "SC": [], "SL": [], "SO": [], "ZA": [], "SS": [], "SD": [], "TZ": [], "TG": [], "TN": [], "UG": [], "EH": [], "ZM": [], "ZW": []}
countryASNComplete= {"DZ": [], "AO": [], "BJ": [], "BW": [], "BF": [], "BI": [], "CV": [], "CM": [], "CF": [], "TD": [], "KM": [], "CG": [], "CD": [], "DJ": [], "EG": [], "GQ": [], "ER": [], "SZ": [], "ET": [], "GA": [], "GM": [], "GH": [], "GN": [], "GW": [], "CI": [], "KE": [], "LS": [], "LR": [], "LY": [], "MG": [], "MW": [], "ML": [], "MR": [], "MU": [], "MA": [], "MZ": [], "NA": [], "NE": [], "NG": [], "RE": [], "RW": [], "ST": [], "SN": [], "SC": [], "SL": [], "SO": [], "ZA": [], "SS": [], "SD": [], "TZ": [], "TG": [], "TN": [], "UG": [], "EH": [], "ZM": [], "ZW": []}
countryASNRelC2P = {"DZ": [], "AO": [], "BJ": [], "BW": [], "BF": [], "BI": [], "CV": [], "CM": [], "CF": [], "TD": [], "KM": [], "CG": [], "CD": [], "DJ": [], "EG": [], "GQ": [], "ER": [], "SZ": [], "ET": [], "GA": [], "GM": [], "GH": [], "GN": [], "GW": [], "CI": [], "KE": [], "LS": [], "LR": [], "LY": [], "MG": [], "MW": [], "ML": [], "MR": [], "MU": [], "MA": [], "MZ": [], "NA": [], "NE": [], "NG": [], "RE": [], "RW": [], "ST": [], "SN": [], "SC": [], "SL": [], "SO": [], "ZA": [], "SS": [], "SD": [], "TZ": [], "TG": [], "TN": [], "UG": [], "EH": [], "ZM": [], "ZW": []}

def extract_asn_number(asn_string):
    # Using a regular expression to find the number in the string
    match = re.search(r'\((\d+)\)', asn_string)
    return int(match.group(1)) if match else None

def parse_asn_set(asn_set_str):
    # Remove leading and trailing curly brackets and split by comma
    asn_list_str = asn_set_str[1:-1].split(", ")

    # Extract ASN numbers
    return [extract_asn_number(asn_str) for asn_str in asn_list_str]

def getASperCountry(code):
    # Making the API call
    url = f'https://stat.ripe.net/data/country-asns/data.json?resource={code}&lod=1'

    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"An error occurred: {e}")
        return

    # Parse the JSON response
    api_data = response.json()
    # Accessing specific data
    routed_asns_str = api_data['data']['countries'][0]['routed']
    non_routed_asns_str = api_data['data']['countries'][0]['non_routed']

    # Parse ASN sets
    routed_asns = parse_asn_set(routed_asns_str)
    non_routed_asns = parse_asn_set(non_routed_asns_str)
    all_asns = routed_asns + non_routed_asns
    countryASN[code] = (all_asns)
    #print(countryASN[code])

def asnInfo(code):
    #get the ASN lis for the country
    asns = countryASN[code]
    for asn in asns:
        print(f"prossing {asn}")
        url = f"https://api.asrank.caida.org/v2/restful/asns/{asn}?populate=1"
        response = requests.get(url)
        api_data = response.json()
        as_data = api_data['data']['asn']
        #print(as_data)
        if as_data == None:
        #process the data
            as_transformed = {
            "id": asn,
            "asn": asn,
            "asnName": "",
            "source": "",
            "numberPrefixes": 0,
            "numberAddresses": 0,
            "country_iso": code,
            "totalDegree": 0,
            "customerDegree": 0,
            "peerDegree":0,
            "providerDegree": 0,
            "group": "AS"
            }
            #append to the specific dictionary
            countryASNComplete[code].append(as_transformed)
        #everything wnet well
        else:
            #process the data
            as_transformed = {
            "id": int(as_data.get("asn", "")),
            "asn": int(as_data.get("asn", "")),
            "asnName": as_data.get("asnName", ""),
            "source": as_data.get("source", ""),
            "numberPrefixes": as_data.get("cone", {}).get("numberPrefixes", 0),
            "numberAddresses": as_data.get("cone", {}).get("numberAddresses", 0),
            "country_iso": as_data.get("country", {}).get("iso", ""),
            "totalDegree": as_data.get("asnDegree", {}).get("total", 0),
            "customerDegree": as_data.get("asnDegree", {}).get("customer", 0),
            "peerDegree": as_data.get("asnDegree", {}).get("peer", 0),
            "providerDegree": as_data.get("asnDegree", {}).get("provider", 0),
            "group": "AS"
            }
            #append to the specific dictionary
            countryASNComplete[code].append(as_transformed)
def addRelationships(code):
    #get the ASN lis for the country
    relationships = countryASNRel[code]
    asns = countryASN[code]
    for asn in asns:
        print(f"prossing {asn} rels")
        url = f"https://api.asrank.caida.org/v2/restful/asnLinks/{asn}"
        try:
            response = requests.get(url)
            api_data = response.json()
            edges = api_data['data']['asnLinks']['edges']
            #print(edges)
            for edge in edges:
                node = edge['node']
                asn1 = node["asn1"]
                transformed_edge = {
                    "source": asn,
                    "target": int(asn1.get("asn", 0)),
                    #"numberPaths": node.get("numberPaths", 0),
                    "type": node.get("relationship", "")
                 }
                relationships.append(transformed_edge)
            #print(relationships)
        except requests.RequestException as e:
            print(f"An error occurred: {e}")
            continue


#UNused
def S2S_relationships(code):
    asnComplete = countryASNComplete[code]
    relationships = countryASNRel[code]

    for ASObject in asnComplete:
        for otherObject in asnComplete:
            # Check if "Org" key exists in both ASObject and otherObject
            if "Org" in ASObject and "Org" in otherObject:
                if ASObject["Org"] == otherObject["Org"] and ASObject["id"] != otherObject["id"] and ASObject["Org"] != "" and otherObject["Org"] != "":
                    print("Something Fishy")
                    print(ASObject["Org"]+" Connented "+otherObject["Org"])
                    relationships.append({
                        "source": ASObject["id"],
                        "target": otherObject["id"],
                        "type": "S2S"
                    })
            else:
                print("The key 'Org' does not exist in one or both of the objects.")
    #print(relationships)




def configureHierarchy(database,code):
    link_data = countryASNRel[code]
    asnComplete = countryASNComplete[code]
    relationship_dict = {org["id"]: org for org in asnComplete}
    #<provider-as>|<customer-as>|-1
    #<peer-as>|<peer-as>|0
    for link in link_data:
        source_id = link['source']
        target_id = link['target']
        type_relation = f"{link['type']}s"

        if source_id in relationship_dict and target_id in relationship_dict:
            if type_relation not in relationship_dict[source_id]:
                relationship_dict[source_id][type_relation] = []

            relationship_dict[source_id][type_relation].append(target_id)

    updated_relationship_data = list(relationship_dict.values())

    #write the AS to the Database -- collection with country Name
    collection = database[code]
    collection.insert_many(updated_relationship_data)
        
def main():
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
    
    database = client['CountryView-Test']
    
    for country_code in countryASNComplete:
        print(f"processing {country_code}")
        #Get the ASN
        getASperCountry(country_code)
        #add the AS details to the database
        #This method uses a database call to get the information predefined
        asnInfo(country_code)

        #add Relationships
        addRelationships(country_code)
        #Configure and add to database
        configureHierarchy(database,country_code)

if __name__ == '__main__':
    main()
