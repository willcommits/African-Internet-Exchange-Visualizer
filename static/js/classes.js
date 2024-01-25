class node{
    constructor(id,name){
        this.id = id
        this.name = name
    }
    //Take the Node attributes chnage them to a JS objec(JSON like)
    toObject(){
        return{
            id: this.id,
            name: this.name
        }   
    }
}

//This is an AS type1 for AS connected to the IXP class
class AS extends node{
    //The constructor takes in an Object with data for the AS
    constructor(data){
        super(data.asn,data.name)
        this.asn = data.asn
        this.id = this.asn
        this.name = data.name
        this.info_traffic  = data.info_traffic
        this.website = data.website
        this.IXPs = [] //empty 
        this.status = data.status;
        this.group = "AS"
    }
    setASN(ASnumber){
        this.ASN = this.ASnumber
    }
    Setname(ASname){
        this.name = ASname
    }
    displayInfo() {
        // console.log(`AS Name: ${this.name}`);
    }

    addIXP(masterIXP){
        if (masterIXP instanceof IXP ) {
            this.IXPs.push(masterIXP);
        } else {
            console.log("Invalid object passed. It should be an instance of IXPnode.");
        }
    }
}

//This is AS type 2 which is different form the the first Type
class NationalAS extends node{
    //The Construtor uses typed in values than an object to create an AS type
    constructor(asn,name,coneSize,customerSize,providerSize,peerSize,siblingSize){
        super(asn,name)
        this.asn = asn
        this.id = this.asn
        this.neighbors = new Set()
        this.group = "AS"
        this.count = 0
        this.coneSize = coneSize
        this.CustomerCount = customerSize
        this.ProviderCount = providerSize
        this.PeerCount = peerSize
        this.SiblingCount = siblingSize
    }
    addNeighbor(node) {
        if (node instanceof NationalAS) {
            if (!this.neighbors.has(node)) {
                this.neighbors.add(node);
            }
        } else {
            console.log("Invalid object passed. It should be an instance of ASnode.");
        }
        this.count = this.count +1
    }
    //Take the Node attributes chnage them to a JS objec(JSON like)
    toObject(){
        return{
            id: this.asn,
            name: this.name,
            coneSize: this.coneSize,
            CustomerCount: this.CustomerCount,
            ProviderCount: this.ProviderCount,
            PeerCount: this.PeerCount,
            SiblingCount: this.SiblingCount,
            count: this.count,
            group: 'AS'
        }
    }
}
class IXP extends node{

    //first Constructor for a Newly created IXP
    constructor(data) {
        super(data)
        this.id = data.id
        this.nameA = data.name
        this.Network_Count = data.net_count
        this.website = data.website
        this.city = data.city
        this.country = data.country
        this.status = data.status
        this.group = "IXP"
        this.ASLIST = []
        this.links = []    }

    addAS(autonomousSystem) {
        if (autonomousSystem instanceof AS) {
            this.ASLIST.push(autonomousSystem);
        } else {
            console.log("Invalid object passed. It should be an instance of ASnode.");
        }
    }
    displayInfo() {
        console.log(`Count: ${this.Network_Count}`);
    }
    
}
class Link {
    constructor(source,target) {
        this.source = source; // Starting node (source)
        this.target = target; // Ending node (target)
    }
    //Take the Link attributes chnage them to a JS objec(JSON like)
    toObject(){
        return {
            source:this.source.asn,
            target:this.target.asn
        }
    }
}

class asLink extends Link{
    constructor(source,target,type){
        super(source,target);
        this.type = type;
    }
   //Take the Link attributes chnage them to a JS objec(JSON like)
    toObject(){
        return {
            source:this.source.asn,
            target:this.target.asn,
            type:this.type
        }
    }
}
//this Class contains the Created classes to Run proper algorithms
class Graph{
    constructor() {
        this.nodes = new Map();  // Map of vertex ID to Vertex object
    }

    addNode(node) {
        //Check of the node is already there
        if (!this.nodes.has(node.id)) {
            this.nodes.set(node.id,node);
        }
    }

    addLink(node1,node2){
        //Add the nodes to the Graph, will only add if they are not there already
        this.addNode(node1)
        this.addNode(node2)
        //NEw

        //add the neighbors together
        node1.addNeighbor(node2)
        node2.addNeighbor(node1)
    }
}

export { AS,NationalAS,IXP,Link, asLink,Graph };