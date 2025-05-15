const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const supabase = supabaseAdmin;

// Funciones de validación
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);
const isNonEmpty = (value) => typeof value === 'string' && value.trim() !== '';
const isValidName = (name) => /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s'-]+$/.test(name);
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6;

router.put('/update', async (req, res) => {
    try {
        const { empleado_id, username, email, password, name, patlastname, matlastname } = req.body;

        if (!empleado_id) {
            return res.status(400).json({ error: 'El campo empleado_id es obligatorio' });
        }

        // Validaciones de formato y contenido
        if (!isNonEmpty(username) || !isValidUsername(username)) {
            return res.status(400).json({ error: 'El nombre de usuario no es válido' });
        }

        if (!isNonEmpty(email) || !isValidEmail(email)) {
            return res.status(400).json({ error: 'El correo electrónico no es válido' });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        if (!isNonEmpty(name) || !isValidName(name)) {
            return res.status(400).json({ error: 'El nombre no es válido' });
        }

        if (!isNonEmpty(patlastname) || !isValidName(patlastname)) {
            return res.status(400).json({ error: 'El apellido paterno no es válido' });
        }

        if (matlastname && !isValidName(matlastname)) {
            return res.status(400).json({ error: 'El apellido materno no es válido' });
        }

        // Verificar si el username ya existe para otro empleado
        const { data: existingUsername, error: usernameCheckError } = await supabase
            .rpc('get_empleados_con_info_all')
            .eq('usuario', username)
            .single();

        if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Error al verificar el nombre de usuario' });
        }

        if (existingUsername && existingUsername.empleado_id !== empleado_id) {
            return res.status(400).json({ success: false, error: 'Ese nombre de usuario ya está en uso.' });
        }

        // Verificar si el email ya existe en auth.users para otro usuario
        const { data: existingEmail, error: emailCheckError } = await supabase
            .from('auth.users')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Error al verificar el correo electrónico' });
        }

        if (existingEmail && existingEmail.email !== email) {
            return res.status(400).json({ success: false, error: 'Ese correo ya está registrado.' });
        }

        // Actualizar los datos del empleado
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
