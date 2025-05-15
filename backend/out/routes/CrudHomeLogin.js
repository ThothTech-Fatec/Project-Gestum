import pool from '../config/dbconnection.js';
export const createProject = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj, userId, id_empresa, valor } = req.body;
        if (!nome_projeto || !descricao_projeto || !data_fim_proj || !userId || !id_empresa || valor === undefined) {
            connection.release();
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        await connection.beginTransaction();
        // Verifica se a instituição existe e obtém seus dados
        const [instituicao] = await connection.query('SELECT id_empresa, nome_empresa, cnpj FROM instituicoes WHERE id_empresa = ?', [id_empresa]);
        if (instituicao.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Instituição não encontrada' });
        }
        // Cria o projeto incluindo a instituição
        const [projectResult] = await connection.query(`
      INSERT INTO projetos 
      (nome_projeto, area_atuacao_id, descricao_projeto, data_inicio_proj, data_fim_proj, id_empresa) 
      VALUES (?, ?, ?, NOW(), ?, ?)
    `, [nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj, id_empresa]);
        const projectId = projectResult.insertId;
        // Adiciona o criador como responsável
        await connection.query(`
      INSERT INTO projetos_participantes 
      (id_usuario, id_projeto, tipo) 
      VALUES (?, ?, 'responsavel')
    `, [userId, projectId]);
        await connection.query(`
      INSERT INTO orcamento 
      (id_projeto, valor) 
      VALUES (?, ?)
    `, [projectId, valor]);
        await connection.commit();
        // Retorna os dados completos, incluindo informações da instituição
        res.status(201).json({
            projectId,
            instituicao: {
                id_empresa: instituicao[0].id_empresa,
                nome_empresa: instituicao[0].nome_empresa,
                cnpj: instituicao[0].cnpj
            },
            orcamento: valor
        });
    }
    catch (error) {
        await connection.rollback();
        console.error('Erro ao criar projeto:', error);
        res.status(500).json({
            error: 'Erro interno ao criar projeto',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
    finally {
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
        a.nome as nome_area,
        i.id_empresa,
        i.nome_empresa,
        i.cnpj,
        DATE_FORMAT(p.data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(p.data_fim_proj, '%d/%m/%Y') as data_fim_proj,
        p.progresso_projeto,
        pp.tipo as user_role,
        o.valor as orcamemto_total
      FROM projetos p
      JOIN projetos_participantes pp ON p.id_projeto = pp.id_projeto
      LEFT JOIN areas_atuacao a ON p.area_atuacao_id = a.id
      LEFT JOIN instituicoes i ON p.id_empresa = i.id_empresa
      LEFT JOIN orcamento o ON p.id_projeto = o.id_projeto
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
    const connection = await pool.getConnection();
    try {
        const { id_projeto, userId } = req.query;
        if (!id_projeto || !userId) {
            connection.release();
            return res.status(400).json({ error: 'ID do projeto e ID do usuário são obrigatórios' });
        }
        // Verifica acesso
        const [access] = await connection.query('SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?', [id_projeto, userId]);
        if (access.length === 0) {
            connection.release();
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const userRole = access[0].tipo;
        // Obtém detalhes do projeto com instituição
        const [project] = await connection.query(`
      SELECT 
        p.*,
        a.nome as nome_area,
        i.id_empresa,
        i.nome_empresa,
        i.cnpj,
        o.id_orcamento,
        o.valor as orcamento_total,
        DATE_FORMAT(p.data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(p.data_fim_proj, '%d/%m/%Y') as data_fim_proj
      FROM projetos p
      LEFT JOIN areas_atuacao a ON p.area_atuacao_id = a.id
      LEFT JOIN instituicoes i ON p.id_empresa = i.id_empresa
      LEFT JOIN orcamento o ON p.id_projeto = o.id_projeto
      WHERE p.id_projeto = ?`, [id_projeto]);
        if (project.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        const [atividadesOrcamento] = await connection.query(`
      SELECT oa.*, pa.nome_atividade 
      FROM orcamento_ati oa
      JOIN projetos_atividades pa ON oa.id_atividade = pa.id_atividade
      WHERE oa.id_orcamento = ?`, [project[0].id_orcamento]);
        // Obtém participantes
        const [participants] = await connection.query(`
      SELECT u.id_usuario, u.nome_usuario, pp.tipo 
      FROM projetos_participantes pp
      JOIN usuarios u ON pp.id_usuario = u.id_usuario
      WHERE pp.id_projeto = ?
    `, [id_projeto]);
        const response = Object.assign(Object.assign({}, project[0]), { user_role: userRole, participantes: participants, atividadesComOrcamento: atividadesOrcamento });
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar detalhes do projeto:', error);
        res.status(500).json({
            error: 'Falha ao buscar detalhes do projeto',
            details: error instanceof Error ? error.message : String(error)
        });
    }
    finally {
        connection.release();
    }
};
export const updateProject = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const projectId = req.params.id;
        const { nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj, id_empresa } = req.body;
        // Verifica se a nova instituição existe
        if (id_empresa) {
            const [instituicao] = await connection.query('SELECT id_empresa FROM instituicoes WHERE id_empresa = ?', [id_empresa]);
            if (instituicao.length === 0) {
                connection.release();
                return res.status(404).json({ error: 'Instituição não encontrada' });
            }
        }
        await connection.query(`UPDATE projetos 
       SET nome_projeto = ?, descricao_projeto = ?, area_atuacao_id = ?, 
           data_fim_proj = ?, id_empresa = ?
       WHERE id_projeto = ?`, [nome_projeto, descricao_projeto, area_atuacao_id, data_fim_proj, id_empresa, projectId]);
        res.json({ message: 'Projeto atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        res.status(500).json({ error: 'Falha ao atualizar projeto' });
    }
    finally {
        connection.release();
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
