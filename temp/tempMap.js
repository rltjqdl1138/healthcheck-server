const express = require('express')
const router = express.Router()

const fs = require('fs')

router.get("/",(req, res)=>{
    const html = fs.readFileSync("./temp/MapTest.html")
    res.setHeader('Content-Type', 'text/html');
    res.write(html)
    res.end()
})


module.exports = router