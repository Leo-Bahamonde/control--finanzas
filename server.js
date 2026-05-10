import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import ingresosRoutes from "./routes/ingresos.js";
import egresosRoutes from "./routes/egresos.js";

// __dirname no existe en ESM, hay que construirlo manualmente
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

// === Middlewares ===

// cors() permite que el frontend haga requests desde cualquier origen.
// En desarrollo local esto es necesario si abrís index.html como file://
// En producción deberías restringirlo con { origin: "https://tudominio.com" }
app.use(cors());

// express.json() parsea el body de requests con Content-Type: application/json
// Sin esto, req.body sería undefined en los POST
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS del frontend) desde la raíz del proyecto.
// Esto permite acceder al frontend desde http://localhost:3000 directamente,
// eliminando problemas de CORS por file:// y unificando frontend+backend en un puerto.
app.use(express.static(__dirname));

// === Rutas de la API ===

// Cada recurso tiene su propio archivo de rutas.
// Express monta cada router bajo su prefijo correspondiente.
app.use("/ingresos", ingresosRoutes);
app.use("/egresos", egresosRoutes);

// === Levantar servidor ===

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
