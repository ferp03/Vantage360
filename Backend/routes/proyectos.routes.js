const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const dotenv = require('dotenv');
dotenv.config();

// Ruta para obtener todos los proyectos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('proyecto')
      .select('*')
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.error('Error al obtener proyectos:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al obtener proyectos' 
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
      error: 'Error inesperado al obtener proyectos' 
    });
  }
});

// Ruta para obtener un proyecto específico por ID
router.get('/:proyecto_id', async (req, res) => {
  const { proyecto_id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('proyecto')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .single();

    if (error) {
      console.error('Error al obtener proyecto:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al obtener proyecto' 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proyecto no encontrado' 
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
      error: 'Error inesperado al obtener proyecto' 
    });
  }
});

// // Ruta para crear un nuevo proyecto
// router.post('/', async (req, res) => {
//   const { 
//     nombre, 
//     descripcion, 
//     fecha_inicio, 
//     fecha_fin, 
//     progreso, 
//     cargabilidad, 
//     delivery_lead, 
//     capabilities 
//   } = req.body;

//   // Validación básica de campos requeridos
//   if (!nombre || !fecha_inicio || !delivery_lead) {
//     return res.status(400).json({ 
//       success: false, 
//       error: 'Faltan campos requeridos: nombre, fecha_inicio o delivery_lead' 
//     });
//   }

//   try {
//     const { data, error } = await supabaseAdmin
//       .from('proyecto')
//       .insert([{
//         nombre,
//         descripcion,
//         fecha_inicio,
//         fecha_fin,
//         progreso: progreso || 0,
//         cargabilidad: cargabilidad || 0,
//         delivery_lead,
//         capabilities: capabilities || []
//       }])
//       .select();

//     if (error) {
//       console.error('Error al crear proyecto:', error.message);
//       return res.status(500).json({ 
//         success: false, 
//         error: 'Error al crear proyecto' 
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       message: 'Proyecto creado exitosamente',
//       data: data[0]
//     });

//   } catch (err) {
//     console.error('Error inesperado:', err);
//     return res.status(500).json({ 
//       success: false, 
//       error: 'Error inesperado al crear proyecto' 
//     });
//   }
// });

// Ruta para actualizar un proyecto
router.put('/:proyecto_id', async (req, res) => {
  const { proyecto_id } = req.params;
  const { 
    nombre, 
    descripcion, 
    fecha_inicio, 
    fecha_fin, 
    progreso, 
    cargabilidad, 
    delivery_lead, 
    capabilities 
  } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('proyecto')
      .update({
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin,
        progreso,
        cargabilidad,
        delivery_lead,
        capabilities
      })
      .eq('proyecto_id', proyecto_id)
      .select();

    if (error) {
      console.error('Error al actualizar proyecto:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al actualizar proyecto' 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proyecto no encontrado' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: data[0]
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error inesperado al actualizar proyecto' 
    });
  }
});

// Ruta para eliminar un proyecto
router.delete('/:proyecto_id', async (req, res) => {
  const { proyecto_id } = req.params;

  try {
    // Primero verificamos si el proyecto existe
    const { data: proyecto, error: selectError } = await supabaseAdmin
      .from('proyecto')
      .select('proyecto_id')
      .eq('proyecto_id', proyecto_id)
      .single();

    if (selectError || !proyecto) {
      console.error('Error al buscar proyecto:', selectError?.message);
      return res.status(404).json({ 
        success: false, 
        error: 'Proyecto no encontrado' 
      });
    }

    // Eliminamos el proyecto
    const { error: deleteError } = await supabaseAdmin
      .from('proyecto')
      .delete()
      .eq('proyecto_id', proyecto_id);

    if (deleteError) {
      console.error('Error al eliminar proyecto:', deleteError.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al eliminar proyecto' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error inesperado al eliminar proyecto' 
    });
  }
});

module.exports = router;