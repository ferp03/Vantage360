const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAnon } = require('../supabase');
const dotenv = require('dotenv');
dotenv.config();

const upload = multer();
// Ruta para obtener todos los certificados de un empleado
router.get('/empleado/api/:empleado_id', async (req, res) => {
  const { empleado_id } = req.params;

  try {
    const { data, error } = await supabaseAnon
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

// Ruta para subir archivo
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

// Ruta para crear nuevo certificado
router.post('/certificado', async (req, res) => {
  const { nombre, fecha_emision, fecha_vencimiento, institucion, archivo, empleado_id } = req.body;
  
  if (!nombre || !fecha_emision || !fecha_vencimiento || !institucion || !archivo || !empleado_id) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  try {
    const { data, error } = await supabaseAnon
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
    const { error } = await supabaseAnon
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

module.exports = router;