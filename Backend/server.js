const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const authRoutes = require('./routes/auth.routes');
const chuckRoutes = require('./routes/chuck.routes');
const dummyRoutes = require('./routes/dummy.routes');
const perfilRoutes = require('./routes/perfil.routes');
const updateRoutes = require('./routes/update.routes');
const availabilityRoutes = require('./routes/availability.routes'); 
const certificateRoutes = require('./routes/certificate.routes');
const cursosRoutes = require('./routes/curso.routes');
const proyectosRoutes = require('./routes/proyecto.routes');
const infoRoutes = require('./routes/info.routes');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:4200'
}));
app.use(bodyParser.json());

// Modulos
app.use(authRoutes);
app.use(chuckRoutes);
app.use(dummyRoutes);
app.use(perfilRoutes);
app.use(updateRoutes);
app.use(availabilityRoutes);
app.use(certificateRoutes);
app.use(cursosRoutes);
app.use(proyectosRoutes);
app.use(infoRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});