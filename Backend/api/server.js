import express from 'express';
import cors from 'cors';

import authRoutes from '../routes/auth.routes.js';
import chuckRoutes from '../routes/chuck.routes.js';
import dummyRoutes from '../routes/dummy.routes.js';
import perfilRoutes from '../routes/perfil.routes.js';
import updateRoutes from '../routes/update.routes.js';
import availabilityRoutes from '../routes/availability.routes.js';
import certificateRoutes from '../routes/certificate.routes.js';
import cursosRoutes from '../routes/curso.routes.js';
import proyectosRoutes from '../routes/proyecto.routes.js';
import infoRoutes from '../routes/info.routes.js';
import geminiRoutes from '../routes/ia.routers.js';
import commentRoutes from '../routes/comments.routes.js';

const app = express();
const port = 3000;

const allowedOrigins = [
  'http://localhost:4200',
  'https://vantage360.vercel.app'
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
app.use(commentRoutes);

// Iniciar el servidor en local
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});

export default app;