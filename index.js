const express = require('express');
const app = express();
const PORT = 3000;

const router = require('./router')

app.use(express.json())
app.get('', (req, res) => {
    res.json({
        message:"hello"
    })
});

app.use('/',router);


app.listen(PORT,()=>{
    console.log(`app is listening on http://localhost:${PORT}/`);
    
});

module.exports = app

