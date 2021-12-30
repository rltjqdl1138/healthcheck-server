const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.get("/*",(req, res)=>{
    console.log(req.headers)
    let tags = []
    const path = req.url.split("/")[1]
    if(path.length)
        tags = [...path.split(",")]
    const list = Object.keys(map).reduce( (prev, item) => {
        const parsed_key = item.split(":")

        if(tags.length == 0)
            return [...prev, {
                address: parsed_key[0],
                port:    parsed_key[1],
                ...map[item]
            }]

        for( const i in tags){
            if( map[item].tags.includes(tags[i]) )
                return [...prev, {
                    address: parsed_key[0],
                    port:    parsed_key[1],
                    ...map[item]
                }]
        }
        return prev
    },[])

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({list}))
})
app.post("/",(req, res)=>{
    const key = req.socket.remoteAddress + ":" + req.socket.remotePort
    const { address, port, info, tags} = req.body
    if(address && port ){
        const key = address + ":" + port
        map[key] = { ...map[key], info, tags, ttl: 10 }
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
    "127.0.0.1:8000":{
        info:"gameserver",
        tags:["game","game1"]
    },
    
    "127.0.0.1:8001":{
        info:"gameserver",
        tags:["game","game2"]
    },
    
    "127.0.0.1:8002":{
        info:"server",
        tags:["server"]
    }
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