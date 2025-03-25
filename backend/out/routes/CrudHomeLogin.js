import pool from '../config/dbconnection.js';
// Função auxiliar para formatar datas
function formatDate(date) {
    if (!date)
        return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}
export const createProject = async (req, res) => {
    try {
        // Extrai os dados do corpo da requisição com tipagem
        const { nome_projeto, descricao_projeto, data_fim_proj } = req.body;
        // Validação básica dos dados
        if (!nome_projeto || !descricao_projeto || !data_fim_proj) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }
        const area_projeto = 'teste';
        // Lógica para criar o projeto no banco de dados usando pool.query
        const [result] = await pool.query(`
      INSERT INTO projetos 
      (nome_projeto,area_projeto,  descricao_projeto, data_inicio_proj, data_fim_proj) 
      VALUES (?,?, ?, NOW(), ?)
    `, [nome_projeto, area_projeto, descricao_projeto, data_fim_proj]);
        // Obter o ID do projeto inserido
        const projectId = result.insertId;
        res.status(201).json({ projectId });
    }
    catch (error) {
        console.error('Erro ao criar projeto:', error);
        res.status(500).json({
            error: 'Erro interno ao criar projeto',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};
export const getUserProjects = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const userId = req.user.id_usuario;
    try {
        const [projects] = await pool.query(`
        SELECT p.*, pp.tipo as user_role 
        FROM projetos p
        JOIN projetos_participantes pp ON p.id_projeto = pp.id_projeto
        WHERE pp.id_usuario = ?
        ORDER BY p.data_inicio_proj DESC
      `, [userId]);
        const formattedProjects = projects.map(project => (Object.assign(Object.assign({}, project), { data_inicio_proj: formatDate(project.data_inicio_proj), data_fim_proj: formatDate(project.data_fim_proj), responsavel: project.user_role === 'responsavel' ? 'Você' : 'Equipe' })));
        res.json(formattedProjects);
    }
    catch (error) {
        console.error('Erro ao buscar projetos:', error);
        res.status(500).json({ error: 'Falha ao buscar projetos' });
    }
};
export const getProjectDetails = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const projectId = req.params.id;
    const userId = req.user.id_usuario;
    try {
        const [access] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (access.length === 0) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const userRole = access[0].tipo;
        const [project] = await pool.query('SELECT * FROM projetos WHERE id_projeto = ?', [projectId]);
        if (project.length === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        const [participants] = await pool.query(`
        SELECT u.id_usuario, u.nome_usuario, pp.tipo 
        FROM projetos_participantes pp
        JOIN usuarios u ON pp.id_usuario = u.id_usuario
        WHERE pp.id_projeto = ?
      `, [projectId]);
        const response = Object.assign(Object.assign({}, project[0]), { data_inicio_proj: formatDate(project[0].data_inicio_proj), data_fim_proj: formatDate(project[0].data_fim_proj), user_role: userRole, responsavel: userRole === 'responsavel' ? 'Você' : 'Equipe', participantes: participants });
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar detalhes do projeto:', error);
        res.status(500).json({ error: 'Falha ao buscar detalhes do projeto' });
    }
};
export const updateProject = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const projectId = req.params.id;
    const userId = req.user.id_usuario;
    const { nome_projeto, descricao_projeto, area_projeto, data_fim_proj } = req.body;
    try {
        const [access] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (access.length === 0 || access[0].tipo !== 'responsavel') {
            return res.status(403).json({ error: 'Apenas responsáveis podem atualizar projetos' });
        }
        await pool.query(`UPDATE projetos 
         SET nome_projeto = ?, descricao_projeto = ?, area_projeto = ?, data_fim_proj = ?
         WHERE id_projeto = ?`, [nome_projeto, descricao_projeto, area_projeto, data_fim_proj, projectId]);
        res.json({ message: 'Projeto atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        res.status(500).json({ error: 'Falha ao atualizar projeto' });
    }
};
export const deleteProject = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const projectId = req.params.id;
    const userId = req.user.id_usuario;
    try {
        const [access] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (access.length === 0 || access[0].tipo !== 'responsavel') {
            return res.status(403).json({ error: 'Apenas responsáveis podem excluir projetos' });
        }
        await pool.query('DELETE FROM projetos WHERE id_projeto = ?', [projectId]);
        res.json({ message: 'Projeto excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir projeto:', error);
        res.status(500).json({ error: 'Falha ao excluir projeto' });
    }
};
export const addParticipant = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const projectId = req.params.id;
    const userId = req.user.id_usuario;
    const { participantId, role } = req.body;
    try {
        const [access] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (access.length === 0 || access[0].tipo !== 'responsavel') {
            return res.status(403).json({ error: 'Apenas responsáveis podem adicionar participantes' });
        }
        const [user] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [participantId]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const [existing] = await pool.query('SELECT id_participante FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, participantId]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já é participante do projeto' });
        }
        await pool.query('INSERT INTO projetos_participantes (id_usuario, id_projeto, tipo) VALUES (?, ?, ?)', [participantId, projectId, role || 'colaborador']);
        const [project] = await pool.query('SELECT nome_projeto FROM projetos WHERE id_projeto = ?', [projectId]);
        await pool.query('INSERT INTO notificacoes (id_usuario, id_projeto, titulo, descricao, tipo) VALUES (?, ?, ?, ?, ?)', [
            participantId,
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
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const projectId = req.params.id;
    const userId = req.user.id_usuario;
    const { participantId } = req.body;
    try {
        const [access] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [projectId, userId]);
        if (access.length === 0 || access[0].tipo !== 'responsavel') {
            return res.status(403).json({ error: 'Apenas responsáveis podem remover participantes' });
        }
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
