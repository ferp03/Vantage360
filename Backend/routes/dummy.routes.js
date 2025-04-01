const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const supabase = supabaseAdmin;

const usuarios = [
    {
      usuario: 'laurapolanco', correo: 'xarteaga@villareal.net', contraseña: 'password123',
      nombre: 'Anabel', apellido_paterno: 'Roldán', apellido_materno: 'Leiva',
      fecha_ingreso: '2022-06-04', cargabilidad: 68.78
    },
    {
      usuario: 'urocha', correo: 'paolapuga@hotmail.com', contraseña: 'password123',
      nombre: 'Ivonne', apellido_paterno: 'León', apellido_materno: 'Solorio',
      fecha_ingreso: '2022-04-20', cargabilidad: 88.49
    },
    {
      usuario: 'esteveznayeli', correo: 'maurobernal@corporacin.org', contraseña: 'password123',
      nombre: 'Jaime', apellido_paterno: 'Zaragoza', apellido_materno: 'Cardona',
      fecha_ingreso: '2023-03-30', cargabilidad: 70.1
    },
    {
      usuario: 'acunamaximiliano', correo: 'irmasaavedra@yahoo.com', contraseña: 'password123',
      nombre: 'José Emilio', apellido_paterno: 'Palomino', apellido_materno: 'Jaimes',
      fecha_ingreso: '2022-09-15', cargabilidad: 65.43
    },
    {
      usuario: 'miguel-angelnaranjo', correo: 'magdalena93@club.com', contraseña: 'password123',
      nombre: 'Yeni', apellido_paterno: 'Sáenz', apellido_materno: 'Gracia',
      fecha_ingreso: '2023-04-04', cargabilidad: 61.73
    },
    {
      usuario: 'aguillen', correo: 'fabiolazambrano@laboratorios.biz', contraseña: 'password123',
      nombre: 'Bruno', apellido_paterno: 'Mejía', apellido_materno: 'Irizarry',
      fecha_ingreso: '2023-01-20', cargabilidad: 63.08
    },
    {
      usuario: 'rodrigonegron', correo: 'sanabriaamelia@fajardo-correa.net', contraseña: 'password123',
      nombre: 'Salvador', apellido_paterno: 'Viera', apellido_materno: 'Carrera',
      fecha_ingreso: '2022-07-13', cargabilidad: 90.49
    },
    {
      usuario: 'sara15', correo: 'florezsocorro@corporacin.com', contraseña: 'password123',
      nombre: 'Gabino', apellido_paterno: 'Paz', apellido_materno: 'Mondragón',
      fecha_ingreso: '2022-05-05', cargabilidad: 70.4
    },
    {
      usuario: 'rosalesaldonza', correo: 'yolmos@hotmail.com', contraseña: 'password123',
      nombre: 'Evelio', apellido_paterno: 'Rael', apellido_materno: 'Nieto',
      fecha_ingreso: '2022-09-25', cargabilidad: 82.75
    },
    {
      usuario: 'lucerovanesa', correo: 'abelgollum@industrias.com', contraseña: 'password123',
      nombre: 'José Luis', apellido_paterno: 'Quesada', apellido_materno: 'Yáñez',
      fecha_ingreso: '2023-05-21', cargabilidad: 95.34
    }
  ];
  
router.post('/dummy/insertar-empleados', async (req, res) => {
    const resultados = [];
  
    for (const u of usuarios) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: u.correo,
        password: u.contraseña,
        email_confirm: true
      });
  
      if (authError) {
        resultados.push({ usuario: u.usuario, error: authError.message });
        continue;
      }
  
      const uuid = authUser.user.id;
  
      const { error: dbError } = await supabase.from('empleado').insert({
        empleado_id: uuid,
        usuario: u.usuario,
        correo: u.correo,
        contraseña: u.contraseña,
        nombre: u.nombre,
        apellido_paterno: u.apellido_paterno,
        apellido_materno: u.apellido_materno,
        fecha_ingreso: u.fecha_ingreso,
        cargabilidad: u.cargabilidad
      });
  
      if (dbError) {
        resultados.push({ usuario: u.usuario, error: dbError.message });
      } else {
        resultados.push({ usuario: u.usuario, uuid, status: 'creado' });
      }
    }
  
    res.json(resultados);
});

module.exports = router;