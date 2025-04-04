const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const app = express();
const upload = multer();

app.use(cors()); 

const supabase = createClient(
  'https://<TU-PROYECTO>.supabase.co',
  '<TU-API-KEY-SECRETA>'
);

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');

  const filePath = `uploads/${Date.now()}_${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('archivos')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    console.error(error);
    return res.status(500).send('Upload failed');
  }

  // Guardar la referencia en la base de datos (opcional)
  await supabase.from('archivos_referencia').insert([{ path: filePath }]);

  res.status(200).json({ path: filePath });
});
