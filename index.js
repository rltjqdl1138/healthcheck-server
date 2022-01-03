const express = require('express')
const cron = require('node-cron')
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
    }

    const list = Object.keys(map).map( item => {
        const parsed_key = item.split(":")
        return  {
            ...map[item],
            address: parsed_key[0],
            port: parsed_key[1],
        }
    },[])

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({list}))
})

app.listen( 9001, ()=>console.log('Server is running on 9001'))
cron.schedule("*/10 * * * * *", ()=>decreaseTTL())
const decreaseTTL = ()=>{
    console.log(`============= Server Status =============`)
    Object.keys(map).forEach(e=>{
        if(map[e].ttl < 0) delete map[e]
        else map[e].ttl = map[e].ttl - 1
        console.log(`[${e}] ${map[e].ttl}`)
    })
    console.log(`=========================================\n`)
}



const map = {
    "123.123.123.123:8000":{
        info:"gameserver",
        tags:["game"],
        ttl:9999999
    },
    "123.123.123.123:8001":{
        info:"gameserver",
        tags:["game"],
        ttl:9999999
    },
    "123.123.123.123:8002":{
        info:"gameserver",
        tags:["game"],
        ttl:9999999
    },
}