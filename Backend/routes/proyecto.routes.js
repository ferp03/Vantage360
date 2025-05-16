const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../supabase');
const supabase = supabaseAdmin;

router.get('/proyecto/getCapabilities', async (req, res) => {
    try{
        const { data, error } = await supabase      
            .from('capability')
            .select('capability_id, nombre')
            .order('nombre');
        
        if(error){
            console.log('Error de query');
            return res.status(400).json({success: false, error: 'No se pudo obtener capabilities'});
        }
        
        console.log(data);
        
        return res.status(200).json({success: true, data: data});
    }catch(error){
        res.status(400).json({success: false, error: "Hubo un error en el servidor"});
    }
});



module.exports = router;