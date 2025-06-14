import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../api/supabase.js';
dotenv.config();
const router = express.Router();

const supabase = supabaseAdmin;
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
    const { name, patlastname, matlastname, email, password, rol } = req.body;
    if (!name || !patlastname || !email || !password) {
      return res.status(400).json({success: false, error: 'Faltan campos requeridos' });
    }

    // Validar que el email no exista en auth.users
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return res.status(500).json({ success: false, error: listError.message });
    }

    const userExists = listData.users.find((u) => u.email === email);

    if (userExists) {
      return res.status(400).json({ success: false, error: 'El correo ya está en uso.' });
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
        nivel: 12,
        estado_laboral: 'activo',
      });
  
    if (insertError) {
      console.log(insertError.message)
      return res.status(500).json({success: false, error: insertError.message });
    }

    const { error: rolError } = await supabase
      .from('empleado_rol')
      .insert({
        empleado_id: user.id,
        rol_id: rol? rol : 3
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
      redirectTo: 'http://localhost:4200/reset-password'
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

export default router;