const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAnon } = require('../supabase');
const dotenv = require('dotenv');
dotenv.config();

const upload = multer();

// Ruta para subir archivo
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No se subió ningún archivo.' });
  }

  try {
    const fileName = `${Date.now()}_${file.originalname}`;

    const { data, error } = await supabaseAnon.storage
      .from('certificaciones')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error('Error al subir archivo a Supabase:', error.message);
      return res.status(500).json({ error: 'Error al subir archivo a Supabase.' });
    }

    const filePath = data.path;

    return res.status(200).json({
      success: true,
      message: 'Archivo subido exitosamente',
      filePath: filePath,
    });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ error: 'Error inesperado al procesar el archivo.' });
  }
});

router.post('/certificado', async (req, res) => {
  const { name, issueDate, expiryDate, institution, file } = req.body;
  
  // Verificar si todos los campos necesarios están presentes
  if (!name || !issueDate || !expiryDate || !institution ||  !file) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  try {
    // Realizar la inserción en la base de datos (ejemplo usando supabase)
    const { data, error } = await supabaseAnon
      .from('certificacion')
      .insert([
        {
          nombre: name,
          fecha_emision: issueDate,
          fecha_vencimiento: expiryDate,
          institucion: institution,
          archivo: file, 
        },
      ]);

    // Si hay un error en la inserción
    if (error) {
      console.error('Error al guardar en base de datos:', error.message);
      return res.status(500).json({ success: false, error: 'Error al guardar en base de datos' });
    }

    // Si la inserción es exitosa
    return res.status(200).json({
      success: true,
      message: 'Certificado guardado exitosamente',
      data: data,
    });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error inesperado al guardar certificado' });
  }
});


module.exports = router;
