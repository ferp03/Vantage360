import express from 'express';
import { supabaseAdmin } from '../api/supabase.js';
const router = express.Router();
const supabase = supabaseAdmin;

// Obtener info básica del empleado
router.get('/empleado/info/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .rpc('get_empleados_con_info_all')
    .eq('empleado_id', id)
    .single();

  if (error || !data) {
    console.error('Error al obtener la información del empleado:', error?.message || 'No se encontró el usuario');
    return res.status(404).json({
      success: false,
      error: 'No se pudo obtener la información del empleado',
    });
  }
  
  let nombreCompleto = `${data.nombre} ${data.apellido_paterno}`;

  if(data.apellido_materno){
    nombreCompleto = `${data.nombre} ${data.apellido_paterno} ${data.apellido_materno}`;
  }

  return res.status(200).json({
    success: true,
    data: {
      nombre: nombreCompleto,
      correo: data.email,
      usuario: data.usuario,
      desde: data.fecha_ingreso,
      cargabilidad: data.cargabilidad,
      nivel: data.nivel,
      nivel_grupo: data.nivel_grupo,
      nivel_ingles: data.nivel_ingles,
      staff_days: data.staff_days,
      ytd_unassigned: data.ytd_unassigned,
      ytd_recovery: data.ytd_recovery,
      bd: data.bd,
      estado_laboral: data.estado_laboral,
      lead_usuario: data.lead_usuario,
      lead_id: data.lead_id,
      ubicacion: data.ubicacion,
      titulo_proyecto: data.titulo_proyecto,
      fecha_inicio: data.fecha_inicio,
      capability_proyecto: data.capability_proyecto,
    }
  });
});

// Habilidades
router.get('/empleado/:id/habilidades', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('_empleado_habilidad')
      .select(`
        habilidad_id,
        nivel,
        descripcion,
        habilidad:_habilidad (
          nombre,
          categoria
        ),
        nivel,
        descripcion
      `)
      .eq('empleado_id', id);

    if (error) {
      console.error('Error al obtener habilidades del empleado:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: 'No se pudieron obtener las habilidades' 
      });
    }

    // Mapear los datos a un formato más conveniente
    const habilidades = data.map(entry => ({
      id: entry.habilidad_id,
      nombre: entry.habilidad.nombre,
      categoria: entry.habilidad.categoria,
      nivel: entry.nivel || 'Nivel no especificado',
      descripcion: entry.descripcion || 'Sin descripción'
    }));

    return res.status(200).json({
      success: true,
      data: habilidades
    });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

// Certificaciones
router.get('/empleado/:id/certificaciones', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('certificacion')
    .select('nombre')
    .eq('empleado_id', id);

  if (error) {
    console.error('Error al obtener certificaciones:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudieron obtener las certificaciones' });
  }

  const certificaciones = data.map(entry => ({
    nombre: entry.nombre
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
    .rpc('obtener_trayectoria_con_habilidades', {p_empleado_id: id});

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
    es_puesto_actual: entry.es_puesto_actual,
    habilidades: entry.habilidades
  }));

  return res.status(200).json({
    success: true,
    data: trayectoria
  });
});

// Actualizar info básica 
router.put('/empleado/info/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario, estado_laboral, ciudad_id } = req.body;

  if (!estado_laboral || !usuario || !ciudad_id) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  // verificar que el usuario no exista
  const { data: existeUsuario } = await supabase
    .from('empleado')
    .select('usuario')
    .eq('usuario', usuario)
    .neq('empleado_id', id)
    .maybeSingle();
  
  if(existeUsuario) {
    console.log('usuario existente');
    return res.status(400).json({success: false, error: 'El usuario ya existe, eliga otro.'});
  }

  let updateFields = { usuario, estado_laboral };
  if (ciudad_id !== 0) {
    updateFields.ciudad_id = ciudad_id;
  }

  const { error } = await supabase
    .from('empleado')
    .update(updateFields)
    .eq('empleado_id', id);

  if (error) {
    console.error('Error al actualizar empleado:', error.message);
    return res.status(400).json({ success: false, error: 'Error al actualizar empleado' });
  }

  res.status(200).json({ success: true, message: 'Información actualizada correctamente' });
});

