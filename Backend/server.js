const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const authRoutes = require('./routes/auth.routes');
const chuckRoutes = require('./routes/chuck.routes');
const dummyRoutes = require('./routes/dummy.routes');
const updateRoutes = require('./routes/update.routes');


const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:4200'
}));
app.use(bodyParser.json());

// Modulos
app.use(fileUpload());
app.use(authRoutes);
app.use(chuckRoutes);
app.use(dummyRoutes);
app.use(updateRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});