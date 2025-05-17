import pool from '../config/dbconnection.js';
const db = pool;
// Função para listar notificações
export const listarNotificacoes = async (req, res) => {
    try {
        const { projeto_id } = req.query;
        if (!projeto_id) {
            return res.status(400).json({ error: 'ID do projeto é obrigatório' });
        }
        const [notificacoes] = await db.query('SELECT * FROM notificacoes WHERE projeto_id = ? ORDER BY criado_em DESC', [projeto_id]);
        res.json(notificacoes);
    }
    catch (error) {
        console.error('Erro ao listar notificações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
