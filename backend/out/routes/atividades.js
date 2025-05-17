import pool from '../config/dbconnection.js';
import { criarNotificacao, NOTIFICATION_TYPES } from './criarNotificacao.js';
export const listarAtividades = async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId || isNaN(Number(projectId))) {
            return res.status(400).json({
                success: false,
                error: 'ID do projeto inválido ou não fornecido'
            });
        }
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
    `, [Number(projectId)]);
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
        const { id_projeto, nome_atividade, descricao_atividade, storypoint_atividade, participantes, isResponsavel, inicio_atividade, fim_atividade, userId } = req.body;
        if (!id_projeto || !nome_atividade || !descricao_atividade || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: id_projeto, nome_atividade, descricao_atividade, userId'
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
            // Get user info first
            const [user] = await connection.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [userId]);
            if (user.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }
            const nomeUsuario = user[0].nome_usuario;
            // Insert activity
            const [result] = await connection.query(`INSERT INTO projetos_atividades 
         (id_projeto, nome_atividade, descricao_atividade, storypoint_atividade, inicio_atividade, fim_atividade)
         VALUES (?, ?, ?, ?, ?, ?)`, [
                id_projeto,
                nome_atividade,
                descricao_atividade,
                storypoint_atividade || null,
                inicio_atividade || null,
                fim_atividade || null
            ]);
            const idAtividade = result.insertId;
            // Add responsible users if any
            if (participantes && participantes.length > 0) {
                const [users] = await connection.query(`SELECT id_usuario, nome_usuario FROM usuarios WHERE email_usuario IN (?)`, [participantes]);
                if (users.length > 0) {
                    const responsaveisValues = users.map(user => [idAtividade, user.id_usuario]);
                    await connection.query(`INSERT INTO responsaveis_atividade (id_atividade, id_responsavel) VALUES ?`, [responsaveisValues]);
                    // Notify each added responsible
                    for (const user of users) {
                        await criarNotificacao(NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO, `${user.nome_usuario} foi adicionado(a) como responsável na atividade: ${nome_atividade}`, id_projeto, userId, idAtividade, 'atividade');
                    }
                }
            }
            // Notify activity creation
            await criarNotificacao(NOTIFICATION_TYPES.ATIVIDADE_CRIADA, `${nomeUsuario} criou a atividade: ${nome_atividade}`, id_projeto, userId, idAtividade, 'atividade');
            await connection.commit();
            res.status(201).json({
                success: true,
                message: 'Atividade criada com sucesso',
                id_atividade: idAtividade,
                nome_criador: nomeUsuario
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
        const { isResponsavel, userId } = req.body;
        if (!isResponsavel) {
            return res.status(403).json({
                success: false,
                error: 'Apenas responsáveis podem deletar atividades'
            });
        }
        const atividadeId = Number(id);
        if (isNaN(atividadeId)) {
            return res.status(400).json({
                success: false,
                error: 'ID da atividade inválido'
            });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Get user info first
            const [user] = await connection.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [userId]);
            if (user.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }
            const nomeUsuario = user[0].nome_usuario;
            // Get activity data
            const [atividade] = await connection.query(`SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`, [atividadeId]);
            if (atividade.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }
            const nomeAtividade = atividade[0].nome_atividade;
            const projetoId = atividade[0].id_projeto;
            // Remove responsibles
            await connection.query(`DELETE FROM responsaveis_atividade WHERE id_atividade = ?`, [atividadeId]);
            // Remove activity
            const [result] = await connection.query(`DELETE FROM projetos_atividades WHERE id_atividade = ?`, [atividadeId]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }
            // Notify deletion
            await criarNotificacao(NOTIFICATION_TYPES.ATIVIDADE_DELETADA, `${nomeUsuario} removeu a atividade: ${nomeAtividade}`, projetoId, userId, null, 'atividade');
            await connection.commit();
            res.json({
                success: true,
                message: 'Atividade deletada com sucesso',
                nome_removedor: nomeUsuario
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
        const { emailUsuario, realizada, userId } = req.body;
        const atividadeId = Number(id);
        if (isNaN(atividadeId)) {
            return res.status(400).json({
                success: false,
                error: 'ID da atividade inválido'
            });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Get user info first
            const [currentUser] = await connection.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [userId]);
            if (currentUser.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }
            const nomeUsuario = currentUser[0].nome_usuario;
            // Check if is responsible
            const [responsavel] = await connection.query(`SELECT u.id_usuario, u.nome_usuario FROM responsaveis_atividade ra
         JOIN usuarios u ON ra.id_responsavel = u.id_usuario
         WHERE ra.id_atividade = ? AND u.email_usuario = ?`, [atividadeId, emailUsuario]);
            if (responsavel.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    success: false,
                    error: 'Apenas responsáveis podem alterar o status da atividade'
                });
            }
            const responsavelNome = responsavel[0].nome_usuario;
            // Get activity data
            const [atividade] = await connection.query(`SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`, [atividadeId]);
            if (atividade.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }
            const nomeAtividade = atividade[0].nome_atividade;
            const projetoId = atividade[0].id_projeto;
            // Update status
            const [result] = await connection.query(`UPDATE projetos_atividades 
         SET realizada = ?, fim_atividade = ?
         WHERE id_atividade = ?`, [realizada, realizada ? new Date() : null, atividadeId]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }
            // Notify status change
            const tipoNotificacao = realizada
                ? NOTIFICATION_TYPES.ATIVIDADE_CONCLUIDA
                : NOTIFICATION_TYPES.ATIVIDADE_RETOMADA;
            const mensagem = realizada
                ? `${responsavelNome} concluiu a atividade: ${nomeAtividade}`
                : `${responsavelNome} retomou a atividade: ${nomeAtividade}`;
            await criarNotificacao(tipoNotificacao, mensagem, projetoId, userId, atividadeId, 'atividade');
            await connection.commit();
            res.json({
                success: true,
                message: `Atividade ${realizada ? 'marcada como realizada' : 'desmarcada como realizada'}`,
                nome_responsavel: responsavelNome
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
        console.error('Erro ao atualizar status da atividade:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao atualizar status da atividade'
        });
    }
};
// Rota para atualizar atividade
export const atualizarAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const activityId = Number(id);
        if (isNaN(activityId)) {
            return res.status(400).json({
                success: false,
                error: 'ID da atividade inválido',
            });
        }
        const { nome_atividade, descricao_atividade, storypoint_atividade, participantes, isResponsavel, userId } = req.body;
        // Validações básicas (mantidas iguais)
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
            // Obter dados da atividade (simplificado)
            const [atividade] = await connection.query(`SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`, [activityId]);
            if (atividade.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Atividade não encontrada' });
            }
            const projetoId = atividade[0].id_projeto;
            const nomeAtividade = atividade[0].nome_atividade;
            // Obter nome do editor
            const [editor] = await connection.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [userId]);
            if (editor.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Usuário editor não encontrado' });
            }
            const nomeEditor = editor[0].nome_usuario;
            // Atualizar atividade (código mantido igual)
            const [result] = await connection.query(`UPDATE projetos_atividades 
         SET nome_atividade = ?, descricao_atividade = ?, storypoint_atividade = ?
         WHERE id_atividade = ?`, [
                nome_atividade,
                descricao_atividade,
                storypoint_atividade && !isNaN(storypoint_atividade) ? storypoint_atividade : null,
                activityId
            ]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Atividade não encontrada' });
            }
            // Gerenciar responsáveis com notificações atualizadas
            if (participantes && Array.isArray(participantes)) {
                await connection.query('DELETE FROM responsaveis_atividade WHERE id_atividade = ?', [activityId]);
                if (participantes.length > 0) {
                    const [novosResponsaveis] = await connection.query('SELECT id_usuario, nome_usuario FROM usuarios WHERE email_usuario IN (?)', [participantes]);
                    if (novosResponsaveis.length > 0) {
                        // Inserir novos responsáveis
                        const valoresResponsaveis = novosResponsaveis.map(user => [activityId, user.id_usuario]);
                        await connection.query('INSERT INTO responsaveis_atividade (id_atividade, id_responsavel) VALUES ?', [valoresResponsaveis]);
                        // Criar lista de nomes para notificação
                        const nomesResponsaveis = novosResponsaveis.map(u => u.nome_usuario).join(', ');
                        // Notificação geral sobre os novos responsáveis
                        await criarNotificacao(NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO, `${nomeEditor} adicionou ${nomesResponsaveis} como responsáveis pela atividade "${nomeAtividade}"`, projetoId, null, // Notificação geral (sem usuário específico)
                        activityId, 'atividade');
                    }
                }
            }
            // Notificação principal simplificada
            await criarNotificacao(NOTIFICATION_TYPES.ATIVIDADE_ATUALIZADA, `${nomeEditor} atualizou a atividade "${nomeAtividade}"`, projetoId, null, // Notificação geral
            activityId, 'atividade');
            await connection.commit();
            return res.json({
                success: true,
                message: 'Atividade atualizada com sucesso',
                data: {
                    id_atividade: activityId,
                    nome_atividade,
                    descricao_atividade,
                    storypoint_atividade
                }
            });
        }
        catch (error) {
            await connection.rollback();
            console.error('Erro na transação:', error);
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
            error: 'Erro interno ao atualizar atividade'
        });
    }
};
export const atualizarResponsavelAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, isResponsavel, currentUserId } = req.body;
        const atividadeId = Number(id);
        if (isNaN(atividadeId)) {
            return res.status(400).json({
                success: false,
                error: 'ID da atividade inválido'
            });
        }
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Get user info first
            const [user] = await connection.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [userId]);
            const [currentUser] = await connection.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [currentUserId]);
            if (user.length === 0 || currentUser.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }
            const userName = user[0].nome_usuario;
            const currentUserName = currentUser[0].nome_usuario;
            // Get activity data
            const [atividade] = await connection.query(`SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`, [atividadeId]);
            if (atividade.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }
            const atividadeNome = atividade[0].nome_atividade;
            const projetoId = atividade[0].id_projeto;
            // Check if already responsible
            const [existing] = await connection.query(`SELECT 1 FROM responsaveis_atividade 
         WHERE id_atividade = ? AND id_responsavel = ?`, [atividadeId, userId]);
            if (isResponsavel) {
                if (existing.length === 0) {
                    await connection.query(`INSERT INTO responsaveis_atividade (id_atividade, id_responsavel)
             VALUES (?, ?)`, [atividadeId, userId]);
                    // Notify user added
                    await criarNotificacao(NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO, `${userName} foi adicionado(a) como responsável na atividade: ${atividadeNome}`, projetoId, currentUserId, atividadeId, 'atividade');
                }
            }
            else {
                if (existing.length > 0) {
                    await connection.query(`DELETE FROM responsaveis_atividade 
             WHERE id_atividade = ? AND id_responsavel = ?`, [atividadeId, userId]);
                    // Notify user removed
                    await criarNotificacao(NOTIFICATION_TYPES.RESPONSAVEL_REMOVIDO, `${userName} foi removido(a) como responsável da atividade: ${atividadeNome}`, projetoId, currentUserId, atividadeId, 'atividade');
                }
            }
            // General notification
            await criarNotificacao(isResponsavel ? NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO : NOTIFICATION_TYPES.RESPONSAVEL_REMOVIDO, `${currentUserName} ${isResponsavel ? 'adicionou' : 'removeu'} ${userName} como responsável na atividade: ${atividadeNome}`, projetoId, currentUserId, atividadeId, 'atividade');
            await connection.commit();
            res.json({
                success: true,
                message: `Responsável ${isResponsavel ? 'adicionado' : 'removido'} com sucesso`,
                nome_operador: currentUserName,
                nome_usuario_afetado: userName
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
        const projetoId = Number(projectId);
        if (isNaN(projetoId)) {
            return res.status(400).json({
                success: false,
                error: 'ID do projeto inválido'
            });
        }
        const [participantes] = await pool.query(`SELECT 
         u.id_usuario, 
         u.email_usuario, 
         u.nome_usuario,
         pp.tipo
       FROM projetos_participantes pp
       JOIN usuarios u ON pp.id_usuario = u.id_usuario
       WHERE pp.id_projeto = ?`, [projetoId]);
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
        const atividadeId = Number(id);
        if (isNaN(atividadeId)) {
            return res.status(400).json({
                success: false,
                error: 'ID da atividade inválido'
            });
        }
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
    `, [atividadeId]);
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
