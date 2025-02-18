const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.get('/', (req, res) =>{
    res.send("Backend funcionando");
});

app.listen(port, () =>{
    console.log(`Servidor corriendo en el puerto ${port}`);
})
