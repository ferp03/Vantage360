import express from 'express';
const router = express.Router();
import multer from 'multer';
import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../api/supabase.js';

const supabase = supabaseAdmin;
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8000000 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .xlsx'));
    }
  }
});

router.put('/update-excel', upload.single('archivo'), async (req, res) => {
  try {
    const datos = [];
    const cambios = [];
    const nuevos = [];
    const errores = [];

    try {
      const excel = new ExcelJS.Workbook();
      await excel.xlsx.load(req.file.buffer);
      const hoja = excel.worksheets[0];

      hoja.eachRow((row, index) => {
        if (index === 0 || index === 1) return;
        let celda = row.values.slice(1);

        let empleado = {
          nombre: celda[0],
          apellido_paterno: celda[1],
          apellido_materno: celda[2],
          usuario: celda[3],
          correo: celda[4] || (celda[0] + celda[1] + '@gmail.com')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase(),
          ciudad: celda[5],
          capability: celda[6],
          people_lead: celda[7],
          nivel: celda[8],
          nivel_grupo: celda[9],
          staff_days: celda[10],
          estado_laboral: celda[11],
          nivel_ingles: celda[12],
          bd: Math.round(celda[13] * 100),
          ytd_unassigned: Math.round(celda[14] * 100),
          ytd_recovery: Math.round(celda[15] * 100)
        };
        datos.push(empleado);
      });
    } catch (readError) {
      return res.status(400).json({ success: false, mensaje: 'Error al procesar el archivo', error: readError.message });
    }

    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return res.status(500).json({ success: false, error: listError.message });

    const userMap = new Map();
    listData.users.forEach(u => {
      userMap.set(u.email.toLowerCase(), u.id);
    });

    for (let empleado of datos) {
      try {
        const userId = userMap.get(empleado.correo.toLowerCase());

        if (userId) {
          const { data: existingData, error: fetchError } = await supabase
            .from('empleados')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (fetchError || !existingData) {
            errores.push({ correo: empleado.correo, error: 'No se pudieron obtener los datos del usuario existente' });
            continue;
          }

          // Actualiza SOLO si el valor en BD está vacío y el Excel lo tiene
          const camposActualizar = {
            empleado_ciudad: !existingData.ciudad && empleado.ciudad ? empleado.ciudad : null,
            empleado_capability: !existingData.capability && empleado.capability ? empleado.capability : null,
            empleado_nivelgrupo: !existingData.nivel_grupo && empleado.nivel_grupo ? empleado.nivel_grupo : null,
            empleado_peoplelead: !existingData.people_lead && empleado.people_lead ? empleado.people_lead : null,
            _usuario: !existingData.usuario && empleado.usuario ? empleado.usuario : null,
            _nombre: !existingData.nombre && empleado.nombre ? empleado.nombre : null,
            _apellido_paterno: !existingData.apellido_paterno && empleado.apellido_paterno ? empleado.apellido_paterno : null,
            _apellido_materno: !existingData.apellido_materno && empleado.apellido_materno ? empleado.apellido_materno : null,
            _nivel: !existingData.nivel && empleado.nivel ? empleado.nivel : null,
            _nivel_ingles: !existingData.nivel_ingles && empleado.nivel_ingles ? empleado.nivel_ingles : null,
            _staff_days: (existingData.staff_days === null || existingData.staff_days === 0) && empleado.staff_days ? empleado.staff_days : null,
            _ytd_unassigned: (existingData.ytd_unassigned === null || existingData.ytd_unassigned === 0) && empleado.ytd_unassigned ? empleado.ytd_unassigned : null,
            _ytd_recovery: (existingData.ytd_recovery === null || existingData.ytd_recovery === 0) && empleado.ytd_recovery ? empleado.ytd_recovery : null,
            _bd: (existingData.bd === null || existingData.bd === 0) && empleado.bd ? empleado.bd : null,
            _estado_laboral: !existingData.estado_laboral && empleado.estado_laboral ? (
              empleado.estado_laboral === 'Unassigned' ? 'banca' :
              (empleado.estado_laboral === 'Active' || empleado.estado_laboral === 'Assigned') ? 'activo' :
              'vacaciones'
            ) : null
          };

          Object.keys(camposActualizar).forEach(key => {
            if (camposActualizar[key] === null || camposActualizar[key] === undefined) {
              delete camposActualizar[key];
            }
          });

          if (Object.keys(camposActualizar).length > 0) {
            const { error: updateError } = await supabase.rpc('update_empleado', {
              _userid: userId,
              ...camposActualizar
            });

            if (updateError) {
              errores.push({ correo: empleado.correo, error: updateError.message });
              continue;
            }

            cambios.push(empleado);
          }

        } else {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: empleado.correo,
            password: 'Password123@',
            email_confirm: true
          });

          if (authError) return res.status(400).json({ success: false, error: authError.message });

          const newUserId = authUser.user.id;

          let _estado_laboral = 'vacaciones';
          if (empleado.estado_laboral === 'Unassigned') _estado_laboral = 'banca';
          if (empleado.estado_laboral === 'Active' || empleado.estado_laboral === 'Assigned') _estado_laboral = 'activo';

          const { error: insertError } = await supabase.rpc('new_empleado', {
            empleado_ciudad: empleado.ciudad,
            empleado_capability: empleado.capability,
            empleado_nivelgrupo: empleado.nivel_grupo,
            empleado_peoplelead: empleado.people_lead,
            _userid: newUserId,
            _usuario: empleado.usuario,
            _nombre: empleado.nombre,
            _apellido_paterno: empleado.apellido_paterno,
            _apellido_materno: empleado.apellido_materno,
            _nivel: empleado.nivel,
            _nivel_ingles: empleado.nivel_ingles,
            _staff_days: empleado.staff_days,
            _ytd_unassigned: empleado.ytd_unassigned,
            _ytd_recovery: empleado.ytd_recovery,
            _bd: empleado.bd,
            _estado_laboral: _estado_laboral,
          });

		  if (!insertError) {
			const { error: rolError } = await supabase.from('empleado_rol').insert({
				empleado_id: newUserId,
				rol_id: 3 // ID del rol "empleado"
			});

			if (rolError) {
				errores.push({ correo: empleado.correo, error: 'Error asignando rol: ' + rolError.message });
				continue;
			}
			}


          if (insertError) {
            await supabase.auth.admin.deleteUser(newUserId);
            errores.push({ correo: empleado.correo, error: insertError.message });
            continue;
          }

          nuevos.push(empleado);
        }
      } catch (errorInsert) {
        errores.push({ correo: empleado.correo, error: errorInsert.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Información de todos los empleados procesada',
      nuevos,
      cambios,
      errores,
      total: datos.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;