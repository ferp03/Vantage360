import express from 'express';
import { supabaseAdmin } from '../api/supabase.js';
const router = express.Router();
const supabase = supabaseAdmin;

router.get('/proyecto/check-schema', async (req, res) => {
  try {
    const { data: tableInfo, error: tableError } = await supabase
      .from('proyecto')
      .select('*')
      .limit(1);
      
    if (tableError) {
      return res.status(500).json({
        success: false,
        error: 'Error accessing table',
        details: tableError
      });
    }

    const { data: capabilitiesInfo, error: capabilitiesError } = await supabase
      .from('capability')
      .select('*')
      .limit(5);
      
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'proyectos');
    
    return res.status(200).json({
      success: true,
      tableData: tableInfo,
      capabilities: capabilitiesInfo,
      schema: columnInfo || 'Not available'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error checking database schema',
      details: err.toString()
    });
  }
});

router.post('/proyecto', async (req, res) => {
  try {
    const {
      delivery_lead,
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      progreso = 0,
      cargabilidad = null,
      capabilities,
      habilidades
    } = req.body;

    if (!nombre || !delivery_lead) {
      return res.status(400).json({
        success: false,
        error: 'Los campos nombre y delivery_lead son obligatorios'
      });
    }

    const projectData = {
      delivery_lead,
      nombre,
      descripcion: descripcion || null,
      fecha_inicio: fecha_inicio || null,  
      fecha_fin:    fecha_fin    || null,
      progreso,
      cargabilidad,
      capabilities
    };

    console.log(projectData);

    const { data, error } = await supabase
      .from('proyecto')
      .insert(projectData)
      .select();

    if (error) {
      console.log('Error al insertar proyecto', error)
      return res.status(400).json({
        success: false,
        error: error.message || 'Error desconocido',
        details: error
      });    
    }

    console.log('Proyecto creado');

    const proyecto_id = data[0].proyecto_id;

    const relacion_empleado = {
      empleado_id: delivery_lead,
      proyecto_id: proyecto_id
    };

    const { error2 } = await supabase
      .from('empleado_proyecto')
      .insert(relacion_empleado);

    if(error2) {
      console.log(error2);
      return res.status(400).json({success: false, error: error2.message});
    }
    console.log('Empleado relacionado');

    const habilidadesPayload = habilidades.map(h => ({
      proyecto_id,
      habilidad_id: h.habilidad_id,
      nivel_esperado: h.nivel
    }));


    console.log(habilidadesPayload);

    const { error: errorHabs } = await supabase
      .from('proyecto_habilidad')
      .insert(habilidadesPayload);

    if (errorHabs) {
      console.log(errorHabs)
      return res.status(400).json({
        success: false,
        error: errorHabs.message || 'Error insertando habilidades',
        details: errorHabs
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Proyecto guardado',
      data: data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error del servidor al guardar el proyecto',
      details: err.toString()
    });
  }
});

// proyectos disponibles
router.get('/proyecto/disponibles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .rpc('get_projectos_disponibles', { _id: userId });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Error al obtener proyectos disponibles',
        details: error
      });
    }

    // Transform data to include lead information
    const proyectos = data.map(proyecto => ({
      ...proyecto,
      delivery_lead: {
        id: proyecto.id_lead,
        nombre: proyecto.nombre_lead
      }
    }));

    return res.status(200).json({
      success: true,
      proyectos: proyectos
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener proyectos disponibles',
      details: err.toString()
    });
  }
});

// proyectos actuales 
router.get('/proyecto/actuales/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .rpc('get_proyectos_actuales', { _id: userId });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Error al obtener proyectos actuales',
        details: error
      });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'El usuario no tiene proyectos actuales',
        proyectos: []
      });
    }

    // Transform data to include lead information
    const proyectos = data.map(proyecto => ({
      ...proyecto,
      delivery_lead: {
        id: proyecto.id_lead,
        nombre: proyecto.nombre_lead
      }
    }));

    return res.status(200).json({
      success: true,
      proyectos: proyectos
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener proyectos actuales',
      details: err.toString()
    });
  }
});

