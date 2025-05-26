import express from 'express';
import { supabaseAdmin } from '../api/supabase.js';

const router = express.Router();
const supabase = supabaseAdmin;

const usuarios = [
    {
      usuario: 'laurapolanco', correo: 'xarteaga@villareal.net', contraseña: 'password123',
      nombre: 'Laura', apellido_paterno: 'Polanco', apellido_materno: 'Leiva',
      fecha_ingreso: '2022-06-04', cargabilidad: 68.78, ciudad: 19, nivel: 5, grupo_nivel: 7, nivel_ingles: "A2", staff_days: 30, ytd_unassigned: 2, ytd_recovery: 96, bd: 9, estado_laboral: 'active'
    },
    {
      usuario: 'urocha', correo: 'paolapuga@hotmail.com', contraseña: 'password123',
      nombre: 'Uriel', apellido_paterno: 'Rocha', apellido_materno: 'Solorio',
      fecha_ingreso: '2022-04-20', cargabilidad: 88.49, ciudad: 22, nivel: 8, grupo_nivel: 5, nivel_ingles: "C1", staff_days: 44, ytd_unassigned: 5, ytd_recovery: 88, bd: 7, estado_laboral: 'active'
    },
    {
      usuario: 'esteveznayeli', correo: 'maurobernal@corporacin.org', contraseña: 'password123',
      nombre: 'Nayeli', apellido_paterno: 'Estevez', apellido_materno: 'Cardona',
      fecha_ingreso: '2023-03-30', cargabilidad: 70.1, ciudad: 55, nivel: 11, grupo_nivel: 2, nivel_ingles: "B1", staff_days: 53, ytd_unassigned: 8, ytd_recovery: 80, bd: 6, estado_laboral: 'active'
    },
    {
      usuario: 'acunamaximiliano', correo: 'irmasaavedra@yahoo.com', contraseña: 'password123',
      nombre: 'Maximiliano', apellido_paterno: 'Acuna', apellido_materno: 'Jaimes',
      fecha_ingreso: '2022-09-15', cargabilidad: 65.43, ciudad: 41, nivel: 4, grupo_nivel: 7, nivel_ingles: "B1", staff_days: 32, ytd_unassigned: 3, ytd_recovery: 93, bd: 8, estado_laboral: 'active'
    },
    {
      usuario: 'miguel-angelnaranjo', correo: 'magdalena93@club.com', contraseña: 'password123',
      nombre: 'Miguel', apellido_paterno: 'Naranjo', apellido_materno: 'Gracia',
      fecha_ingreso: '2023-04-04', cargabilidad: 61.73, ciudad: 55, nivel: 7, grupo_nivel: 7, nivel_ingles: "B2", staff_days: 57, ytd_unassigned: 9, ytd_recovery: 77, bd: 7, estado_laboral: 'active'
    },
    {
      usuario: 'aguillen', correo: 'fabiolazambrano@laboratorios.biz', contraseña: 'password123',
      nombre: 'Adrian', apellido_paterno: 'Guillen', apellido_materno: 'Irizarry',
      fecha_ingreso: '2023-01-20', cargabilidad: 63.08, ciudad: 55, nivel: 10, grupo_nivel: 2, nivel_ingles: "C1", staff_days: 43, ytd_unassigned: 4, ytd_recovery: 91, bd: 8, estado_laboral: 'active'
    },
    {
      usuario: 'rodrigonegron', correo: 'sanabriaamelia@fajardo-correa.net', contraseña: 'password123',
      nombre: 'Rodrigo', apellido_paterno: 'Negron', apellido_materno: 'Carrera',
      fecha_ingreso: '2022-07-13', cargabilidad: 90.49, ciudad: 55, nivel: 4, grupo_nivel: 7, nivel_ingles: "B2", staff_days: 41, ytd_unassigned: 4, ytd_recovery: 92, bd: 8, estado_laboral: 'active'
    },
    {
      usuario: 'sara15', correo: 'florezsocorro@corporacin.com', contraseña: 'password123',
      nombre: 'Sara', apellido_paterno: 'Paz', apellido_materno: 'Mondragón',
      fecha_ingreso: '2022-05-05', cargabilidad: 70.4, ciudad: 55, nivel: 8, grupo_nivel: 5, nivel_ingles: "C1", staff_days: 50, ytd_unassigned: 7, ytd_recovery: 85, bd: 6, estado_laboral: 'active'
    },
    {
      usuario: 'rosalesaldonza', correo: 'yolmos@hotmail.com', contraseña: 'password123',
      nombre: 'Aldonza', apellido_paterno: 'Rosales', apellido_materno: 'Nieto',
      fecha_ingreso: '2022-09-25', cargabilidad: 82.75, ciudad: 55, nivel: 12, grupo_nivel: 2, nivel_ingles: "B1", staff_days: 35, ytd_unassigned: 3, ytd_recovery: 93, bd: 9, estado_laboral: 'active'
    },
    {
      usuario: 'lucerovanesa', correo: 'abelgollum@industrias.com', contraseña: 'password123',
      nombre: 'Vanesa', apellido_paterno: 'Lucero', apellido_materno: 'Yáñez',
      fecha_ingreso: '2023-05-21', cargabilidad: 95.34, ciudad: 55, nivel: 7, grupo_nivel: 5, nivel_ingles: "A2", staff_days: 60, ytd_unassigned: 10, ytd_recovery: 71, bd: 4, estado_laboral: 'active'
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
        //correo: u.correo,
        //contraseña: u.contraseña,
        nombre: u.nombre,
        apellido_paterno: u.apellido_paterno,
        apellido_materno: u.apellido_materno,
        fecha_ingreso: u.fecha_ingreso,
        cargabilidad: u.cargabilidad,
        ciudad_id: u.ciudad,
        nivel: u.nivel,
        nivel_grupo: u.grupo_nivel,
        nivel_ingles: u.nivel_ingles,
        staff_days: u.staff_days,
        ytd_unassigned: u.ytd_unassigned,
        ytd_recovery: u.ytd_recovery,
        bd: u.bd,
        estado_laboral: u.estado_laboral
      });
  
      if (dbError) {
        resultados.push({ usuario: u.usuario, error: dbError.message });
      } else {
        resultados.push({ usuario: u.usuario, uuid, status: 'creado' });
      }
    }
  
    res.json(resultados);
});


router.delete('/dummy/eliminar-empleados', async (req, res) => {
  let nextPageToken = null;
  const resultados = [];

  try {
    do {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: nextPageToken,
        perPage: 1000,
      });

      if (error) {
        console.error('Error al listar usuarios:', error);
        return res.status(500).json({ error: 'Error al listar usuarios' });
      }

      for (const user of data.users) {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (authDeleteError) {
          console.error(`❌ Error borrando usuario auth: ${user.email}:`, authDeleteError.message);
          resultados.push({ email: user.email, error: authDeleteError.message });
        } else {
          console.log('✅ Usuario eliminado:', user.email);
          resultados.push({ email: user.email, status: 'eliminado' });
        }
      }

      nextPageToken = data.nextPage;
    } while (nextPageToken);

    res.json({
      mensaje: 'Eliminación de usuarios finalizada',
      resultados
    });

  } catch (err) {
    console.error('Error en la eliminación:', err);
    res.status(500).json({ error: 'Error inesperado en el servidor' });
  }
});

export default router;