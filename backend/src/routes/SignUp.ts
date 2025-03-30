import { Request, Response } from 'express';
import pool from '../config/dbconnection.js';
import bcrypt from 'bcrypt';

export const cadastrarUsuario = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    console.log('Sabao');

    if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    try {
        // Criptografa a senha antes de salvar no banco
        const saltRounds = 10; // Número de rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insere o usuário no banco de dados com a senha criptografada
        const [result] = await pool.query(
            "INSERT INTO usuarios (nome_usuario, email_usuario, senha_usuario) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        return res.status(201).json({ message: "Usuário cadastrado com sucesso!", result });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).json({ message: "Erro interno no servidor" });
    }
};