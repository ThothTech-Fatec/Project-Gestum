import { Request, Response } from 'express';
import pool from '../config/dbconnection.js';
import bcrypt from 'bcrypt';

export const Login = async (req: Request, res: Response) => {
  console.log('Testando Login');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    // Busca o usuário pelo email
    const [rows]: any = await pool.query(
      "SELECT * FROM usuarios WHERE email_usuario = ?",
      [email]
    );

    // Verifica se o usuário foi encontrado
    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const user = rows[0]; // Pega o primeiro usuário encontrado

    // Compara a senha fornecida com a senha criptografada no banco de dados
    const isPasswordValid = await bcrypt.compare(password, user.senha_usuario);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    // Retorna os dados do usuário (exceto a senha) em caso de sucesso
    const { senha_usuario, ...userData } = user; // Remove a senha do objeto de retorno
    return res.status(200).json(userData);
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};