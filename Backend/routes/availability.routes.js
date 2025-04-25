const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');

const supabase = supabaseAdmin;

// 1. Obtener todos los empleados con su información de disponibilidad
router.get('/empleados/disponibilidad', async (req, res) => {
  try {
    // Consulta principal para obtener todos los empleados
    const { data: empleados, error: empleadosError } = await supabase
      .rpc('get_empleados_con_info');

    if (empleadosError) {
      console.error('Error al obtener empleados:', empleadosError);
      return res.status(500).json({ success: false, error: empleadosError.message });
    }

    // Para cada empleado, obtener información adicional
    const empleadosCompletos = await Promise.all(empleados.map(async (empleado) => {
      // Obtener roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('empleado_rol')
        .select(`
          rol:rol (
            rol_id,
            nombre
          )
        `)
        .eq('empleado_id', empleado.empleado_id);

        if(rolesError) {
          console.log('Error al obtener rol de empleado', rolesError);
        }

      // Obtener proyectos
      const { data: proyectosData, error: proyectosError } = await supabase
        .from('empleado_proyecto')
        .select(`
          proyecto:proyecto (
            proyecto_id,
            nombre
          )
        `)
        .eq('empleado_id', empleado.empleado_id);

      if(proyectosError) {
        console.log('Error al obtener proyectos del empleado', proyectosError);
      }

      // Obtener habilidades
      const { data: habilidadesData, error: habilidadesError } = await supabase
        .from('empleado_habilidad')
        .select(`
          habilidad:habilidad (
            habilidad_id,
            nombre,
            categoria,
            nivel
          )
        `)
        .eq('empleado_id', empleado.empleado_id);

      if(habilidadesError) {
        console.log('Error al encontrar habilidades del empleado', habilidadesError);
      } 

      // Obtener certificaciones
      const { data: certificacionesData, error: certificacionesError } = await supabase
        .from('certificacion')
        .select(`
          certificacion_id,
          nombre,
          fecha_vencimiento,
          institucion
        `)
        .eq('empleado_id', empleado.empleado_id);

      if(certificacionesError) {
        console.log('Error al encontrar certificaciones del empleado', certificacionesError);
      }

      const { data: cursosData, error: cursosError } = await supabase
        .from('curso')
        .select(`
          curso_id,
          nombre,
          fecha_vencimiento
        `)
        .eq('empleado_id', empleado.empleado_id);

      if(cursosError) {
        console.log('Error al encontrar cursos del empleado', cursosError);
      }

      // Determinar disponibilidad
      let disponible = true;
      let razon = 'Disponible';

      // Verificar cargabilidad
      if (empleado.cargabilidad >= 80) {
        disponible = false;
        razon = 'Cargabilidad al máximo';
      }

      // Verificar estado laboral
      if (empleado.estado_laboral && empleado.estado_laboral === 'vacaciones') {
        disponible = false;
        razon = 'Vacaciones'; // Ejemplo: "En licencia", "Vacaciones", etc.
      }

      // Verificar número de proyectos
      if (proyectosData && proyectosData.length >= 2) {
        disponible = false;
        razon = 'Asignado a múltiples proyectos';
      }

      // Construir objeto completo
      return {
        ...empleado,
        roles: rolesData ? rolesData.map(r => r.rol) : [],
        proyectos: proyectosData ? proyectosData.map(p => p.proyecto) : [],
        habilidades: habilidadesData ? habilidadesData.map(h => h.habilidad) : [],
        certificaciones: certificacionesData ? certificacionesData.map(c => c.certificacion) : [],
        cursos: cursosData ? cursosData.map(cc => cc.curso) : [],
        disponible,
        razon
      };
    }));

    return res.status(200).json({ 
      success: true, 
      empleados: empleadosCompletos 
    });
  } catch (err) {
    console.error('Error en el servidor:', err);
    return res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

// 2. Filtrar empleados disponibles con criterios específicos
router.get('/empleados/disponibles', async (req, res) => {
  try {
    const { habilidad, certificacion, rol } = req.query;
    
    // Obtener todos los empleados con disponibilidad
    const { data: empleadosDisponibles } = await router.handle(
      { method: 'GET', url: '/empleados/disponibilidad' }, 
      { json: (data) => data }
    );

    // Filtrar solo los que están disponibles
    let filteredEmpleados = empleadosDisponibles.empleados.filter(emp => emp.disponible);

    // Aplicar filtros adicionales
    if (habilidad) {
      filteredEmpleados = filteredEmpleados.filter(emp => 
        emp.habilidades.some(h => h.nombre.toLowerCase() === habilidad.toLowerCase())
      );
    }

    if (certificacion) {
      filteredEmpleados = filteredEmpleados.filter(emp => 
        emp.certificaciones.some(c => c.nombre.toLowerCase() === certificacion.toLowerCase())
      );
    }

    if (rol) {
      filteredEmpleados = filteredEmpleados.filter(emp => 
        emp.roles.some(r => r.nombre.toLowerCase() === rol.toLowerCase())
      );
    }

    return res.status(200).json({ 
      success: true, 
      empleados: filteredEmpleados 
    });
  } catch (err) {
    console.error('Error en el servidor:', err);
    return res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

// 3. Actualizar disponibilidad manualmente
router.put('/empleados/:id/disponibilidad', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_laboral, cargabilidad } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID de empleado requerido' });
    }

    // Datos a actualizar
    const updateData = {};
    if (estado_laboral !== undefined) updateData.estado_laboral = estado_laboral;
    if (cargabilidad !== undefined) updateData.cargabilidad = cargabilidad;

    // Actualizar empleado
    const { data, error } = await supabase
      .from('empleado')
      .update(updateData)
      .eq('empleado_id', id)
      .select();

    if (error) {
      console.error('Error al actualizar disponibilidad:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      empleado: data[0]
    });
  } catch (err) {
    console.error('Error en el servidor:', err);
    return res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

module.exports = router;