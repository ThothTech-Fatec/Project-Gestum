import pool from '../config/dbconnection';
export const cadastrarUsuario = async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }
    try {
        const [result] = await pool.query("INSERT INTO usuarios (nome_usuario, email_usuario, senha_usuario) VALUES (?, ?, ?)", [name, email, password]);
        return res.status(201).json({ message: "Usuário cadastrado com sucesso!", result });
    }
    catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).json({ message: "Erro interno no servidor" });
    }
};