// Validar contraseña actual
router.post('/empleado/validar-contrasena/:id', async (req, res) => {
  const { id } = req.params;
  const { email, actualContrasena } = req.body;

  console.log(email);
  console.log(actualContrasena);
  

  // Verificar contraseña con signIn
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: actualContrasena
  });

  if (loginError) {
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  }

  return res.status(200).json({ success: true, message: 'Contraseña válida' });
});

router.put('/empleado/cambiar-contrasena/:id', async (req, res) => {
  const { id } = req.params;
  const { nuevaContrasena } = req.body;

  if (!nuevaContrasena || nuevaContrasena.trim().length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    password: nuevaContrasena
  });

  if (error) {
    console.error('Error al cambiar contraseña:', error.message);
    return res.status(500).json({ success: false, error: 'Error al cambiar contraseña' });
  }

  return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
});

// Guardar los cambios hechos en el perfil del empleado
router.put('/empleado/cambiar-datos/:id', async (req, res) => {
  const { id } = req.params;
  const { estado_laboral } = req.body;

  const {data, error} = await supabase
    .from('empleado')
    .update({estado_laboral: estado_laboral})
    .eq('empleado_id', id);

  if(error){
    console.log('Error al cambiar el estado laboral', error.message);
    return res.status(500).json({ success: false, error: 'Error al cambiar el estado laboral' });
  }

  return res.status(200).json({ success: true, message: 'Estado laboral actualizado correctamente' });
})

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
    es_puesto_actual,
    habilidades
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

    const historial_id = data[0].historial_id;

    if(habilidades) {
      if (Array.isArray(habilidades) && habilidades.length > 0) {
        const habilidadesInsert = habilidades.map(h => ({
          historial_id: Number(historial_id),
          habilidad_id: h.habilidad_id,
          nivel_obtenido: h.nivel
        }));

        console.log(habilidadesInsert);
        const { error: errorHabilidades } = await supabase
          .from('historial_habilidad')
          .insert(habilidadesInsert);

        if (errorHabilidades) {
          return res.status(400).json({ success: false, error: 'Error al insertar habilidades a la trayectoria', errorHabilidades });
        }
      }
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
    es_puesto_actual,
    habilidades
  } = req.body;

  if (!titulo_proyecto || !empresa || !descripcion || !fecha_inicio || !capability_id) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  console.log(habilidades);
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

  if(habilidades){
    // Borrar habilidades del proyecto y volver a insertar las que vienen en el json
    const { errorBorrar } = await supabase.from('historial_habilidad').delete().eq('historial_id',historial_id);
    if (errorBorrar){
      return res.status(400).json({success: false, error: 'Error al borrar habilidades pasadas'});
    }

    console.log('Habilidades borradas');
  
    if (Array.isArray(habilidades) && habilidades.length > 0) {
      const habilidadesInsert = habilidades.map(h => ({
        historial_id: Number(historial_id),
        habilidad_id: h.habilidad_id,
        nivel_obtenido: h.nivel
      }));

      console.log(habilidadesInsert);
      const { error: errorHabilidades } = await supabase
        .from('historial_habilidad')
        .insert(habilidadesInsert);

      if (errorHabilidades) {
        return res.status(400).json({ success: false, error: 'Error al insertar habilidades nuevas', errorHabilidades });
      }
    }
  }


  return res.status(200).json({ success: true, message: 'Experiencia actualizada correctamente' });
});

