import express from 'express';
const router = express.Router();
import multer from 'multer';
import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../api/supabase.js';

const supabase = supabaseAdmin;
const storage = multer.memoryStorage();
const upload = multer({ 
	storage, 
	limits: {fileSize: 8000000},
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

/**
 * @typedef {Object} Empleado
 * @property {string} usuario
 * @property {string} correo
 * @property {string} nombre
 * @property {string} apellido_paterno
 * @property {string} apellido_materno
 * @property {string} ciudad
 * @property {string} capability
 * @property {string} people_lead
 * @property {number} nivel
 * @property {string} nivel_grupo
 * @property {number} staff_days
 * @property {string} estado_laboral
 * @property {string} nivel_ingles
 * @property {number} bd
 * @property {number} ytd_unassigned
 * @property {number} ytd_recovery
 */

router.put('/update-excel', upload.single('archivo'), async (req, res) => {
	try{
		// Leer archivo y guardar datos
		const datos = [];
		const cambios = [];
		const nuevos = [];
		const errores = [];
		try{
			const excel =  new ExcelJS.Workbook();
			await excel.xlsx.load(req.file.buffer);
			const hoja = excel.worksheets[0];
			
			hoja.eachRow((row, index) => {
				if (index === 0 || index === 1) return; // Omitir encabezado
				let celda = row.values.slice(1);
				
				let empleado = {
					nombre: celda[0],
					apellido_paterno: celda[1],
					apellido_materno: celda[2],
					usuario: celda[3],
					correo: (celda[0] + celda[1] + '@gmail.com')
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase(),
					ciudad: celda[4],
					capability: celda[5],
					people_lead: celda[6],
					nivel: celda[7],
					nivel_grupo: celda[8],
					staff_days: celda[9],
					estado_laboral: celda[10],
					nivel_ingles: celda[11],
					bd: Math.round(celda[12]*100), // excel lo guarda en %, por lo que 4% -> 0.04
					ytd_unassigned: Math.round(celda[13]*100), // excel lo guarda en %, por lo que 4% -> 0.04
					ytd_recovery: Math.round(celda[14]*100) // excel lo guarda en %, por lo que 4% -> 0.04
				}
				datos.push(empleado);
			});
		} catch (readError) {
    	res.status(400).json({ success: false, mensaje: 'Error al procesar el archivo', error: err.message });
		}

		// Procesar datos para insertar a la bd
		const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
		if (listError) return res.status(500).json({ success: false, error: listError.message });
		
		// Mapear todos los correos registrados junto con sus ids
		const userMap = new Map();
		listData.users.forEach(u => {
			userMap.set(u.email.toLowerCase(), u.id);
		});
		
		for(let empleado of datos){
				try{
				console.log(empleado.correo);
				// Validar que el email no exista en auth.users, si regresa un id del map, significa que el usuario si existe
				const userId = userMap.get(empleado.correo.toLowerCase());

				if (userId) { // si ya existe el usuario, actualizar sus datos
					console.log('exists');
					let _estado_laboral = 'vacaciones';
					if (empleado.estado_laboral === 'Unasigned') _estado_laboral = 'banca';
					if (empleado.estado_laboral === 'Active' || empleado.estado_laboral === 'Assigned') _estado_laboral = 'activo';

					const { error: updateError } = await supabase.rpc('update_empleado', {
						empleado_ciudad: empleado.ciudad,
						empleado_capability: empleado.capability,
						empleado_nivelgrupo: empleado.nivel_grupo,
						empleado_peoplelead: empleado.people_lead,
						_userid: userId,
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
						_estado_laboral: _estado_laboral
					});
					if (updateError) {
            errores.push({ correo: empleado.correo, error: updateError.message });
            continue;
					}

					cambios.push(empleado);

				} else { // No existe el usuario
					// Dar de alta usuario por medio de supabase
					const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
						email: empleado.correo,
						password: 'Password123@',
						email_confirm: true
					});
			
					if (authError) return res.status(400).json({ success: false, error: authError.message });
			
					const userId = authUser.user.id;

					let _estado_laboral = 'vacaciones';
					if (empleado.estado_laboral === 'Unasigned') _estado_laboral = 'banca';
					if (empleado.estado_laboral === 'Active' || empleado.estado_laboral === 'Assigned') _estado_laboral = 'activo';

					const { data: insertData, error: insertError } = await supabase.rpc('new_empleado', {
						empleado_ciudad: empleado.ciudad,
						empleado_capability: empleado.capability,
						empleado_nivelgrupo: empleado.nivel_grupo,
						empleado_peoplelead: empleado.people_lead,
						_userid: userId,
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
						_estado_laboral: _estado_laboral
					});

					if (insertError) {
						// si falla el insertar los datos, borrar el usuario creado en el primer paso
            await supabase.auth.admin.deleteUser(newUserId);
            errores.push({ correo: empleado.correo, error: insertError.message });
            continue;
					}

					nuevos.push(empleado);
				}
			} catch (errorInsert) {
				errores.push({ correo: empleado.correo, error: errEmpleado.message });
			}
		}
		res.status(200).json({success: true, message: 'Información de todos los empleados procesada', nuevos: nuevos, cambios: cambios, errores: errores, total: datos.length});
	} catch (err) {
    res.status(500).json({ success: false, error: err.message });
	}
})

export default router;