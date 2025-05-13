const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../supabase');
const dotenv = require('dotenv');
dotenv.config();

// Configuración de Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para obtener todos los certificados de un empleado
router.get('/empleado/api/:empleado_id', async (req, res) => {
  const { empleado_id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('certificacion')
      .select('*')
      .eq('empleado_id', empleado_id);

    if (error) {
      console.error('Error al obtener certificados:', error.message);
      return res.status(500).json({ error: 'Error al obtener certificados' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ error: 'Error inesperado al obtener certificados' });
  }
});

// Ruta para subir certificados
router.post('/certificado', upload.single('archivo'), async (req, res) => {
  const { nombre, institucion, fecha_emision, fecha_vencimiento, empleado_id } = req.body;
  const archivo = req.file;

  // Validación de campos
  //if (!archivo || !nombre || !institucion || !fecha_emision || !fecha_vencimiento || !empleado_id) {
    //return res.status(400).json({ 
      //success: false, 
      //error: 'Faltan campos requeridos: archivo, nombre, institución, fechas o ID de empleado' 
    //});
  //}

  try {
    // 1. Subir archivo al bucket "certificaciones"
    const fileName = `certificaciones/${Date.now()}_${archivo.originalname}`;
    console.log(`Subiendo archivo ${fileName}...`);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('certificaciones')
      .upload(fileName, archivo.buffer, {
        contentType: archivo.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Error al subir el archivo: ' + uploadError.message
      });
    }

    // 2. Obtener URL pública con mayor tiempo de expiración (7 días)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificaciones')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 días de validez

    if (signedUrlError) {
      console.error('Error al generar URL:', signedUrlError);
      return res.status(500).json({
        success: false,
        error: 'Error al generar URL del archivo: ' + signedUrlError.message
      });
    }

    // 3. Insertar metadatos en la tabla certificacion
    const { data, error: dbError } = await supabaseAdmin
      .from('certificacion')
      .insert([{
        nombre,
        institucion,
        fecha_emision,
        fecha_vencimiento,
        empleado_id,
        archivo: signedUrlData.signedUrl
      }])
      .select();

    if (dbError) {
      console.error('Error en base de datos:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Error al guardar en base de datos: ' + dbError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Certificado subido correctamente',
      data: {
        certificado_id: data[0].certificacion_id,
        archivo: signedUrlData.signedUrl
      }
    });

  } catch (err) {
    console.error('Error completo:', err);
    return res.status(500).json({
      success: false,
      error: 'Error inesperado: ' + err.message
    });
  }
});

// Ruta para obtener certificados de un empleado
router.get('/empleado/:empleado_id/certificados', async (req, res) => {
  const { empleado_id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('certificacion')
      .select('*')
      .eq('empleado_id', empleado_id)
      .order('fecha_emision', { ascending: false });

    if (error) {
      console.error('Error al obtener certificados:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al obtener certificados' 
      });
    }

    return res.status(200).json({ 
      success: true,
      data 
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error inesperado al obtener certificados' 
    });
  }
});


// Ruta para crear nuevo certificado
router.post('/certificado', async (req, res) => {
  const { nombre, fecha_emision, fecha_vencimiento, institucion, archivo, empleado_id } = req.body;
  
  if (!nombre || !fecha_emision || !fecha_vencimiento || !institucion || !archivo || !empleado_id) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('certificacion')
      .insert([{
        nombre,
        fecha_emision,
        fecha_vencimiento,
        institucion,
        archivo,
        empleado_id
      }])
      .select(); // Esto devuelve el registro insertado

    if (error) {
      console.error('Error al guardar certificado:', error.message);
      return res.status(500).json({ success: false, error: 'Error al guardar certificado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Certificado guardado exitosamente',
      data: data[0] // Devuelve el primer (y único) registro insertado
    });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error inesperado al guardar certificado' });
  }
});

// Ruta para eliminar certificado
router.delete('/:capability_id', async (req, res) => {
  const { capability_id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('certificacion')
      .delete()
      .eq('capability_id', capability_id);

    if (error) {
      console.error('Error al eliminar certificado:', error.message);
      return res.status(500).json({ success: false, error: 'Error al eliminar certificado' });
    }

    return res.status(200).json({ success: true, message: 'Certificado eliminado exitosamente' });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error inesperado al eliminar certificado' });
  }
});

router.delete('/certificado/:certificacion_id', async (req, res) => {
  const { certificacion_id } = req.params;

  try {
    const { data: certificado, error: selectError } = await supabaseAdmin
      .from('certificacion')
      .select('archivo')
      .eq('certificacion_id', certificacion_id)
      .single();
    
    if (selectError || !certificado) {
      console.error('Error al obtener información del certificado:', selectError?.message);
      return res.status(404).json({ success: false, error: 'Certificado no encontrado' });
    }
    
    const fileNameMatch = certificado.archivo.match(/\/([^\/]+)(?:\?|$)/);
    const fileName = fileNameMatch ? fileNameMatch[1] : null;
    
    if (fileName) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('certificaciones')
        .remove([`certificaciones/${fileName}`]);
      
      if (storageError) {
        console.error('Error al eliminar archivo de certificado:', storageError.message);
      }
    }
    
    const { error: deleteError } = await supabaseAdmin
      .from('certificacion')
      .delete()
      .eq('certificacion_id', certificacion_id);
    
    if (deleteError) {
      console.error('Error al eliminar certificado de la base de datos:', deleteError.message);
      return res.status(500).json({ success: false, error: 'No se pudo eliminar el certificado' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Certificado eliminado correctamente'
    });
    
  } catch (err) {
    console.error('Error inesperado al eliminar certificado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;