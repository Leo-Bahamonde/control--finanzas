const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// conexión a MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "leo",
  password: "1234",
  database: "finanzas"
});


db.connect(err => {
  if (err) throw err;
  console.log("🟢 Conectado a MySQL");
});


// Crear endpoint para guardar datos
app.post("/movimientos", (req, res) => {
  const { descripcion, importe, tipo } = req.body;

  const query = `
    INSERT INTO movimientos (descripcion, importe, tipo, fecha)
    VALUES (?, ?, ?, CURDATE())
  `;

  db.query(query, [descripcion, importe, tipo], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al guardar");
    }

    res.send("Movimiento guardado ✅");
  });
});




//obtener datos
app.get("/movimientos", (req, res) => {
  const query = "SELECT * FROM movimientos ORDER BY id DESC";

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send("Error al obtener datos");
    }

    res.json(results);
  });
});


// Levantar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});


//delete

app.delete("/movimientos/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM movimientos WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al borrar");
    }

    res.send("Movimiento eliminado ✅");
  });
});


