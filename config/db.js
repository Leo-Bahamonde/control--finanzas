import mysql from "mysql2/promise";

// Pool de conexiones usando variables de entorno.
// Railway provee automáticamente estas variables cuando vinculás un servicio MySQL:
//   MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT
// En desarrollo local, se leen desde el archivo .env (ver .env.example)
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "control_finanzas",
  port: Number(process.env.MYSQLPORT) || 3306,
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
  console.error("❌ Error MySQL:");
  console.error(error);
  // En producción no hacemos process.exit(1) inmediatamente para permitir
  // que Railway termine de provisionar la DB. El servidor arranca igual
  // y las rutas devolverán error 500 si la DB no está disponible.
  if (process.env.NODE_ENV !== "production") {
    process.exit(1); // En desarrollo sí cortamos, porque es un error local
  }
}

export default pool;