// Unirse a un proyecto
router.post('/proyecto/unirse', async (req, res) => {
  try {
    const { empleado_id, proyecto_id } = req.body;

    if (!empleado_id || !proyecto_id) {
      return res.status(400).json({
        success: false,
        error: 'Los campos empleado_id (UUID) y proyecto_id (número) son obligatorios'
      });
    }

    // Verificar que el proyecto existe primero
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyecto')
      .select('proyecto_id')
      .eq('proyecto_id', proyecto_id)
      .single();

    if (proyectoError || !proyecto) {
      return res.status(404).json({
        success: false,
        error: 'El proyecto no existe'
      });
    }

    // Verificar que el empleado no está ya en el proyecto
    const { data: existente, error: existeError } = await supabase
      .from('empleado_proyecto')
      .select()
      .eq('empleado_id', empleado_id)
      .eq('proyecto_id', proyecto_id)
      .maybeSingle();

    if (existeError) {
      return res.status(500).json({
        success: false,
        error: 'No se pudo verificar que el empelado no esté registrado en el proyecto'
      });
    }

    if (existente) {
      return res.status(409).json({
        success: false,
        error: 'El empleado ya está asignado a este proyecto'
      });
    }

    // Insertar solicitud del empleado
    const { data: dataSolicitud, error: errorSolicitud } = await supabase.from('proyecto_solicitud').insert({
      proyecto_id,
      solicitante_id: empleado_id,
      fecha_emision: new Date().toISOString().split('T')[0],
      status: 'Pendiente'
    });
    if(errorSolicitud) {
      if(errorSolicitud.message === 'duplicate key value violates unique constraint "proyecto_solicitud_solicitante_id_proyecto_id_key"'){
        return res.status(400).json({ success: false, error: 'Ya tienes una solicitud pendiente de revisión.' });
      }
      return res.status(400).json({ success: false, error: errorSolicitud.message  });
    }

    return res.status(201).json({
      success: true,
      message: 'Solicitud enviada correctamente',
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: err.message
    });
  }
});



// Editar un proyecto
router.put('/proyecto/:id', async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.id);
    const { userId, ...updateData } = req.body; 

    if (isNaN(proyectoId)) {
      return res.status(400).json({ success: false, error: 'ID de proyecto inválido' });
    }

    const { data: proyectoExistente, error: proyectoError } = await supabase
      .from('proyecto')
      .select('delivery_lead')
      .eq('proyecto_id', proyectoId)
      .single();

    if (proyectoError || !proyectoExistente) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    if (!userId) {
      return res.status(403).json({ success: false, error: 'No autorizado para editar este proyecto' });
    }

    if (updateData.progreso && (updateData.progreso < 0 || updateData.progreso > 100)) {
      return res.status(400).json({ success: false, error: 'El progreso debe estar entre 0 y 100' });
    }

    const { data, error } = await supabase
      .from('proyecto')
      .update(updateData)
      .eq('proyecto_id', proyectoId)
      .select();

    if (error) {
      console.error('Error en Supabase:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, proyecto: data[0] });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para actualizar habilidades del proyecto
router.put('/proyecto/:id/habilidades', async (req, res) => {
  try {
    const { id } = req.params;
    const { habilidades } = req.body; 

    await supabase
      .from('proyecto_habilidad')
      .delete()
      .eq('proyecto_id', id);
    const nuevasHabilidades = habilidades.map(h => ({
      proyecto_id: id,
      habilidad_id: h.habilidad_id,
      nivel_esperado: h.nivel_esperado
    }));

    const { data, error } = await supabase
      .from('proyecto_habilidad')
      .insert(nuevasHabilidades);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/proyecto/:id/integrantes/', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data, error } = await supabase.rpc('get_integrantes_proyecto', {
      _id: id 
    });
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data: data });

  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Ruta para eliminar un proyecto
router.delete('/proyecto/:id', async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.id);
    
    if (isNaN(proyectoId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de proyecto inválido' 
      });
    }

    // Eliminar en cascada sin verificar permisos (el frontend ya lo hace)
    const { error } = await supabase.rpc('delete_project_cascade', { 
      project_id: proyectoId 
    });

    if (error) {
      console.error('Error al eliminar proyecto:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar el proyecto',
        details: error.message
      });
    }

    return res.json({ 
      success: true, 
      message: 'Proyecto eliminado correctamente' 
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: err.message
    });
  }
});


