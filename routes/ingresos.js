import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// GET /ingresos — Obtener todos los ingresos ordenados por fecha descendente
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, descripcion, monto, fecha FROM ingresos ORDER BY fecha DESC, id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener ingresos:", error);
    res.status(500).json({ error: "Error al obtener ingresos" });
  }
});

// POST /ingresos — Crear un nuevo ingreso
// Body esperado: { descripcion: string, monto: number }
router.post("/", async (req, res) => {
  try {
    const { descripcion, monto } = req.body;

    // Validación básica en el servidor (nunca confiar solo en el frontend)
    if (!descripcion || typeof descripcion !== "string" || descripcion.trim() === "") {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
    }

    const [result] = await pool.query(
      "INSERT INTO ingresos (descripcion, monto) VALUES (?, ?)",
      [descripcion.trim(), montoNumero]
    );

    // Devolvemos el registro completo para que el frontend lo use sin hacer otro GET
    const [rows] = await pool.query(
      "SELECT id, descripcion, monto, fecha FROM ingresos WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al crear ingreso:", error);
    res.status(500).json({ error: "Error al guardar el ingreso" });
  }
});

// DELETE /ingresos/:id — Eliminar un ingreso por ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM ingresos WHERE id = ?",
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Ingreso no encontrado" });
    }

    res.json({ mensaje: "Ingreso eliminado", id: Number(id) });
  } catch (error) {
    console.error("Error al eliminar ingreso:", error);
    res.status(500).json({ error: "Error al eliminar el ingreso" });
  }
});

export default router;
