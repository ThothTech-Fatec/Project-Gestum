import pool from '../config/dbconnection.js';
export const createProject = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj, userId } = req.body;
        if (!nome_projeto || !descricao_projeto || !data_fim_proj || !userId) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }
        // Iniciar transação
        await connection.beginTransaction();
        // 1. Criar o projeto na tabela projetos
        const [projectResult] = await connection.query(`
      INSERT INTO projetos 
      (nome_projeto, area_atuacao_id, descricao_projeto, data_inicio_proj, data_fim_proj) 
      VALUES (?, ?, ?, NOW(), ?)
    `, [nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj]);
        const projectId = projectResult.insertId;
        // 2. Adicionar o criador como responsável na tabela projetos_participantes
        await connection.query(`
      INSERT INTO projetos_participantes 
      (id_usuario, id_projeto, tipo) 
      VALUES (?, ?, 'responsavel')
    `, [userId, projectId]);
        // Commit da transação
        await connection.commit();
        res.status(201).json({ projectId });
    }
    catch (error) {
        // Rollback em caso de erro
        await connection.rollback();
        console.error('Erro ao criar projeto:', error);
        res.status(500).json({
            error: 'Erro interno ao criar projeto',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
    finally {
        // Liberar a conexão
        connection.release();
    }
};
export const getUserProjects = async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }
    const connection = await pool.getConnection();
    try {
        const [projects] = await connection.query(`
      SELECT 
        p.id_projeto,
        p.nome_projeto,
        p.descricao_projeto,
        a.nome as nome_area,  -- Aqui pegamos o nome da área
        DATE_FORMAT(p.data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(p.data_fim_proj, '%d/%m/%Y') as data_fim_proj,
        p.progresso_projeto,
        pp.tipo as user_role
      FROM projetos p
      JOIN projetos_participantes pp ON p.id_projeto = pp.id_projeto
      LEFT JOIN areas_atuacao a ON p.area_atuacao_id = a.id  -- Join com a tabela de áreas
      WHERE pp.id_usuario = ?
      ORDER BY p.data_inicio_proj DESC
    `, [userId]);
        res.json(projects);
    }
    catch (error) {
        console.error('Erro ao buscar projetos:', error);
        res.status(500).json({ error: 'Erro ao buscar projetos' });
    }
    finally {
        connection.release();
    }
};
export const getProjectDetails = async (req, res) => {
    try {
        const { id_projeto, userId } = req.query;
        if (!id_projeto || !userId) {
            return res.status(400).json({ error: 'ID do projeto e ID do usuário são obrigatórios' });
        }
        // Verifica se o usuário tem acesso ao projeto
        const [access] = await pool.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [id_projeto, userId]);
        if (access.length === 0) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const userRole = access[0].tipo;
        // Obtém detalhes do projeto com JOIN para pegar o nome da área
        const [project] = await pool.query(`
      SELECT 
        p.id_projeto,
        p.nome_projeto,
        p.area_atuacao_id,
        a.nome as nome_area,  -- Adicionado para pegar o nome da área
        p.descricao_projeto,
        DATE_FORMAT(p.data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(p.data_fim_proj, '%d/%m/%Y') as data_fim_proj,
        p.progresso_projeto
      FROM projetos p
      LEFT JOIN areas_atuacao a ON p.area_atuacao_id = a.id  -- Join com a tabela de áreas
      WHERE p.id_projeto = ?`, [id_projeto]);
        if (project.length === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        // Obtém participantes do projeto
        const [participants] = await pool.query(`
      SELECT u.id_usuario, u.nome_usuario, pp.tipo 
      FROM projetos_participantes pp
      JOIN usuarios u ON pp.id_usuario = u.id_usuario
      WHERE pp.id_projeto = ?
    `, [id_projeto]);
        const response = Object.assign(Object.assign({}, project[0]), { user_role: userRole, participantes: participants });
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar detalhes do projeto:', error);
        res.status(500).json({
            error: 'Falha ao buscar detalhes do projeto',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
export const updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj } = req.body;
        await pool.query(`UPDATE projetos 
       SET nome_projeto = ?, descricao_projeto = ?, area_atuacao_id = ?, data_fim_proj = ?
       WHERE id_projeto = ?`, [nome_projeto, descricao_projeto, area_atuacao_id, data_fim_proj, projectId]);
        res.json({ message: 'Projeto atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        res.status(500).json({ error: 'Falha ao atualizar projeto' });
    }
};
export const deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        await pool.query('DELETE FROM projetos WHERE id_projeto = ?', [projectId]);
        res.json({ message: 'Projeto excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir projeto:', error);
        res.status(500).json({ error: 'Falha ao excluir projeto' });
    }
};
