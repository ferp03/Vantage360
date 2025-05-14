const express = require('express');
const multer = require('multer');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const supabase = supabaseAdmin;

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.put('/empleado/:id/curso/:cursoId', upload.single('archivo'), async (req, res) => {
  const { id, cursoId } = req.params;
  const { nombre, fecha_emision, fecha_vencimiento, progreso, obligatorio } = req.body;
  const archivo = req.file;

  if (!nombre) {
    return res.status(400).json({ success: false, error: 'El nombre del curso es obligatorio' });
  }

  try {
    const { data: duplicado, error: errorDuplicado } = await supabase
      .from('curso')
      .select('curso_id')
      .eq('empleado_id', id)
      .ilike('nombre', nombre)
      .neq('curso_id', cursoId)
      .maybeSingle();

    if (errorDuplicado) {
      console.error('Error al verificar duplicado al editar:', errorDuplicado.message);
      return res.status(500).json({ success: false, error: 'Error al verificar nombre duplicado' });
    }

    if (duplicado) {
      return res.status(409).json({ success: false, error: 'Ya existe otro curso con ese nombre para este empleado' });
    }

    const { data: cursoExistente, error: selectError } = await supabase
      .from('curso')
      .select('archivo')
      .eq('curso_id', cursoId)
      .eq('empleado_id', id)
      .single();

    if (selectError) {
      console.error('Error al obtener curso:', selectError.message);
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    const updateData = {
      nombre
    };

    if (fecha_emision) updateData.fecha_emision = fecha_emision;
    if (fecha_vencimiento) updateData.fecha_vencimiento = fecha_vencimiento;
    if (progreso !== undefined) updateData.progreso = Number(progreso);
    if (obligatorio !== undefined) {
      updateData.obligatorio = obligatorio === 'true' || obligatorio === true;
    }

    if (archivo) {
      if (cursoExistente.archivo) {
        const fileNameMatch = cursoExistente.archivo.match(/\/([^\/]+)(?:\?|$)/);
        const oldFileName = fileNameMatch ? fileNameMatch[1] : null;

        if (oldFileName) {
          const { error: deleteError } = await supabase.storage
            .from('cursos')
            .remove([oldFileName]);

          if (deleteError) {
            console.error('Error al eliminar archivo anterior:', deleteError.message);
          }
        }
      }

      const fileName = `${Date.now()}_${archivo.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from('cursos')
        .upload(fileName, archivo.buffer, {
          contentType: archivo.mimetype
        });

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError.message);
        return res.status(500).json({ success: false, error: 'No se pudo subir el archivo' });
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('cursos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); 

      if (signedUrlError) {
        console.error('Error al generar signed URL:', signedUrlError.message);
        return res.status(500).json({ success: false, error: 'No se pudo generar la URL del archivo' });
      }

      updateData.archivo = signedUrlData.signedUrl;
    }

    const { data, error: updateError } = await supabase
      .from('curso')
      .update(updateData)
      .eq('curso_id', cursoId)
      .eq('empleado_id', id)
      .select();

    if (updateError) {
      console.error('Error al actualizar curso:', updateError.message);
      return res.status(500).json({ success: false, error: 'No se pudo actualizar el curso' });
    }

    return res.status(200).json({
      success: true,
      message: 'Curso actualizado correctamente',
      data: data[0]
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});


router.post('/empleado/:id/curso', upload.single('archivo'), async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_emision, fecha_vencimiento, progreso, obligatorio } = req.body;
  const archivo = req.file;

  if (!nombre) {
    return res.status(400).json({ success: false, error: 'El nombre del curso es obligatorio' });
  }

  try {
    const { data: cursoExistente, error: errorBusqueda } = await supabase
      .from('curso')
      .select('curso_id')
      .eq('empleado_id', id)
      .ilike('nombre', nombre)
      .maybeSingle();

    if (errorBusqueda) {
      console.error('Error al verificar nombre duplicado:', errorBusqueda.message);
      return res.status(500).json({ success: false, error: 'Error al verificar el nombre del curso' });
    }

    if (cursoExistente) {
      return res.status(409).json({ success: false, error: 'Ya existe un curso con ese nombre para este empleado' });
    }

    let archivoUrl = null;

    if (archivo) {
      const fileName = `${Date.now()}_${archivo.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from('cursos')
        .upload(fileName, archivo.buffer, {
          contentType: archivo.mimetype
        });

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError.message);
        return res.status(500).json({ success: false, error: 'No se pudo subir el archivo' });
      }

      const { data: signedUrlData } = await supabase.storage
        .from('cursos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);

      archivoUrl = signedUrlData.signedUrl;
    }

    const cursoData = {
      empleado_id: id,
      nombre: nombre,
      progreso: progreso ? Number(progreso) : 0,
      obligatorio: obligatorio === 'true' || obligatorio === true
    };

    if (fecha_emision) cursoData.fecha_emision = fecha_emision;
    if (fecha_vencimiento) cursoData.fecha_vencimiento = fecha_vencimiento;
    if (archivoUrl) cursoData.archivo = archivoUrl;

    const { data, error } = await supabase
      .from('curso')
      .insert([cursoData])
      .select();

    if (error) {
      console.error('Error al insertar curso:', error.message);
      return res.status(500).json({ success: false, error: 'No se pudo guardar el curso' });
    }

    return res.status(201).json({
      success: true,
      message: 'Curso guardado correctamente',
      data: data[0]
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

router.get('/empleado/:id/cursos', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('curso')
    .select('curso_id, nombre, fecha_emision, fecha_vencimiento, archivo, progreso, obligatorio')
    .eq('empleado_id', id)
    .order('fecha_emision', { ascending: true });

  if (error) {
    console.error('Error al obtener cursos:', error.message);
    return res.status(500).json({ success: false, error: 'No se pudieron obtener los cursos' });
  }

  return res.status(200).json({
    success: true,
    data
  });
});

router.delete('/empleado/:id/curso/:cursoId', async (req, res) => {
  const { id, cursoId } = req.params;

  try {
    const { data: curso, error: selectError } = await supabase
      .from('curso')
      .select('archivo')
      .eq('curso_id', cursoId)
      .eq('empleado_id', id)
      .single();

    if (selectError || !curso) {
      console.error('Error al obtener información del curso:', selectError?.message);
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    if (curso.archivo) {
      const fileNameMatch = curso.archivo.match(/\/([^\/]+)(?:\?|$)/);
      const fileName = fileNameMatch ? fileNameMatch[1] : null;

      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('cursos')
          .remove([fileName]);

        if (storageError) {
          console.error('Error al eliminar archivo:', storageError.message);
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('curso')
      .delete()
      .eq('curso_id', cursoId)
      .eq('empleado_id', id);

    if (deleteError) {
      console.error('Error al eliminar curso:', deleteError.message);
      return res.status(500).json({ success: false, error: 'No se pudo eliminar el curso' });
    }

    return res.status(200).json({
      success: true,
      message: 'Curso eliminado correctamente'
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
