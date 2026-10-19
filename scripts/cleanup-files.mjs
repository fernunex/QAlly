import { cleanupFiles } from './lib/files.server.mjs';
try { console.log(`Limpieza local completada: ${await cleanupFiles()} objetos sin referencias eliminados.`); }
catch(e) { console.error(e.message);process.exitCode=1; }
