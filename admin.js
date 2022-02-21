const express = require('express')
const fs = require('fs')
const fetch = require('node-fetch')
const cron = require('node-cron')

const app = express()
const PORT = 9002
const HEALTH_URL = "http://192.168.0.52"
app.use(express.json())
app.use(express.urlencoded({extended:false}))

let config = getConfig()
const map = {}

app.get('/notice',(req, res)=>{
    const now = new Date()
    res.json({
        title:  "정기점검안내",
        content:"정기점검 중입니다.",
        regdate: now.toISOString()
    })
})

app.get('/config', (req, res)=>{
    res.json(config)
})

app.post('/config',async (req, res)=>{
    const {serverCheck, checkEndedAt} = req.body
    config.serverCheck = serverCheck
    if(serverCheck){
        const now = new Date()
        config.checkStartedAt = now.toISOString()
        config.checkEndedAt = checkEndedAt
    }
    setConfig(config)

    const wasList = await getRequestToHealthServer()
    wasList.forEach(e=>{
        const url = `http://${e.address}:${e.port}/v1/configuration`
        console.log(url)
        putRequestToWASServer(url)
    })
    res.end()
})

app.listen( 8002, ()=>{
    postRequestToHealthServer()
    console.log('Admin Server is running on 9002')
})

cron.schedule("*/10 * * * * *", postRequestToHealthServer)

function postRequestToHealthServer(){
    const data = {
        port:PORT,
        info:"Admin Server",
        tags:["admin"]
    }
    fetch(HEALTH_URL,{
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(data),
        })
}

function putRequestToWASServer(url){
    fetch(url,{
            headers: { 'Content-Type': 'application/json' },
            method: 'PUT',
            body: JSON.stringify(config),
        })
}
function getRequestToHealthServer(){
    return new Promise((resolve, reject)=>{
        fetch(HEALTH_URL+"/was",{
            headers: { 'Content-Type': 'application/json' },
            method: 'GET'
        })
        .then(res => res.json())
        .then(json => resolve(json.list))
    })
}


function getConfig(){
    if (!fs.existsSync(__dirname + "/config.json")){
        const data = {
            serverCheck: false
        }
        setConfig(data)
    }
    
    const str = fs.readFileSync(__dirname + "/config.json")
    return JSON.parse(str)
}

function setConfig(data){
    fs.writeFileSync(__dirname + "/config.json", JSON.stringify( data ))
}