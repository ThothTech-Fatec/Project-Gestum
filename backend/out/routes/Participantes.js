import pool from '../config/dbconnection.js';
export const addParticipant = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { email, role } = req.body;
        // Encontra o id do usuário pelo email
        const [user] = await pool.query('SELECT id_usuario FROM usuarios WHERE email_usuario = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const userId = user[0].id_usuario;
        const [existing] = await pool.query('SELECT id_participante FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já é participante do projeto' });
        }
        await pool.query('INSERT INTO projetos_participantes (id_usuario, id_projeto, tipo) VALUES (?, ?, ?)', [userId, projectId, role || 'colaborador']);
        const [project] = await pool.query(`
            SELECT 
                id_projeto,
                nome_projeto,
                DATE_FORMAT(data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
                DATE_FORMAT(data_fim_proj, '%d/%m/%Y') as data_fim_proj
            FROM projetos 
            WHERE id_projeto = ?`, [projectId]);
        await pool.query('INSERT INTO notificacoes (id_usuario, id_projeto, titulo, descricao, tipo) VALUES (?, ?, ?, ?, ?)', [
            userId,
            projectId,
            'Convite para projeto',
            `Você foi adicionado ao projeto "${project[0].nome_projeto}" como ${role || 'colaborador'}`,
            'convite'
        ]);
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
        const [participant] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, participantId]);
        if (participant.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado neste projeto' });
        }
        if (participant[0].tipo === 'responsavel') {
            const [owners] = await pool.query('SELECT COUNT(*) as count FROM projetos_participantes WHERE id_projeto = ? AND tipo = "responsavel"', [projectId]);
            if (owners[0].count <= 1) {
                return res.status(400).json({ error: 'Não é possível remover o último responsável do projeto' });
            }
        }
        await pool.query('DELETE FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, participantId]);
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
            return res.status(400).json({ error: 'Project ID is required' });
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
