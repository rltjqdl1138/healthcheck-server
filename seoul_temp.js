const PORT = 8000

const util = require('ethereumjs-util')
const express = require('express')
const app = express()
const fs = require('fs')
const kakao = require('./temp/tempKakao')
const tempMap = require('./temp/tempMap')
const USER_MAP = require('./temp/USER')
app.get("/",(req, res)=>{
    const html = fs.readFileSync("./temp/test.html")
    res.setHeader('Content-Type', 'text/html');
    res.write(html)
    res.end()
})
app.get("/login",(req, res)=>{
    const html = fs.readFileSync("./temp/login.html")
    res.setHeader('Content-Type', 'text/html');
    res.write(html)
    res.end()
})
app.get("/logout",(req, res)=>{
    const html = fs.readFileSync("./temp/logout.html")
    res.setHeader('Content-Type', 'text/html');
    res.write(html)
    res.end()
})
app.use('/map', tempMap)
app.use('/auth/kakao', kakao)
app.get("/test",(req, res)=>{
    const KEY = Object.keys(USER_MAP)[0]
    const user = USER_MAP[KEY]

    let nonce = tempNonce(user.nonce)

    nonce = "\x19Ethereum Signed Message:\n" + nonce.length + nonce
    nonce = util.keccak(Buffer.from(nonce, "utf-8"))
    const {v, r, s} = util.fromRpcSig(req.query.sign)
    const pubKey = util.ecrecover(util.toBuffer(nonce), v, r, s)
    const address = util.pubToAddress(pubKey).toString('hex');

    USER_MAP[KEY].walletAddress = address
    return res.end()
})

app.get("/user/me",(req, res)=>{
    const KEY = Object.keys(USER_MAP)[0]
    return res.json(USER_MAP[KEY])
})

app.listen(PORT, ()=>{
    console.log('listen on 8000')
})

function tempNonce(nonce){
    return `Seoul Metabus Sign up\nNonce:${nonce}`
}