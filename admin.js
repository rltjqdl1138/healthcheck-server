const express = require('express')
const fs = require('fs')
const fetch = require('node-fetch')
const app = express()
const PORT = 9002

app.use(express.json())
app.use(express.urlencoded({extended:false}))

const config = getConfig()


app.get('/', (req, res)=>{
    res.json(config)
})
app.listen( PORT, ()=>{
    postRequestToHealthServer()
    console.log('Admin Server is running on 9002')
})


function postRequestToHealthServer(){
    const data = {
        port:PORT,
        info:"Admin Server",
        tags:[]
    }
    fetch("http://192.168.0.52",{
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(data),
        })
        .then(res => res.json())
        .then(json =>{
            console.log(json)
        })
}

function getConfig(){
    if (!fs.existsSync(__dirname + "/config.json")){
        data = {
            serverCheck: false
        }
        fs.writeFileSync(__dirname + "/config.json", JSON.stringify( data ))
    }
    
    const str = fs.readFileSync(__dirname + "/config.json")
    return JSON.parse(str)
}
