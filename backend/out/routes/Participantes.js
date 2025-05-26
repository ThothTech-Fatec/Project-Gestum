import pool from '../config/dbconnection.js';
import { criarNotificacao, NOTIFICATION_TYPES } from './criarNotificacao.js';
export const addParticipant = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { email, role } = req.body;
        // 1. Encontra o usuário pelo email
        const [user] = await pool.query('SELECT id_usuario, nome_usuario FROM usuarios WHERE email_usuario = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const userId = user[0].id_usuario;
        const userName = user[0].nome_usuario;
        // 2. Verifica se já é participante
        const [existing] = await pool.query('SELECT id_participante FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já é participante do projeto' });
        }
        // 3. Adiciona como participante
        await pool.query('INSERT INTO projetos_participantes (id_usuario, id_projeto, tipo) VALUES (?, ?, ?)', [userId, projectId, role || 'colaborador']);
        // 4. Obtém dados do projeto para notificação
        const [project] = await pool.query('SELECT nome_projeto FROM projetos WHERE id_projeto = ?', [projectId]);
        // 5. Cria notificação usando o serviço correto
        await criarNotificacao(NOTIFICATION_TYPES.PARTICIPANTE_ADICIONADO, `${userName} foi adicionado(a) ao projeto "${project[0].nome_projeto}" como ${role || 'colaborador'}`, Number(projectId), userId, null, 'participante');
        res.json({ message: 'Participante adicionado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao adicionar participante:', error);
        res.status(500).json({ error: 'Falha ao adicionar participante' });
    }
};
export const removeParticipant = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { participantId } = req.body;
        // 1. Busca informações do participante
        const [participantInfo] = await pool.query(`
            SELECT pp.tipo, u.nome_usuario 
            FROM projetos_participantes pp
            JOIN usuarios u ON pp.id_usuario = u.id_usuario
            WHERE pp.id_projeto = ? AND pp.id_usuario = ?`, [projectId, participantId]);
        if (participantInfo.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado neste projeto' });
        }
        const participantName = participantInfo[0].nome_usuario;
        const participantRole = participantInfo[0].tipo;
        // 2. Verifica se é o último responsável
        if (participantRole === 'responsavel') {
            const [owners] = await pool.query('SELECT COUNT(*) as count FROM projetos_participantes WHERE id_projeto = ? AND tipo = "responsavel"', [projectId]);
            if (owners[0].count <= 1) {
                return res.status(400).json({ error: 'Não é possível remover o último responsável do projeto' });
            }
        }
        // 3. Remove o participante
        await pool.query('DELETE FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, participantId]);
        // 4. Cria notificação de remoção
        await criarNotificacao(NOTIFICATION_TYPES.PARTICIPANTE_REMOVIDO, `${participantName} foi removido(a) do projeto`, Number(projectId), participantId, null, 'participante');
        res.json({ message: 'Participante removido com sucesso' });
    }
    catch (error) {
        console.error('Erro ao remover participante:', error);
        res.status(500).json({ error: 'Falha ao remover participante' });
    }
};
export const getProjectParticipants = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).json({ error: 'ID do projeto é obrigatório' });
        }
        const [participants] = await pool.query(`
            SELECT 
                u.id_usuario,
                u.nome_usuario,
                u.email_usuario,
                pp.tipo
            FROM usuarios u
            JOIN projetos_participantes pp ON u.id_usuario = pp.id_usuario
            WHERE pp.id_projeto = ?
        `, [projectId]);
        res.json(participants);
    }
    catch (error) {
        console.error('Erro ao buscar participantes:', error);
        res.status(500).json({ error: 'Falha ao buscar participantes' });
    }
};
export const searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        if (typeof term !== 'string' || term.length < 2) {
            return res.json([]);
        }
        const [users] = await pool.query(`
      SELECT id_usuario, nome_usuario, email_usuario 
      FROM usuarios 
      WHERE nome_usuario LIKE ? OR email_usuario LIKE ?
      LIMIT 10
    `, [`%${term}%`, `%${term}%`]);
        res.json(users);
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
};
