const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();
const upload = multer();

// Inicializa el cliente de Supabase con las variables de entorno
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // o tu API KEY secreta
);

// Ruta para subir archivos
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No se subió ningún archivo.' });

  const filePath = `uploads/${Date.now()}_${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('certificaciones') // nombre del bucket
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    console.error('Error al subir archivo:', error.message);
    return res.status(500).json({ error: 'Error al subir archivo.' });
  }

  // Opcional: guardar referencia en la base de datos
  await supabase.from('archivos_referencia').insert([{ path: filePath }]);

  return res.status(200).json({ message: 'Archivo subido exitosamente', path: filePath });
});

module.exports = router;
