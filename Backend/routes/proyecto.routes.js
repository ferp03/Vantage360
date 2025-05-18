const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../supabase');
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
      capabilities
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

    const { data, error } = await supabase
      .from('proyecto')
      .insert(projectData)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Error desconocido',
        details: error
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

module.exports = router;
