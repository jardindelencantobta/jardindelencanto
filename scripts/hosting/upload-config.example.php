<?php
/**
 * Copiar a /home/jardinde/upload-config.php  (FUERA de la carpeta pública)
 * y reemplazar el secreto por el MISMO valor de HOSTING_UPLOAD_TOKEN en Vercel
 * y en .env.local.
 *
 * Generar un secreto:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
return [
    'secret' => 'REEMPLAZAR_POR_SECRETO_DE_64_CARACTERES',
];
