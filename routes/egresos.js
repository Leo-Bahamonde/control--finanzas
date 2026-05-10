import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// GET /egresos — Obtener todos los egresos ordenados por fecha descendente
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, descripcion, monto, fecha FROM egresos ORDER BY fecha DESC, id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener egresos:", error);
    res.status(500).json({ error: "Error al obtener egresos" });
  }
});

// POST /egresos — Crear un nuevo egreso
// Body esperado: { descripcion: string, monto: number }
router.post("/", async (req, res) => {
  try {
    const { descripcion, monto } = req.body;

    if (!descripcion || typeof descripcion !== "string" || descripcion.trim() === "") {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
    }

    const [result] = await pool.query(
      "INSERT INTO egresos (descripcion, monto) VALUES (?, ?)",
      [descripcion.trim(), montoNumero]
    );

    const [rows] = await pool.query(
      "SELECT id, descripcion, monto, fecha FROM egresos WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al crear egreso:", error);
    res.status(500).json({ error: "Error al guardar el egreso" });
  }
});

// DELETE /egresos/:id — Eliminar un egreso por ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM egresos WHERE id = ?",
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Egreso no encontrado" });
    }

    res.json({ mensaje: "Egreso eliminado", id: Number(id) });
  } catch (error) {
    console.error("Error al eliminar egreso:", error);
    res.status(500).json({ error: "Error al eliminar el egreso" });
  }
});

export default router;
