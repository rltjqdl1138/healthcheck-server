const express = require('express')
const router = express.Router()

const fs = require('fs')

router.get("/",(req, res)=>{
    const html = fs.readFileSync("./temp/MapTest.html")
    res.setHeader('Content-Type', 'text/html');
    res.write(html)
    res.end()
})
router.get("/explore",(req,res)=>{
    
    const location = [
        {
            name: "서울 시청",
            lat: 37.566672503327894,
            lng: 126.97841391867198,
            url: "https://cdn.crowdpic.net/detail-thumb/thumb_d_BED4785DD100034DFF1149481293C6C5.jpg"
        },
        {
            name: "시청 광장",
            lat: 37.56557966662658,
            lng: 126.97802497578645,
            url: "https://upload.wikimedia.org/wikipedia/commons/3/33/%EC%84%9C%EC%9A%B8%EA%B4%91%EC%9E%A5_%EC%A0%84%EA%B2%BD.JPG"
        },
        {
            name: "3DF",
            lat: 37.58159717747926,
            lng: 126.88710612585542,
            url:"",
        },
        {
            name: "숭례문",
            lat: 37.56000961903046,
            lng: 126.97529346928171,
            url:"",
        },
        {
            name: "덕수궁",
            lat: 37.56579893700849,
            lng: 126.97514909748877,
            url:"",
        },
    ]
    const tags = location.map( e =>
    `<div>
    <img width="100px" height="100px" src="${e.url}" />
    <button onClick="teleport(${e.lat}, ${e.lng})">${e.name}</button>
    </div>`)
    
    res.setHeader('Content-Type', 'text/html');
    const html =
`
<html>
    <head>
        <meta charset="utf-8">
    </head>
    <body>
        <script>
            function teleport(lat, lng){
                const data = {lat, lng}
                try{
                    eu.kakao.teleport(JSON.stringify(data))
                }catch(e){
                    console.log(data)
                }
            }
        </script>
        ${tags.join('\n')}
    </body>
</html>
`
    res.write(html)
    res.end()
})

module.exports = router