const express = require('express');
const multer = require('multer');
const router = express.Router();
const { supabaseAnon } = require('../supabase');
const supabase = supabaseAnon;

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/empleado/:id/curso', upload.single('archivo'), async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_emision, fecha_vencimiento } = req.body;
  const archivo = req.file;

  if (!archivo || !nombre || !fecha_emision || !fecha_vencimiento) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos o archivo' });
  }

  try {
    const fileName = `${Date.now()}_${archivo.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('cursos')
      .upload(fileName, archivo.buffer, {
        contentType: archivo.mimetype
      });

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError.message);
      return res.status(500).json({ success: false, error: 'No se pudo subir el archivo' });
    }

  const { data: signedUrlData, error: signedUrlError } = await supabase
  .storage
  .from('cursos')
  .createSignedUrl(fileName, 60 * 60 * 24 * 7); 

  if (signedUrlError) {
    console.error('Error al generar signed URL:', signedUrlError.message);
    return res.status(500).json({ success: false, error: 'No se pudo generar la URL del archivo' });
  }

const archivoUrl = signedUrlData.signedUrl;

    const { data, error: insertError } = await supabase
      .from('curso')
      .insert([{
        empleado_id: id,
        nombre,
        fecha_emision,
        fecha_vencimiento,
        archivo: archivoUrl
      }])
      .select('*');

    if (insertError || !data || data.length === 0) {
      console.error('Error al guardar curso:', insertError?.message || 'No se insertó');
      return res.status(500).json({ success: false, error: 'No se pudo registrar el curso' });
    }

    return res.status(201).json({
      success: true,
      message: 'Curso registrado correctamente',
      data: {
        curso_id: data[0].curso_id,
        archivo: archivoUrl
      }
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

router.get('/empleado/:id/cursos', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('curso')
    .select('curso_id, nombre, fecha_emision, fecha_vencimiento, archivo')
    .eq('empleado_id', id)
    .order('fecha_emision', { ascending: true });

  if (error) {
    console.error('Error al obtener cursos:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudieron obtener los cursos' });
  }

  return res.status(200).json({
    success: true,
    data
  });
});

module.exports = router;
