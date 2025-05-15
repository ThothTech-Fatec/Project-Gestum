import pool from '../config/dbconnection.js';
export const listarAtividades = async (req, res) => {
    try {
        const { projectId } = req.query;
        const [atividades] = await pool.query(`
      SELECT 
        pa.id_atividade,
        pa.id_projeto,
        pa.nome_atividade,
        pa.descricao_atividade,
        NULLIF(pa.storypoint_atividade, 0) as storypoint_atividade,
        GROUP_CONCAT(u.email_usuario) as responsaveis,
        CASE WHEN pa.realizada = 1 THEN TRUE ELSE FALSE END as realizada,
        pa.fim_atividade as data_conclusao
      FROM projetos_atividades pa
      LEFT JOIN responsaveis_atividade ra ON pa.id_atividade = ra.id_atividade
      LEFT JOIN usuarios u ON ra.id_responsavel = u.id_usuario
      WHERE pa.id_projeto = ?
      GROUP BY pa.id_atividade
      ORDER BY pa.realizada ASC, pa.fim_atividade DESC
    `, [projectId]);
        res.json({ success: true, data: atividades });
    }
    catch (error) {
        console.error('Erro ao listar atividades:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao listar atividades'
        });
    }
};
export const criarAtividade = async (req, res) => {
    try {
        const { id_projeto, nome_atividade, descricao_atividade, storypoint_atividade, participantes, isResponsavel, inicio_atividade, fim_atividade } = req.body;
        if (!id_projeto || !nome_atividade || !descricao_atividade) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: id_projeto, nome_atividade, descricao_atividade'
            });
        }
        if (!isResponsavel) {
            return res.status(403).json({
                success: false,
                error: 'Apenas responsáveis podem criar atividades'
            });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            const [result] = await connection.query(`INSERT INTO projetos_atividades 
         (id_projeto, nome_atividade, descricao_atividade, storypoint_atividade,inicio_atividade,fim_atividade)
         VALUES (?, ?, ?, ?, ?, ?)`, [id_projeto, nome_atividade, descricao_atividade, storypoint_atividade || null, inicio_atividade || null, fim_atividade || null]);
            const idAtividade = result.insertId;
            if (participantes && participantes.length > 0) {
                const [users] = await connection.query(`SELECT id_usuario FROM usuarios WHERE email_usuario IN (?)`, [participantes]);
                if (users.length > 0) {
                    const responsaveisValues = users.map(user => [idAtividade, user.id_usuario]);
                    await connection.query(`INSERT INTO responsaveis_atividade (id_atividade, id_responsavel) VALUES ?`, [responsaveisValues]);
                }
            }
            await connection.commit();
            res.status(201).json({
                success: true,
                message: 'Atividade criada com sucesso',
                id_atividade: idAtividade
            });
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Erro ao criar atividade:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao criar atividade'
        });
    }
};
export const deletarAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { isResponsavel } = req.body;
        if (!isResponsavel) {
            return res.status(403).json({
                success: false,
                error: 'Apenas responsáveis podem deletar atividades'
            });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Primeiro deletar os responsáveis associados
            await connection.query(`DELETE FROM responsaveis_atividade WHERE id_atividade = ?`, [id]);
            // Depois deletar a atividade
            const [result] = await connection.query(`DELETE FROM projetos_atividades WHERE id_atividade = ?`, [id]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }
            await connection.commit();
            res.json({
                success: true,
                message: 'Atividade deletada com sucesso'
            });
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Erro ao deletar atividade:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao deletar atividade'
        });
    }
};
export const marcarComoRealizada = async (req, res) => {
    try {
        const { id } = req.params;
        const { emailUsuario, realizada } = req.body;
        const [responsavel] = await pool.query(`SELECT 1 FROM responsaveis_atividade ra
       JOIN usuarios u ON ra.id_responsavel = u.id_usuario
       WHERE ra.id_atividade = ? AND u.email_usuario = ?`, [id, emailUsuario]);
        if (responsavel.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Apenas responsáveis podem alterar o status da atividade'
            });
        }
        const [result] = await pool.query(`UPDATE projetos_atividades 
       SET realizada = ?, fim_atividade = ${realizada ? 'CURRENT_TIMESTAMP' : 'NULL'}
       WHERE id_atividade = ?`, [realizada, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Atividade não encontrada'
            });
        }
        res.json({
            success: true,
            message: `Atividade ${realizada ? 'marcada como realizada' : 'desmarcada como realizada'}`
        });
    }
    catch (error) {
        console.error('Erro ao atualizar status da atividade:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao atualizar status da atividade'
        });
    }
};
export const atualizarAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_atividade, descricao_atividade, storypoint_atividade, participantes, isResponsavel, inicio_atividade, fim_atividade } = req.body;
        // Validações básicas
        if (!isResponsavel) {
            return res.status(403).json({
                success: false,
                error: 'Apenas responsáveis podem atualizar atividades',
            });
        }
        if (!nome_atividade || nome_atividade.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Nome da atividade é obrigatório e deve ter no máximo 100 caracteres',
            });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Atualizar os dados da atividade
            const [result] = await connection.query(`UPDATE projetos_atividades 
         SET nome_atividade = ?, descricao_atividade = ?, storypoint_atividade = ?,inicio_atividade = ?, fim_atividade = ?
         WHERE id_atividade = ?`, [nome_atividade, descricao_atividade,
                storypoint_atividade && !isNaN(storypoint_atividade) ? storypoint_atividade : null, inicio_atividade || null, fim_atividade || null,
                id]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada',
                });
            }
            // Atualizar responsáveis de forma mais eficiente
            if (participantes) {
                // Primeiro obtemos os atuais
                const [currentResponsibles] = await connection.query(`SELECT u.email_usuario 
           FROM responsaveis_atividade ra
           JOIN usuarios u ON ra.id_responsavel = u.id_usuario
           WHERE ra.id_atividade = ?`, [id]);
                const currentEmails = currentResponsibles.map(r => r.email_usuario);
                const newEmails = participantes || [];
                // Encontrar diferenças
                const toAdd = newEmails.filter((email) => !currentEmails.includes(email));
                const toRemove = currentEmails.filter((email) => !newEmails.includes(email));
                // Executar alterações
                if (toRemove.length > 0) {
                    await connection.query(`DELETE ra FROM responsaveis_atividade ra
             JOIN usuarios u ON ra.id_responsavel = u.id_usuario
             WHERE ra.id_atividade = ? AND u.email_usuario IN (?)`, [id, toRemove]);
                }
                if (toAdd.length > 0) {
                    const [users] = await connection.query(`SELECT id_usuario FROM usuarios 
             WHERE email_usuario IN (${toAdd.map(() => '?').join(',')})`, toAdd);
                    if (users.length > 0) {
                        const responsaveisValues = users.map(user => [id, user.id_usuario]);
                        await connection.query(`INSERT INTO responsaveis_atividade (id_atividade, id_responsavel) VALUES ?`, [responsaveisValues]);
                    }
                }
            }
            await connection.commit();
            // Retornar a atividade atualizada
            const [updatedActivity] = await connection.query(`SELECT * FROM projetos_atividades WHERE id_atividade = ?`, [id]);
            res.json({
                success: true,
                data: updatedActivity[0],
                message: 'Atividade atualizada com sucesso',
            });
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Erro ao atualizar atividade:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao atualizar atividade',
        });
    }
};
export const atualizarResponsavelAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, isResponsavel } = req.body;
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            if (isResponsavel) {
                // Verificar se já é responsável
                const [existing] = await connection.query(`SELECT 1 FROM responsaveis_atividade 
           WHERE id_atividade = ? AND id_responsavel = ?`, [id, userId]);
                if (existing.length === 0) {
                    await connection.query(`INSERT INTO responsaveis_atividade (id_atividade, id_responsavel)
             VALUES (?, ?)`, [id, userId]);
                }
            }
            else {
                // Remover como responsável
                await connection.query(`DELETE FROM responsaveis_atividade 
           WHERE id_atividade = ? AND id_responsavel = ?`, [id, userId]);
            }
            await connection.commit();
            res.json({
                success: true,
                message: `Responsável ${isResponsavel ? 'adicionado' : 'removido'} com sucesso`
            });
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Erro ao atualizar responsável:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao atualizar responsável'
        });
    }
};
export const obterParticipantesProjeto = async (req, res) => {
    try {
        const { projectId } = req.params;
        const [participantes] = await pool.query(`SELECT 
         u.id_usuario, 
         u.email_usuario, 
         u.nome_usuario,
         pp.tipo
       FROM projetos_participantes pp
       JOIN usuarios u ON pp.id_usuario = u.id_usuario
       WHERE pp.id_projeto = ?`, [projectId]);
        res.json({
            success: true,
            data: participantes
        });
    }
    catch (error) {
        console.error('Erro ao obter participantes:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao obter participantes'
        });
    }
};
export const obterDetalhesAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const [atividade] = await pool.query(`
      SELECT 
        pa.id_atividade,
        pa.id_projeto,
        pa.nome_atividade,
        pa.descricao_atividade,
        NULLIF(pa.storypoint_atividade, 0) as storypoint_atividade,
        GROUP_CONCAT(u.email_usuario) as responsaveis,
        CASE WHEN pa.realizada = 1 THEN TRUE ELSE FALSE END as realizada,
        pa.fim_atividade as data_conclusao
      FROM projetos_atividades pa
      LEFT JOIN responsaveis_atividade ra ON pa.id_atividade = ra.id_atividade
      LEFT JOIN usuarios u ON ra.id_responsavel = u.id_usuario
      WHERE pa.id_atividade = ?
      GROUP BY pa.id_atividade
    `, [id]);
        if (atividade.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Atividade não encontrada'
            });
        }
        res.json({
            success: true,
            data: atividade[0]
        });
    }
    catch (error) {
        console.error('Erro ao obter detalhes da atividade:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao obter detalhes da atividade'
        });
    }
};
