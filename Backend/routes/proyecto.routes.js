const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../api/supabase');
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

    return res.status(200).json({
      success: true,
      proyectos: data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener proyectos disponibles',
      details: err.toString()
    });
  }
});

//  proyectos actuales 
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
    return res.status(200).json({
      success: true,
      proyectos: data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener proyectos actuales',
      details: err.toString()
    });
  }
});

module.exports = router;
