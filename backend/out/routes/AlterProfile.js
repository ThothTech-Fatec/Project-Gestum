import pool from '../config/dbconnection.js';
import multer from 'multer';
// Configuração do multer para processar o upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });
export const AlterProfile = async (req, res) => {
    const { userName, userEmail } = req.body;
    const profilePic = req.file; // O arquivo é acessado aqui (pode ser undefined)
    try {
        let query;
        let params;
        if (profilePic) {
            // Se uma nova imagem foi enviada, atualiza o nome e o avatar
            query = "UPDATE usuarios SET nome_usuario = ?, avatar = ? WHERE email_usuario = ?";
            params = [userName, profilePic.buffer, userEmail];
        }
        else {
            // Se nenhuma imagem foi enviada, atualiza apenas o nome
            query = "UPDATE usuarios SET nome_usuario = ? WHERE email_usuario = ?";
            params = [userName, userEmail];
        }
        // Executa a query no banco de dados
        const [rows] = await pool.query(query, params);
        // Retorna uma mensagem de sucesso
        return res.status(200).json({ message: "Perfil atualizado com sucesso!", rows });
    }
    catch (error) {
        console.error("Erro ao alterar dados:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
export const GetProfileImage = async (req, res) => {
    const { userEmail } = req.params;
    try {
        // Busca a imagem e o nome do usuário no banco de dados
        const [rows] = await pool.query("SELECT avatar, nome_usuario FROM usuarios WHERE email_usuario = ?", [userEmail]); // Type assertion
        if (!rows[0] || !rows[0].avatar) {
            return res.status(404).json({ message: 'Imagem não encontrada.' });
        }
        // Converte o Buffer da imagem para uma string base64
        const imageBase64 = rows[0].avatar.toString('base64');
        // Retorna os dados como JSON
        return res.status(200).json({
            nome_usuario: rows[0].nome_usuario,
            avatar: imageBase64, // Imagem em formato base64
        });
    }
    catch (error) {
        console.error("Erro ao buscar imagem:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
