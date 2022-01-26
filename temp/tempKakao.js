const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const fetch = require('node-fetch')
const KAKAO_REST_KEY = "21b2924ede1c48a36cec40f7b08d9a6b"
const MAP = {}
const USER_MAP = require('./USER')
const PORT = 8000
const is_test = false

router.get("/login",async (req, res)=>{
    res.setHeader('Content-Type', 'text/html');
    if(req.query.error)
        return res.end( makeHTMLFunction({httpStatus:401,...req.query}) )

    const {code} = req.query
    
    const bodyFromKakao = await getAccessTokenFromKakao(code)
    const data = await getDataFromKakao(bodyFromKakao.access_token)
    if(!USER_MAP[data.id]){
        data.nonce = crypto.randomInt(10000)
        USER_MAP[data.id] = data
    }
    MAP[data.id] = bodyFromKakao.access_token
    data.access_token = bodyFromKakao.access_token

    return res.end( makeHTMLFunction( { httpStatus:200, ...data}, "login"))
})
router.get("/logout",async (req, res)=>{
    res.setHeader('Content-Type', 'text/html');
    Object.keys(USER_MAP).forEach( e => delete USER_MAP[e])
    res.end(makeHTMLFunction( { httpStatus:200 }, "logout"))
})

router.get("/check", async(req, res)=>{
    const accessToken = req.query.token
    try{
        const data = await getDataFromKakao(accessToken)
        if(!data.id) throw new Error()
        return res.json(data)
    }catch(e){
        return res.status(401).end()
    }
})

const makeHTMLForUnreal = ( data, functionKey)=>{
    const FullHTML = `<!DOCTYPE html>
    <html>
    <header>
        <meta charset="utf-8">
        <script>
            window.addEventListener('keydown', function(event) {
                const key = event.key;
                try{
                    if (key === "Tab") ue.kakao.tab()
                }catch(e){
                    console.log("tab")
                }
            });
        </script>
    </header>
    <body>
        <script>ue.kakao.${functionKey}('${JSON.stringify(data)}').then(function(){});</script>
    </body>
    </html>`
    return FullHTML
}

const makeHTMLForWeb = (data)=>{
    const tags = Object.keys(data).map( e => `<p>${e}: ${data[e]}</p>`)

    const FullHTML = `<!DOCTYPE html>
    <html>
    <header>
        <meta charset="utf-8">
    </header>
    <body>
        ${tags.join("\n")}
    </body>
    </html>`
    return FullHTML
}

const makeHTMLFunction = is_test ? makeHTMLForWeb : makeHTMLForUnreal 

const formatting = (body)=>{
    const formBody = []
    for (let property in body){
        const encodedKey = encodeURIComponent(property)
        const encodedValue = encodeURIComponent(body[property])
        formBody.push(encodedKey+"="+encodedValue)
    }
    return formBody.join('&')
}
const getDataFromKakao = async(accessToken)=>{
    
    const response = await fetch('https://kapi.kakao.com/v2/user/me',{
        method: 'get',
        headers:{
            'Content-type':"application/x-www-form-urlencoded;charset=utf-8",
            'Authorization': `Bearer ${accessToken}`
        }
    })
    const data = await response.json()
    return data
}
const getAccessTokenFromKakao = async(code)=>{
    
    const body = {
        "grant_type":   "authorization_code",
        "client_id":    KAKAO_REST_KEY,
        "redirect_uri": `http://1.221.216.110:${PORT}/auth/kakao/login`,
        "code":         code
    }

    const response = await fetch('https://kauth.kakao.com/oauth/token',{
        method: 'post',
        body: formatting(body),
        headers:{ 'Content-type':"application/x-www-form-urlencoded;charset=utf-8" }
    })
    const data = await response.json()
    return data
}

module.exports = router

