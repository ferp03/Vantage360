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

// obtener capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('capability')
      .select('capability_id, nombre')
      .order('nombre');

    if (error) {
      console.error('Error al obtener capabilities:', error.message);
      return res.status(500).json({ success: false, error: 'No se pudieron obtener las capabilities' });
    }

    // Transformar los datos para que coincidan con lo que espera el frontend
    const transformedData = data.map(item => ({
      id: item.capability_id,  // Mapear capability_id a id
      nombre: item.nombre
    }));

    return res.status(200).json({
      success: true,
      data: transformedData
    });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});
// Obtener trayectoria laboral 
router.get('/empleado/:id/trayectoria', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('historial_laboral')
    .select('historial_id, capability_id, proyecto_id, titulo_proyecto, empresa, descripcion, fecha_inicio, fecha_fin, es_puesto_actual')
    .eq('empleado_id', id)
    .order('fecha_inicio', { ascending: false });

  if (error) {
    console.error('Error al obtener historial laboral:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudo obtener el historial laboral' });
  }

  const trayectoria = data.map(entry => ({
    historial_id: entry.historial_id,
    titulo: entry.capability_id, // Usando capability_id como título temporalmente
    titulo_proyecto: entry.titulo_proyecto,
    empresa: entry.empresa,
    inicio: entry.fecha_inicio,
    fin: entry.fecha_fin,
    descripcion: entry.descripcion,
    capability_id: entry.capability_id,
    es_puesto_actual: entry.es_puesto_actual
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
  const { 
    titulo_puesto, 
    titulo_proyecto, 
    empresa, 
    descripcion, 
    fecha_inicio, 
    fecha_fin, 
    capability_id, 
    es_puesto_actual 
  } = req.body;

  if (!titulo_proyecto || !empresa || !descripcion || !fecha_inicio || !capability_id) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  try {
    // Usar fecha_fin null si es puesto actual
    const fecha_fin_final = es_puesto_actual ? null : fecha_fin;
    
    const { data, error } = await supabase
      .from('historial_laboral')
      .insert([{
        empleado_id: id,
        titulo_proyecto,
        empresa,
        descripcion,
        fecha_inicio,
        fecha_fin: fecha_fin_final,
        capability_id,
        es_puesto_actual
      }])
      .select();

      if (error) {
        console.error('Error al crear nueva experiencia:', error.message);
        return res.status(500).json({ success: false, error: 'Error al crear nueva experiencia' });
      }
  
      return res.status(201).json({ 
        success: true, 
        data: {
          historial_id: data[0].historial_id
        }
      });
    } catch (err) {
      console.error('Error inesperado:', err);
      return res.status(500).json({ success: false, error: 'Error del servidor' });
    }
  });

// Actualizar experiencia laboral existente
router.put('/empleado/experiencia/:historial_id', async (req, res) => {
  const { historial_id } = req.params;
  const { 
    titulo_puesto, // Este campo viene del frontend pero no se usa en la BD
    titulo_proyecto, 
    empresa, 
    descripcion, 
    fecha_inicio, 
    fecha_fin, 
    capability_id,
    es_puesto_actual
  } = req.body;

  if (!titulo_proyecto || !empresa || !descripcion || !fecha_inicio || !capability_id) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  // Usar fecha_fin null si es puesto actual
  const fecha_fin_final = es_puesto_actual ? null : fecha_fin;

  const { error } = await supabase
    .from('historial_laboral')
    .update({  
      titulo_proyecto,
      empresa, 
      descripcion, 
      fecha_inicio, 
      fecha_fin: fecha_fin_final,
      capability_id
    })
    .eq('historial_id', historial_id);

  if (error) {
    console.error('Error al actualizar experiencia:', error.message);
    return res.status(500).json({ success: false, error: 'Error al actualizar experiencia' });
  }

  return res.status(200).json({ success: true, message: 'Experiencia actualizada correctamente' });
});

// Eliminar experiencia laboral
router.delete('/empleado/experiencia/:historial_id', async (req, res) => {
  const { historial_id } = req.params;
  
  try {
    const { error } = await supabase
      .from('historial_laboral')
      .delete()
      .eq('historial_id', historial_id);

    if (error) {
      console.error('Error al eliminar experiencia:', error.message);
      return res.status(500).json({ success: false, error: 'Error al eliminar experiencia' });
    }

    return res.status(200).json({ success: true, message: 'Experiencia eliminada correctamente' });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Crear nueva habilidad y asociarla a un empleado
router.post('/empleado/:id/habilidad', async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, nivel, descripcion } = req.body;

  try {
    let { data: habilidadExiste, error: errorExiste } = await supabase
      .from('habilidad')
      .select('habilidad_id')
      .eq('nombre', nombre)
      .maybeSingle(); 

    let habilidadId = habilidadExiste ? habilidadExiste.habilidad_id : null;

    if (!habilidadId) {
      const { data: nuevaHabilidad, error: errorInsert } = await supabase
        .from('habilidad')
        .insert([{ nombre, categoria, nivel, descripcion }])
        .select()
        .single();

      if (errorInsert || !nuevaHabilidad) {
        console.error('Error al crear habilidad:', errorInsert);
        return res.status(500).json({ success: false, error: 'Error creando habilidad' });
      }
      habilidadId = nuevaHabilidad.habilidad_id;
    }

    const { data: relacionExistente, error: errorRelacionExistente } = await supabase
      .from('empleado_habilidad')
      .select('*')
      .eq('empleado_id', id)
      .eq('habilidad_id', habilidadId)
      .maybeSingle();

    if (relacionExistente) {
      return res.status(200).json({
        success: true,
        data: { habilidad_id: habilidadId, message: 'Habilidad ya asociada al empleado' }
      });
    }

    const { error: errorRelacion } = await supabase
      .from('empleado_habilidad')
      .insert([{
        empleado_id: id,
        habilidad_id: habilidadId
      }]);

    if (errorRelacion) {
      console.error('Error al asociar habilidad:', errorRelacion);
      return res.status(500).json({ success: false, error: 'Error asociando habilidad al empleado' });
    }

    return res.status(200).json({
      success: true,
      data: { habilidad_id: habilidadId, message: 'Habilidad agregada correctamente' }
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

module.exports = router;