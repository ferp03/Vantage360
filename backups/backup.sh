#!/bin/bash

# Cargar variables de entorno desde el archivo .env
if [ -f "$(dirname "$0")/.env" ]; then
    source "$(dirname "$0")/.env"
else
    echo "Archivo .env no encontrado en la misma carpeta que el script. Abortando."
    exit 1
fi

# Obtener fecha y hora actual
FECHA_HORA=$(date +"%Y-%m-%d_%H-%M-%S")
NOMBRE_ARCHIVO="backup_$FECHA_HORA.dump"

# Ejecutar pg_dump
PGPASSWORD=$PASSWORD pg_dump -h aws-0-us-east-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.mhqmohefvrdqqivdeath \
  -d postgres \
  -Fc \
  -f "$NOMBRE_ARCHIVO"

# Confirmar
echo "Backup completado: $NOMBRE_ARCHIVO"
