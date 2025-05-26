const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const supabase = supabaseAdmin;

router.get('/empleado/:uuid/comentarios', async (req, res) => {
  try {
    const empleadoId = req.params.uuid;

    const { data, error } = await supabase
      .rpc('obtener_comentarios_detallados', { id: empleadoId });


    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron comentarios para este empleado' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/empleado/:uuid/comentarios', async (req, res) => {
  try {
    const { autor_id, empleado_comentado_id, proyecto_id, descripcion } = req.body;

    if (!autor_id || !empleado_comentado_id || !proyecto_id || !descripcion) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const { data, error } = await supabase
      .from('comentario') // nombre real de la tabla en singular
      .insert([
        {
          autor_id,
          empleado_comentado_id,
          proyecto_id,
          descripcion
        },
      ]);

    if (error) throw error;

    return res.status(201).json({ message: 'Comentario creado exitosamente', data });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


router.get('/empleado/:uuid/proyectos', async (req, res) => {
  try {
    const empleadoId = req.params.uuid;

    const { data, error } = await supabase
      .rpc('get_proyectos_actuales', { _id: empleadoId });


    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron proyectos para este empleado' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


module.exports = router;
