import express from 'express';
import { supabaseAdmin } from '../api/supabase.js';
const router = express.Router();
const supabase = supabaseAdmin;

router.get('/ciudades', async (req, res) =>{
    try{

        const { data, error } = await supabase
        .from('ciudades')
        .select('ciudad_id, nombre')
        .order('nombre');
        
        if (data) {
            const transformedData = data.map(item => ({
            id: item.ciudad_id,
            nombre: item.nombre
            }));
            return res.status(200).json({success: true, data: transformedData});
        }
        
        return res.status(400).json({success: false, error: error});
    }catch (err){
        console.error('Error inesperado:', err);
        return res.status(500).json({ success: false, error: 'Error del servidor' });
    }
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


router.get('/leads', async (req, res) => {
  try{
    const { data, error } = await supabase.rpc('get_people_leads')
    if(error){
      return res.status(400).json({success: false, error: error});
    }

    return res.status(200).json({success: true, data: data});

  } catch (err){
    return res.status(500).json({success: false, error: 'Error del servidor: ', err});
  }
})

router.get('/habilidades', async (req, res) => {
  try{
    const { data, error } = await supabase
      .from('_habilidad')
      .select('*');

    if(error) {
      return res.status(400).json({success: false, error: error});
    }

    return res.status(200).json({success: true, data: data});

  } catch (err) {
    return res.status(500).json({success: false, error: 'Error del servidor: ', err});
  }
})

// Editar una habilidad
router.put('/empleado/:id/habilidad/:habilidad_id', async (req, res) => {
  const { id, habilidad_id } = req.params;
  const { nivel, descripcion } = req.body;

  try {
    const { error } = await supabase
      .from('_empleado_habilidad')
      .update({ nivel, descripcion })
      .eq('empleado_id', id)
      .eq('habilidad_id', habilidad_id);

    if (error) {
      console.error('Error al actualizar habilidad:', error.message);
      return res
        .status(500)
        .json({ success: false, error: 'No se pudo actualizar la habilidad del empleado' });
    }

    return res.status(200).json({ success: true, message: 'Habilidad actualizada correctamente' });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

export default router;