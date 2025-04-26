import pool from '../config/dbconnection.js';
export const getProjectParticipants = async (projectId) => {
    const [participants] = await pool.query(`
    SELECT u.email_usuario 
    FROM projetos_participantes pp
    JOIN usuarios u ON pp.id_usuario = u.id_usuario
    WHERE pp.id_projeto = ?
  `, [projectId]);
    return participants.map((p) => p.email_usuario);
};
export const criarAtividade = async (req, res) => {
    try {
        const { id_projeto, nome_atividade, descricao_atividade, storypoint_atividade, participantes } = req.body;
        // Validação dos campos obrigatórios
        if (!id_projeto || !nome_atividade || !descricao_atividade) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: id_projeto, nome_atividade, descricao_atividade'
            });
        }
        // Inserir a atividade principal
        const [result] = await pool.query(`INSERT INTO projetos_atividades 
       (id_projeto, nome_atividade, descricao_atividade, storypoint_atividade)
       VALUES (?, ?, ?, ?)`, [id_projeto, nome_atividade, descricao_atividade, storypoint_atividade || null]);
        const idAtividade = result.insertId;
        // Inserir participantes se existirem
        if (participantes && participantes.length > 0) {
            // Obter IDs dos usuários a partir dos emails
            const [users] = await pool.query(`SELECT id_usuario FROM usuarios WHERE email_usuario IN (?)`, [participantes]);
            if (users.length !== participantes.length) {
                return res.status(400).json({
                    success: false,
                    error: 'Um ou mais emails não correspondem a participantes do projeto'
                });
            }
            // Inserir responsáveis
            const responsaveisValues = users.map((user) => [idAtividade, user.id_usuario]);
            await pool.query(`INSERT INTO responsaveis_atividade (id_atividade, id_responsavel)
         VALUES ?`, [responsaveisValues]);
        }
        res.status(201).json({
            success: true,
            message: 'Atividade criada com sucesso',
            id_atividade: idAtividade
        });
    }
    catch (error) {
        console.error('Erro ao criar atividade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao criar atividade'
        });
    }
};
// rota para obter participantes do projeto
export const obterParticipantesProjeto = async (req, res) => {
    try {
        const { projectId } = req.params;
        const participants = await getProjectParticipants(Number(projectId));
        res.json({
            success: true,
            data: participants
        });
    }
    catch (error) {
        console.error('Erro ao obter participantes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao obter participantes'
        });
    }
};
export const listarAtividades = async (req, res) => {
    try {
        const [atividades] = await pool.query(`
        SELECT pa.*, GROUP_CONCAT(u.email_usuario) AS responsaveis
        FROM projetos_atividades pa
        LEFT JOIN responsaveis_atividade ra ON pa.id_atividade = ra.id_atividade
        LEFT JOIN usuarios u ON ra.id_responsavel = u.id_usuario
        WHERE pa.id_projeto = ?
        GROUP BY pa.id_atividade
      `, [req.query.projectId]);
        res.json({
            success: true,
            data: atividades
        });
    }
    catch (error) {
        console.error('Erro ao listar atividades:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao listar atividades'
        });
    }
};
export const deletarAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar se a atividade existe
        const [atividade] = await pool.query(`SELECT id_atividade FROM projetos_atividades WHERE id_atividade = ?`, [id]);
        if (atividade.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Atividade não encontrada'
            });
        }
        // Primeiro deletar os responsáveis associados
        await pool.query(`DELETE FROM responsaveis_atividade WHERE id_atividade = ?`, [id]);
        // Depois deletar a atividade
        await pool.query(`DELETE FROM projetos_atividades WHERE id_atividade = ?`, [id]);
        res.json({
            success: true,
            message: 'Atividade deletada com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao deletar atividade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao deletar atividade'
        });
    }
};
