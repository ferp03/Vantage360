const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');

const authRoutes = require('../routes/auth.routes');
const chuckRoutes = require('../routes/chuck.routes');
const dummyRoutes = require('../routes/dummy.routes');
const perfilRoutes = require('../routes/perfil.routes');
const updateRoutes = require('../routes/update.routes');
const availabilityRoutes = require('../routes/availability.routes'); 
const certificateRoutes = require('../routes/certificate.routes');
const cursosRoutes = require('../routes/curso.routes');
const proyectosRoutes = require('../routes/proyecto.routes');
// const participacionRoutes = require('./routes/participacion.routes');
const infoRoutes = require('../routes/info.routes');
const geminiRoutes = require('../routes/ia.routers'); 

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:4200'
}));
app.use(bodyParser.json());

// Modulos
app.use('/api', authRoutes);
app.use('/api', chuckRoutes);
app.use('/api', dummyRoutes);
app.use('/api', perfilRoutes);
app.use('/api', updateRoutes);
app.use('/api', availabilityRoutes);
app.use('/api', certificateRoutes);
app.use('/api', cursosRoutes);
app.use('/api', proyectosRoutes);
// app.use(participacionRoutes);
app.use(infoRoutes);
app.use(geminiRoutes);

module.exports = serverless(app);

// Iniciar el servidor en local
// app.listen(port, () => {
//   console.log(`Servidor backend corriendo en http://localhost:${port}`);
// });