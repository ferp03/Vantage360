const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { supabaseAnon } = require('../supabase');
dotenv.config();

const supabase = supabaseAnon;
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
  
    // Login con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (authError) {
      console.log(authError.message);
      return res.status(401).json({ success: false, error: authError.message });
    }
  
    // Obtener el username desde tabla `usuarios`
    const user = authData.user;
    const { data: usuario, error: usuarioError } = await supabase
      .from('empleado')
      .select(`
        empleado_id,
        usuario,
        empleado_rol:empleado_rol (
          rol:rol (
            nombre
          )
        )
      `)
      .eq('empleado_id', user.id)
      .single();

    if (usuarioError || !usuario) {
      console.log('No se pudo obtener el username del usuario.')
      return res.status(500).json({success: false, error: 'No se pudo obtener el username del usuario.' });
    }
    
    console.log(usuario);
    const roles = usuario.empleado_rol.map(er => er.rol.nombre);
    console.log(roles); // ['delivery lead', 'employee', ...]

    const payload = {
      id: user.id,
      username: usuario.usuario,
      roles: roles
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

    console.log('acceso autorizado');
    return res.status(200).json({
      success: true,
      token: token
    });
  });
  
  router.post('/signup', async (req, res) => {
    const { name, patlastname, matlastname, email, password } = req.body;
    if (!name || !patlastname || !email || !password) {
      return res.status(400).json({success: false, error: 'Faltan campos requeridos' });
    }
  
    // Validar que el username no exista en la tabla usuarios
    // const { data: existingUsername, error: usernameCheckError } = await supabase
    //   .from('empleado')
    //   .select('empleado_id')
    //   .eq('usuario', username)
    //   .single();
  
    // if (existingUsername) {
    //   console.log('Ese nombre de usuario ya está en uso.');
    //   return res.status(400).json({success: false, error: 'Ese nombre de usuario ya está en uso.'});
    // }

    // Validar que el email no exista en auth.users
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
  
    if (existingEmail) {
      console.log('Ese correo ya está registrado.');
      return res.status(400).json({success: false, error: 'Ese correo ya está registrado.' });
    }
  
    // Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
  
    if (authError) {
      console.log(authError.message);
      return res.status(400).json({success: false, error: authError.message });
    }
  
    const user = authData.user;
    if (!user) {
      console.log('No se recibió usuario después del registro.');
      return res.status(500).json({success: false, error: 'No se recibió usuario después del registro.' });
    }
  
    // Insertar en tabla usuarios
    const { error: insertError } = await supabase
      .from('empleado')
      .insert({
        empleado_id: user.id,
        //usuario: username, PENDIENTE CHECAR
        nombre: name,
        apellido_paterno: patlastname,
        apellido_materno: matlastname || null,
        fecha_ingreso: new Date().toISOString().split('T')[0],
      });
  
    if (insertError) {
      console.log(insertError.message)
      return res.status(500).json({success: false, error: insertError.message });
    }

    const { error: rolError } = await supabase
      .from('empleado_rol')
      .insert({
        empleado_id: user.id,
        rol_id: 3
      });

    if (rolError){
      console.log(rolError.message);
      return res.status(500).json({success: false, error: rolError.message });
    }
  
    console.log('Usuario registrado correctamente con rol empleado');
    return res.status(200).json({
      success: true,
      message: 'Usuario registrado correctamente con rol empleado',
      user_id: user.id
    });
  });

  router.post('/recover', async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ success: false, error: 'El correo es requerido' });
    }
  
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:4200/reset-password?fromEmail=true'
    });
  
    if (error) {
      console.log('Error al enviar correo de recuperación:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  
    return res.status(200).json({
      success: true,
      message: 'Correo de recuperación enviado correctamente'
    });
  });

module.exports = router;