router.get('/proyecto/:id/solicitudes', async (req, res) => {
  try{
    const id = Number(req.params.id);
    const { data, error } = await supabase.rpc('get_solicitudes', {_id: id});
    console.log(error);
    if(error) return res.status(400).json({ success: false, error: 'No se pudieron obtener las solicitudes' });

    return res.status(200).json({ success: true, data: data })

  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/proyecto/:id/rechazar-solicitud', async (req, res) => {
  try{
    const id = Number(req.params.id);
    const { solicitante_id } = req.body;
    const { error } = await supabase
      .from('proyecto_solicitud')
      .update({
      status: 'Rechazado',
      fecha_emision: new Date().toISOString().split('T')[0]
      })
      .eq('proyecto_id', id)
      .eq('solicitante_id', solicitante_id);

    if(error) return res.status(400).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, message: 'Empleado rechazado en el proyecto.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Error de servidor. ${err.message}`});
  }
});

router.put('/proyecto/:id/aceptar-solicitud', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { solicitante_id, capability } = req.body;
    console.log(solicitante_id, capability);

    // Obtener el JSON actual de capabilities
    const { data: proyecto, error: capabilitiesError } = await supabase
      .from('proyecto')
      .select('capabilities')
      .eq('proyecto_id', id)
      .single();

    if (capabilitiesError || !proyecto) {
      return res.status(400).json({ success: false, error: 'No se pudo obtener el proyecto o capabilities.' });
    }

    const capabilitiesWrapper = proyecto.capabilities;

    let actualizarJSON = false;

    // Si la capability existe en el JSON y tiene al menos 1 cupo, restamos 1
    if (
      capabilitiesWrapper &&
      capabilitiesWrapper.capabilities &&
      capabilitiesWrapper.capabilities.puestos &&
      capabilitiesWrapper.capabilities.puestos[capability] !== undefined &&
      capabilitiesWrapper.capabilities.puestos[capability] > 0
    ) {
      capabilitiesWrapper.capabilities.puestos[capability] -= 1;
      actualizarJSON = true;
    }

    // Insertar al empleado en el proyecto
    const { error: errorInsert } = await supabase.from('empleado_proyecto').insert({
      empleado_id: solicitante_id,
      proyecto_id: id
    });

    if (errorInsert) {
      return res.status(400).json({ success: false, error: errorInsert.message });
    }

    // Actualizar el estado de la solicitud a 'Aceptado'
    const { error: errorSolicitud } = await supabase
      .from('proyecto_solicitud')
      .update({
        status: 'Aceptado',
        fecha_emision: new Date().toISOString().split('T')[0]
      })
      .eq('proyecto_id', id)
      .eq('solicitante_id', solicitante_id);

    if (errorSolicitud) {
      return res.status(400).json({ success: false, error: errorSolicitud.message });
    }

    // Solo si hay cambios en el JSON, actualízalo en la base de datos
    if (actualizarJSON) {
      const { error: updateError } = await supabase
        .from('proyecto')
        .update({ capabilities: capabilitiesWrapper })
        .eq('proyecto_id', id);

      if (updateError) {
        return res.status(400).json({ success: false, error: updateError.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: actualizarJSON
        ? 'Empleado aceptado y capabilities actualizadas.'
        : 'Empleado aceptado, las capabilities no fueron modificadas.'
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: `Error de servidor. ${err.message}` });
  }
});


router.delete('/proyecto/eliminar-solicitud/:solicitudId', async (req, res) => {
  try {
    const id = Number(req.params.solicitudId);

    console.log('Solicitud a eliminar:', id);

    if (!id) {
      return res.status(400).json({ success: false, error: 'El campo empleado_id es obligatorio' });
    }

    const { error } = await supabase
      .from('proyecto_solicitud')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Solicitud eliminada correctamente' });

  } catch (err) {
    return res.status(500).json({ success: false, error: `Error de servidor. ${err.message}` });
  }
});

export default router;