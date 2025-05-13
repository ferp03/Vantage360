const express = require('express');
const multer = require('multer');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const supabase = supabaseAdmin;

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

router.delete('/empleado/:id/curso/:cursoId', async (req, res) => {
  const { id, cursoId } = req.params;
  
  try {
    const { data: curso, error: selectError } = await supabase
      .from('curso')
      .select('archivo')
      .eq('curso_id', cursoId)
      .eq('empleado_id', id)
      .single();
    
    if (selectError || !curso) {
      console.error('Error al obtener información del curso:', selectError?.message);
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }
    
    const fileNameMatch = curso.archivo.match(/\/([^\/]+)(?:\?|$)/);
    const fileName = fileNameMatch ? fileNameMatch[1] : null;
    
    if (fileName) {
      const { error: storageError } = await supabase.storage
        .from('cursos')
        .remove([fileName]);
      
      if (storageError) {
        console.error('Error al eliminar archivo:', storageError.message);
      }
    }
    
    const { error: deleteError } = await supabase
      .from('curso')
      .delete()
      .eq('curso_id', cursoId)
      .eq('empleado_id', id);
    
    if (deleteError) {
      console.error('Error al eliminar curso:', deleteError.message);
      return res.status(500).json({ success: false, error: 'No se pudo eliminar el curso' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Curso eliminado correctamente'
    });
    
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
