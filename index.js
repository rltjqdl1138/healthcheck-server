const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.get("/*",(req, res)=>{
    let tags = []
    const path = req.url.split("/")[1]
    if(path.length)
        tags = [...path.split(",")]
    const list = Object.keys(map).reduce( (prev, item) => {
        const parsed_key = item.split(":")

        if(tags.length == 0)
            return [...prev, {
                ...map[item],
                address: parsed_key[0],
                port:    parsed_key[1],
            }]

        for( const i in tags){
            if( map[item].tags.includes(tags[i]) )
                return [...prev, {
                    ...map[item],
                    address: parsed_key[0],
                    port:    parsed_key[1],
                }]
        }
        return prev
    },[])

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({list}))
})
app.post("/",(req, res)=>{
    const remoteAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const { port, info, tags} = req.body
    const key = remoteAddress + ":" + port
    if( port ){
        if(!map[key]) map[key] = {}
        map[key] = { ...req.body,
            info    : info || map[key].info,
            tags    : tags || map[key].tags || [],
            ttl: 10 }
        console.log(map[key])
    }

    const list = Object.keys(map).map( item => {
        const parsed_key = item.split(":")
        return  {
            address: parsed_key[0],
            port: parsed_key[1],
            ...map[item]
        }
    },[])

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({list}))
})

app.listen( 9001, ()=>console.log('Server is running on 9001'))


const map = {
    "123.123.123.123:8000":{
        info:"gameserver",
        tags:["game"]
    },
    "123.123.123.123:8001":{
        info:"gameserver",
        tags:["game"]
    },
    "123.123.123.123:8002":{
        info:"gameserver",
        tags:["game"]
    },
}



class distributor extends require('./tcpServer.js'){
    constructor(port=9000){
        super("distributor", port, ["POST/distributes", "GET/distributes"])
    }

    onCreate(socket) {
        //console.log("onCreate", socket.remoteAddress, socket.remotePort)
        this.sendInfo(socket)
    }

    onClose(socket) {
        var key = socket.remoteAddress + ":" + socket.remotePort
        //console.log("onClose", socket.remoteAddress, socket.remotePort)
        delete map[key]
        this.sendInfo()
    }

    onRead(socket, json) {
        var key = socket.remoteAddress + ":" + socket.remotePort
        console.log("onRead", socket.remoteAddress, socket.remotePort, json)
        //console.log("\n\n\n")
        //console.log(json)
        //console.log("\n\n\n")
        if(json.uri == "/distributes" && json.method == "POST") {
            map[key] = {
                socket: socket
            }
            map[key].info = json.params
            map[key].info.host = socket.remoteAddress
            this.sendInfo()
        }
    }

    write(socket, packet) {
        socket.write(JSON.stringify(packet) + "¶")
    }

    sendInfo(socket) {
        var packet = {
            uri: "/distributes",
            method: "GET",
            key: 0,
            params: []
        }
        for (var n in map){
            packet.params.push(map[n].info)
        }
        if(socket){
            this.write(socket, packet)
        } else {
            for (var n in map){
                this.write(map[n].socket, packet)
            }
        }
    }
}

new distributor()