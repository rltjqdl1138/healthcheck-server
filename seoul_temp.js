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
    res.setHeader('Content-Type', 'text/html');
    res.redirect(`https://kauth.kakao.com/oauth/authorize?client_id=379993434257f68df05bd2f9d2e4416a&redirect_uri=http://1.221.216.110:${PORT}/auth/kakao/login&response_type=code`)
})
app.get("/logout",(req, res)=>{
    res.setHeader('Content-Type', 'text/html');
    res.redirect( `https://kauth.kakao.com/oauth/logout?client_id=379993434257f68df05bd2f9d2e4416a&logout_redirect_uri=http://1.221.216.110:${PORT}/auth/kakao/logout&response_type=code&state=123123`)
})

app.get("/scroll",(req, res)=>{
    const html = fs.readFileSync("./temp/scrollTest.html")
    res.setHeader('Content-Type', 'text/html');
    res.write(html)
    res.end()
})
app.get("/video",(req, res)=>{
    const map = []
    map[0] = "http://www.youtube.com/embed/yL1jh7RyRMw?rel=0?version=3&autoplay=1&controls=0&&showinfo=0&loop=1&cc_load_policy=0&cc_lang_pref=no"
    map[1] = "https://www.youtube.com/embed/lYJ17n_oUkA?rel=0?version=3&autoplay=1&controls=0&&showinfo=0&loop=1&cc_load_policy=0&cc_lang_pref=no"

    const num = parseInt(req.query.number,10)
    if(map[num])
        return res.redirect(map[num])
    return res.redirect(map[0])
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