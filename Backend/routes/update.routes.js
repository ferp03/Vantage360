const express = require('express');
const router = express.Router();
const { supabaseAnon } = require('../supabase');
const supabase = supabaseAnon;

router.put('/update', async (req, res) => {
    try {
        const { empleado_id, username, email, password, name, patlastname, matlastname } = req.body;

        if (!empleado_id) {
            return res.status(400).json({ error: 'El campo empleado_id es obligatorio' });
        }

        const { error } = await supabase
            .from('empleado')
            .update({
                usuario: username,
                correo: email,
                contraseña: password,
                nombre: name,
                apellido_paterno: patlastname,
                apellido_materno: matlastname || null,
            })
            .eq('empleado_id', empleado_id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'Empleado actualizado exitosamente' });

    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
});

module.exports = router;
