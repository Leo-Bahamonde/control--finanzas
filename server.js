import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import ingresosRoutes from "./routes/ingresos.js";
import egresosRoutes from "./routes/egresos.js";

// __dirname no existe en ESM, hay que construirlo manualmente
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Puerto dinámico: Render asigna el puerto via process.env.PORT.
// En desarrollo local se usa 3000 como fallback.
const PORT = process.env.PORT || 3000;

// === Middlewares ===

// cors() permite que el frontend haga requests desde cualquier origen.
// Como frontend y backend están en el mismo servidor (express.static),
// en producción el navegador no necesita CORS, pero lo dejamos por compatibilidad
// con herramientas de desarrollo y clientes externos.
app.use(cors());

// express.json() parsea el body de requests con Content-Type: application/json
// Sin esto, req.body sería undefined en los POST
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS del frontend) desde la carpeta public/.
// Esto aísla el frontend del backend: solo se exponen los archivos dentro de public/,
// protegiendo server.js, config/db.js, package.json y otros archivos sensibles.
  app.use(express.static(join(__dirname, "public")));

// === Rutas de la API ===

// Cada recurso tiene su propio archivo de rutas.
// Express monta cada router bajo su prefijo correspondiente.
app.use("/ingresos", ingresosRoutes);
app.use("/egresos", egresosRoutes);

// === Ruta de health check ===
// Útil para que Render verifique que el servidor está activo.
// Render hace peticiones periódicas a esta ruta para monitorear el estado.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// === Manejo de rutas no encontradas (404) ===
// Si ninguna ruta anterior matcheó, devolvemos un 404 con formato JSON.
// Esto evita que Express devuelva HTML genérico en endpoints de API inexistentes.
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// === Manejo global de errores ===
// Express reconoce este middleware por tener 4 parámetros (err, req, res, next).
// Captura cualquier error no manejado en las rutas y devuelve un 500 limpio.
// En producción ocultamos detalles del error; en desarrollo los mostramos.
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err.stack || err.message);

  const isProduction = process.env.NODE_ENV === "production";

  res.status(err.status || 500).json({
    error: isProduction
      ? "Error interno del servidor"
      : err.message || "Error interno del servidor",
  });
});

// === Levantar servidor ===
// Escuchar en 0.0.0.0 es necesario para Render.
// Por defecto Node escucha solo en localhost (127.0.0.1), lo que impide
// conexiones externas en contenedores de Render.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📌 Entorno: ${process.env.NODE_ENV || "development"}`);
});

