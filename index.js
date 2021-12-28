const http = require('http')

const webServer = http.createServer((req, res)=>{
    res.setHeader('Content-Type', 'application/json');
    const list = Object.keys(map).reduce( (prev, item) => {
        const parsed_key = item.split(":")
        return map[item].tags.includes("game") ?
            [...prev, {
                address: parsed_key[0],
                port: parsed_key[1],
                ...map[item]
            }] : prev
    },[])
    res.end(JSON.stringify({list}))
})
webServer.listen(9001, ()=>{
    console.log('Server is running on 9001')
})

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