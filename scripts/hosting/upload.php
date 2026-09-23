<?php
/**
 * Jardín El Encanto — endpoint de subida de archivos
 * Desplegar en: /home/jardinde/contenido.jardindelencanto.com/upload.php
 *
 * Autenticación: header X-Upload-Token = "<exp>.<firma>"
 *   firma = HMAC-SHA256("<folder>|<exp>", secreto) en hexadecimal.
 *   El token lo firma el servidor Next.js (src/lib/uploads/hosting-token.ts),
 *   vale solo para UNA carpeta y vence en minutos. El secreto nunca llega al
 *   navegador y vive FUERA de la carpeta pública:
 *   /home/jardinde/upload-config.php   (ver scripts/hosting/upload-config.example.php)
 *
 * Respuesta JSON: { "success": true, "url": "https://..." }
 *                 { "success": false, "error": "..." }
 */

// ─── Configuración ───────────────────────────────────────────────────────────

$config = @include dirname(__DIR__) . '/upload-config.php';
if (!is_array($config) || empty($config['secret']) || strlen($config['secret']) < 32) {
    responder(500, ['success' => false, 'error' => 'Servidor de archivos sin configurar']);
}

const BASE_URL = 'https://contenido.jardindelencanto.com';

const ORIGENES_PERMITIDOS = [
    'https://www.jardindelencanto.com',
    'https://jardindelencanto.com',
    'http://localhost:3000',
];

// Carpetas válidas → tipos de archivo que aceptan
const CARPETAS = [
    'galeria/boda'            => ['imagen'],
    'galeria/quince'          => ['imagen'],
    'galeria/empresarial'     => ['imagen'],
    'galeria/revelacion'      => ['imagen'],
    'galeria/general'         => ['imagen'],
    'galeria/staff'           => ['imagen'],
    'galeria/blog'            => ['imagen'],
    'galeria/sitio/eventos'   => ['imagen'],
    'galeria/sitio/servicios' => ['imagen'],
    'galeria/sitio/nosotros'  => ['imagen'],
    'promociones'             => ['imagen'],
    'videos'                  => ['video'],
    'testimonios'             => ['video'],
    'documentos/contratos'    => ['pdf'],
    'cotizaciones'            => ['pdf'],
];

// Tipo MIME real (detectado en el servidor) → [categoría, extensión]
const TIPOS = [
    'image/jpeg'      => ['imagen', 'jpg'],
    'image/png'       => ['imagen', 'png'],
    'image/webp'      => ['imagen', 'webp'],
    'video/mp4'       => ['video',  'mp4'],
    'video/webm'      => ['video',  'webm'],
    'video/quicktime' => ['video',  'mov'],
    'application/pdf' => ['pdf',    'pdf'],
];

const LIMITES = [
    'imagen' => 10 * 1024 * 1024,   // 10 MB
    'pdf'    => 15 * 1024 * 1024,   // 15 MB
    'video'  => 500 * 1024 * 1024,  // 500 MB (requiere php.ini, ver guía)
];

// ─── CORS ────────────────────────────────────────────────────────────────────

$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origen, ORIGENES_PERMITIDOS, true)) {
    header("Access-Control-Allow-Origin: $origen");
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token');
    header('Access-Control-Max-Age: 600');
}
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, ['success' => false, 'error' => 'Método no permitido']);
}

// ─── Carpeta ─────────────────────────────────────────────────────────────────

$carpeta = trim((string)($_POST['folder'] ?? ''), '/');
if (!array_key_exists($carpeta, CARPETAS)) {
    responder(400, ['success' => false, 'error' => 'Carpeta no permitida']);
}

// ─── Token ───────────────────────────────────────────────────────────────────

$token = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';
if (!preg_match('/^(\d{10})\.([a-f0-9]{64})$/', $token, $m)) {
    responder(401, ['success' => false, 'error' => 'No autorizado']);
}
[$_, $exp, $firma] = $m;
if ((int)$exp < time()) {
    responder(401, ['success' => false, 'error' => 'Permiso de subida vencido, intenta de nuevo']);
}
$esperada = hash_hmac('sha256', "$carpeta|$exp", $config['secret']);
if (!hash_equals($esperada, $firma)) {
    responder(401, ['success' => false, 'error' => 'No autorizado']);
}

// ─── Archivo ─────────────────────────────────────────────────────────────────

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $cod = $_FILES['file']['error'] ?? -1;
    $msg = in_array($cod, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
        ? 'El archivo supera el tamaño máximo permitido por el servidor'
        : 'Archivo no recibido o error de subida';
    responder(400, ['success' => false, 'error' => $msg]);
}

$tmp  = $_FILES['file']['tmp_name'];
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);

if (!isset(TIPOS[$mime])) {
    responder(400, ['success' => false, 'error' => "Formato no permitido ($mime)"]);
}
[$categoria, $ext] = TIPOS[$mime];

if (!in_array($categoria, CARPETAS[$carpeta], true)) {
    responder(400, ['success' => false, 'error' => "Esta carpeta no acepta archivos de tipo $categoria"]);
}

$tamano = filesize($tmp);
if ($tamano <= 0) {
    responder(400, ['success' => false, 'error' => 'El archivo está vacío']);
}
if ($tamano > LIMITES[$categoria]) {
    $mb = LIMITES[$categoria] / 1024 / 1024;
    responder(400, ['success' => false, 'error' => "El archivo supera el límite de $mb MB"]);
}

// ─── Guardar ─────────────────────────────────────────────────────────────────

$destinoDir = __DIR__ . '/' . $carpeta;
if (!is_dir($destinoDir)) {
    responder(500, ['success' => false, 'error' => 'La carpeta destino no existe en el hosting']);
}

// Nombre generado por el servidor: nunca se usa el nombre enviado por el cliente.
$nombre = date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.' . $ext;

if (!move_uploaded_file($tmp, "$destinoDir/$nombre")) {
    responder(500, ['success' => false, 'error' => 'No se pudo guardar el archivo']);
}
@chmod("$destinoDir/$nombre", 0644);

responder(200, ['success' => true, 'url' => BASE_URL . "/$carpeta/$nombre"]);

// ─────────────────────────────────────────────────────────────────────────────

function responder(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
