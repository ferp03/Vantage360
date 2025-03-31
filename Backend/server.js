const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth.routes');
const chuckRoutes = require('./routes/chuck.routes');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:4200'
}));
app.use(bodyParser.json());

// Modulos
app.use(authRoutes);
app.use(chuckRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});