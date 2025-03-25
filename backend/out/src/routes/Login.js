import express from 'express';
import pool from '../config/dbconnection.js';
const app = express();
app.use(express.json());
export const Login = async (req, res) => {
    const { email, password } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email_usuario = ? AND senha_usuario = ?", [email, password]);
        return res.status(200).json(rows);
    }
    catch (error) {
        console.error("Erro ao buscar todos os usuários:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
