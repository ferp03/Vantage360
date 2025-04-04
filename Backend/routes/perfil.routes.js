const express = require('express');
const router = express.Router();
const { supabaseAnon } = require('../supabase');
const supabase = supabaseAnon;

// Obtener info básica del empleado
router.get('/empleado/info/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('empleado')
    .select('nombre, apellido_paterno, apellido_materno, correo, usuario, fecha_ingreso, cargabilidad')
    .eq('empleado_id', id)
    .single();

  if (error || !data) {
    console.error('Error al obtener la información del empleado:', error?.message || 'No se encontró el usuario');
    return res.status(404).json({
      success: false,
      error: 'No se pudo obtener la información del empleado',
    });
  }

  const nombreCompleto = `${data.nombre} ${data.apellido_paterno} ${data.apellido_materno}`;
  
  return res.status(200).json({
    success: true,
    data: {
      nombre: nombreCompleto,
      correo: data.correo,
      usuario: data.usuario,
      desde: data.fecha_ingreso,
      cargabilidad: data.cargabilidad
    }
  });
});

// Habilidades
router.get('/empleado/:id/habilidades', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('empleado_habilidad')
    .select(`
      habilidad (
        nombre
      )
    `)
    .eq('empleado_id', id);

  if (error) {
    console.error('Error al obtener habilidades del empleado:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudieron obtener las habilidades' });
  }

  const habilidades = data.map(entry => entry.habilidad.nombre);

  return res.status(200).json({
    success: true,
    data: habilidades
  });
});

// Certificaciones
router.get('/empleado/:id/certificaciones', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('empleado_certificacion')
    .select(`
      certificacion:certificacion_id (
        nombre
      )
    `)
    .eq('empleado_id', id);

  if (error) {
    console.error('Error al obtener certificaciones:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudieron obtener las certificaciones' });
  }

  const certificaciones = data.map(entry => ({
    nombre: entry.certificacion.nombre
  }));

  return res.status(200).json({
    success: true,
    data: certificaciones
  });
});

// Obtener trayectoria laboral 
router.get('/empleado/:id/trayectoria', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('historial_laboral')
    .select('historial_id, titulo_puesto, empresa, descripcion, fecha_inicio, fecha_fin')
    .eq('empleado_id', id)
    .order('fecha_inicio', { ascending: false });

  if (error) {
    console.error('Error al obtener historial laboral:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudo obtener el historial laboral' });
  }

  const trayectoria = data.map(entry => ({
    historial_id: entry.historial_id,
    titulo: entry.titulo_puesto,
    empresa: entry.empresa,
    inicio: entry.fecha_inicio,
    fin: entry.fecha_fin,
    descripcion: entry.descripcion
  }));

  return res.status(200).json({
    success: true,
    data: trayectoria
  });
});

// Actualizar info básica 
router.put('/empleado/info/:id', async (req, res) => {
  const { id } = req.params;
  const { correo, usuario } = req.body;

  if (!correo || !usuario) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  const { error } = await supabase
    .from('empleado')
    .update({ correo, usuario })
    .eq('empleado_id', id);

  if (error) {
    console.error('Error al actualizar empleado:', error.message);
    return res.status(500).json({ success: false, error: 'Error al actualizar empleado' });
  }

  res.status(200).json({ success: true, message: 'Información actualizada correctamente' });
});

// Validar contraseña actual
router.get('/empleado/validar-contrasena/:id', async (req, res) => {
  const { id } = req.params;
  const { actualContrasena } = req.query;

  if (!actualContrasena) {
    return res.status(400).json({ success: false, error: 'Contraseña actual requerida' });
  }

  const { data, error } = await supabase
    .from('empleado')
    .select('contraseña')
    .eq('empleado_id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
  }

  if (data.contraseña !== actualContrasena) {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }

  return res.status(200).json({ success: true, message: 'Contraseña válida' });
});

// Cambiar contraseña
router.put('/empleado/cambiar-contrasena/:id', async (req, res) => {
  const { id } = req.params;
  const { nuevaContrasena } = req.body;

  if (!nuevaContrasena || nuevaContrasena.trim().length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  }

  const { error } = await supabase
    .from('empleado')
    .update({ contraseña: nuevaContrasena })
    .eq('empleado_id', id);

  if (error) {
    console.error('Error al cambiar contraseña:', error.message);
    return res.status(500).json({ success: false, error: 'Error al cambiar contraseña' });
  }

  return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
});

// Crear nueva experiencia laboral
router.post('/empleado/:id/experiencia', async (req, res) => {
  const { id } = req.params;
  const { titulo_puesto, empresa, descripcion, fecha_inicio, fecha_fin } = req.body;

  if (!titulo_puesto || !empresa || !descripcion || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  const { data, error } = await supabase
    .from('historial_laboral')
    .insert([{
      empleado_id: id,
      titulo_puesto,
      empresa,
      descripcion,
      fecha_inicio,
      fecha_fin
    }])
    .single(); 

  if (error) {
    console.error('Error al crear nueva experiencia:', error.message);
    return res.status(500).json({ success: false, error: 'Error al crear nueva experiencia' });
  }

  return res.status(201).json({ success: true, data });
});

// Actualizar experiencia laboral existente
router.put('/empleado/experiencia/:historial_id', async (req, res) => {
  const { historial_id } = req.params;
  const { titulo_puesto, empresa, descripcion, fecha_inicio, fecha_fin } = req.body;

  if (!titulo_puesto || !empresa || !descripcion || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  const { error } = await supabase
    .from('historial_laboral')
    .update({ 
      titulo_puesto, 
      empresa, 
      descripcion, 
      fecha_inicio, 
      fecha_fin 
    })
    .eq('historial_id', historial_id);

  if (error) {
    console.error('Error al actualizar experiencia:', error.message);
    return res.status(500).json({ success: false, error: 'Error al actualizar experiencia' });
  }

  return res.status(200).json({ success: true, message: 'Experiencia actualizada correctamente' });
});

module.exports = router;
