import mysql from "mysql2/promise";

// Pool de conexiones en vez de una conexión única.
// El pool maneja automáticamente:
// - Reutilización de conexiones inactivas
// - Reconexión si MySQL se reinicia
// - Límite de conexiones simultáneas (waitForConnections: true)
const pool = mysql.createPool({
  host: "localhost",
  user: "leo",
  password: "1234",
  database: "control_finanzas",
  waitForConnections: true,
  connectionLimit: 10,
  // Devuelve las filas como objetos JS planos (comportamiento por defecto,
  // pero lo dejamos explícito para claridad)
  namedPlaceholders: false,
});

// Test de conexión al iniciar el servidor.
// Se usa una conexión del pool solo para verificar que MySQL responde.
try {
  const connection = await pool.getConnection();
  console.log("🟢 Conectado a MySQL (pool activo)");
  connection.release(); // Devuelve la conexión al pool
} catch (error) {
  console.error("🔴 Error al conectar a MySQL:", error.message);
  process.exit(1); // Si no hay DB, no tiene sentido levantar el servidor
}

export default pool;
