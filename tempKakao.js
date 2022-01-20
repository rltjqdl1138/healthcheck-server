const express = require('express')
const fetch = require('node-fetch')
const app = express()
const PORT = 8000
const KAKAO_REST_KEY = "21b2924ede1c48a36cec40f7b08d9a6b"
const MAP = {
}
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.get("/test",async (req, res)=>{
    res.setHeader('Content-Type', 'text/html');
    if(req.query.error)
        return res.end( makeHTMLForUnreal({
            httpStatus:401,
            ...req.query
        }) )
    const {code} = req.query
    
    const bodyFromKakao = await getAccessTokenFromKakao(code)
    const data = await getDataFromKakao(bodyFromKakao.access_token)
    MAP[data.id] = bodyFromKakao.access_token

    data.access_token = bodyFromKakao.access_token
   
    return res.end( makeHTMLForUnreal({ httpStatus:200, ...data}))
})
app.post("/test",(req,res)=>{
    res.setHeader('Content-Type', 'application/json');
    res.end(req.body)
})
app.post("/auth/kakao/logout",async (req, res)=>{
    res.setHeader('Content-Type', 'application/json');
    const {id} = req.body
    const accessToken = MAP[id]
    
    if(!accessToken)
        return res.status(401).end()
    delete MAP[id]

    const response = await fetch("https://kapi.kakao.com/v1/user/logout",
    {
        method:'post',
        headers:{
            'Content-type':"application/x-www-form-urlencoded",
            'Authorization': `Bearer ${accessToken}`
        }
    })
    const data = await response.json()
    res.json(data)
})

const makeHTMLForUnreal = (data)=>{
    const FullHTML = `<!DOCTYPE html>
    <html>
    <header>
        <meta charset="utf-8">
    </header>
    <body>
        <script>ue.kakao.authorize('${JSON.stringify(data)}').then(function(){});</script>
    </body>
    </html>`
    return FullHTML
}

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
        "redirect_uri": `http://1.221.216.110:${PORT}/test`,
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

app.listen( PORT, ()=>console.log('Server is running on '+PORT))