// Eliminar experiencia laboral
router.delete('/empleado/experiencia/:historial_id', async (req, res) => {
  try {
    // Convertir explícitamente a número
    const historial_id = Number(req.params.historial_id);
    
    console.log(`Intentando eliminar experiencia con ID: ${historial_id}, tipo: ${typeof historial_id}`);
    
    // Verificar si el ID es válido
    if (isNaN(historial_id)) {
      console.error('ID de historial inválido:', req.params.historial_id);
      return res.status(400).json({ 
        success: false, 
        error: 'ID de historial inválido' 
      });
    }

    // borrar habilidades ligadas al proyecto
    const { errorBorrar } = await supabase.from('historial_habilidad').delete('*').eq('historial_id',historial_id);
    if (errorBorrar){
      return res.status(400).json({success: false, error: 'Error al borrar habilidades'});
    }

    // Ejecutar la eliminación con el ID numérico
    const { data, error } = await supabase
      .from('historial_laboral')
      .delete()
      .eq('historial_id', historial_id)
      .select(); 
    
    // Comprobar si hubo error en base de datos
    if (error) {
      console.error('Error de Supabase al eliminar experiencia:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Error al eliminar experiencia: ${error.message}`,
        details: error
      });
    }
    console.log(`Experiencia con ID ${historial_id} eliminada correctamente`);
    return res.status(200).json({ 
      success: true, 
      message: 'Experiencia eliminada correctamente' 
    });
  } catch (err) {
    console.error('Error inesperado al eliminar experiencia:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error del servidor', 
      details: err.message 
    });
  }
});

// Crear nueva habilidad y asociarla a un empleado con nivel y descripción
router.post('/empleado/:id/habilidad', async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, nivel, descripcion } = req.body;

  try {
    // Buscar si la habilidad ya existe
    let { data: habilidadExiste, error: errorExiste } = await supabase
      .from('_habilidad')
      .select('habilidad_id')
      .eq('nombre', nombre)
      .maybeSingle();

    let habilidadId = habilidadExiste ? habilidadExiste.habilidad_id : null;

    // Si no existe, la creamos
    if (!habilidadId) {
      const { data: nuevaHabilidad, error: errorInsert } = await supabase
        .from('_habilidad')
        .insert([{ nombre, categoria }])
        .select()
        .single();

      if (errorInsert || !nuevaHabilidad) {
        console.error('Error al crear habilidad:', errorInsert);
        return res.status(500).json({ success: false, error: 'Error creando habilidad' });
      }
      habilidadId = nuevaHabilidad.habilidad_id;
    }

    // Verificar si ya existe la relación entre ese empleado y esa habilidad
    const { data: relacionExistente, error: errorRelacionExistente } = await supabase
      .from('_empleado_habilidad')
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

    // Crear la relación con nivel y descripción
    const { error: errorRelacion } = await supabase
      .from('_empleado_habilidad')
      .insert([{
        empleado_id: id,
        habilidad_id: habilidadId,
        nivel,
        descripcion
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

// Eliminar una habilidad asociada a un empleado
router.delete('/empleado/:id/habilidad/:habilidad_id', async (req, res) => {
  const { id, habilidad_id } = req.params;

  try {
    const { error } = await supabase
      .from('_empleado_habilidad')
      .delete()
      .eq('empleado_id', id)
      .eq('habilidad_id', habilidad_id);

    if (error) {
      console.error('Error al quitar habilidad:', error.message);
      return res
        .status(500)
        .json({ success: false, error: 'No se pudo eliminar la habilidad del empleado' });
    }

    return res.status(200).json({ success: true, message: 'Habilidad desvinculada' });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

router.get('/empleado/:id/solicitudes', async (req, res) => {
 try {
  const _id = req.params.id;
  const { data, error } = await supabase.rpc('get_solicitudes_empleado', {_id});

  if(error) return res.status(400).json({ success: false, error: error.message});

  if(!data) {
    return res.status(404).json({ success: false, message: 'No se encontraron solicitudes para este empleado' });
  }

  console.log('Solicitudes obtenidas:', data);
  return res.status(200).json({ success: true, data });

 } catch (err) {
  return res.status(500).json({ success: false, error: 'Error del servidor al obtener solicitudes' });
 }
});

router.get('/lead/:id/solicitudes', async (req, res) => {
 try {
  const _id = req.params.id;
  const { data, error } = await supabase.rpc('get_solicitudes_proyectos_delivery_lead', {_id});

  if(error) return res.status(400).json({ success: false, error: error.message});

  if(!data) {
    return res.status(404).json({ success: false, message: 'No se encontraron solicitudes para este empleado' });
  }

  console.log('Solicitudes obtenidas:', data);
  return res.status(200).json({ success: true, data });

 } catch (err) {
  return res.status(500).json({ success: false, error: 'Error del servidor al obtener solicitudes' });
 }
});

export default router;