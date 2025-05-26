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

const allowedOrigins = [
  'http://localhost:4200',
  'https://vantage360-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('No permitido por CORS'));
    }
  }
}));

// app.use(bodyParser.json());
app.use(express.json());

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
app.use('/api', infoRoutes);
app.use('/api', geminiRoutes);

// Iniciar el servidor en local
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:3000`);
});

export default app;