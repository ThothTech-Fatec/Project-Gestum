import pool from '../config/dbconnection.js';
export var NOTIFICATION_TYPES;
(function (NOTIFICATION_TYPES) {
    NOTIFICATION_TYPES["ATIVIDADE_CRIADA"] = "atividade_criada";
    NOTIFICATION_TYPES["ATIVIDADE_CONCLUIDA"] = "atividade_concluida";
    NOTIFICATION_TYPES["ATIVIDADE_RETOMADA"] = "atividade_retomada";
    NOTIFICATION_TYPES["ATIVIDADE_ATUALIZADA"] = "atividade_atualizada";
    NOTIFICATION_TYPES["ATIVIDADE_DELETADA"] = "atividade_deletada";
    NOTIFICATION_TYPES["RESPONSAVEL_ADICIONADO"] = "responsavel_adicionado";
    NOTIFICATION_TYPES["RESPONSAVEL_REMOVIDO"] = "responsavel_removido";
    NOTIFICATION_TYPES["PARTICIPANTE_ADICIONADO"] = "participante_adicionado";
    NOTIFICATION_TYPES["PARTICIPANTE_REMOVIDO"] = "participante_removido";
    NOTIFICATION_TYPES["PRAZO_PROXIMO"] = "prazo_proximo";
    NOTIFICATION_TYPES["MENSAGEM_DIRETA"] = "mensagem_direta";
})(NOTIFICATION_TYPES || (NOTIFICATION_TYPES = {}));
export const criarNotificacao = async (tipo, mensagem, projetoId, usuarioId = null, referenciaId = null, referenciaTipo = null) => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(`INSERT INTO notificacoes 
       (tipo, mensagem, projeto_id, usuario_id, referencia_id, referencia_tipo, criado_em, lida)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)`, [tipo, mensagem, projetoId, usuarioId, referenciaId, referenciaTipo]);
        return result.insertId;
    }
    catch (error) {
        console.error('Erro ao criar notificação:', error);
        throw new Error('Falha ao criar notificação');
    }
    finally {
        connection.release();
    }
};
/**
 * Obtém o nome de um usuário pelo ID
 * @param userId ID do usuário
 * @returns Promise<string> Nome do usuário ou 'Usuário desconhecido'
 */
export const obterNomeUsuario = async (userId) => {
    var _a;
    try {
        const [rows] = await pool.query('SELECT nome_usuario FROM usuarios WHERE id_usuario = ?', [userId]);
        return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.nome_usuario) || 'Usuário desconhecido';
    }
    catch (error) {
        console.error('Erro ao obter nome do usuário:', error);
        return 'Usuário desconhecido';
    }
};
/**
 * Obtém o nome de uma atividade pelo ID
 * @param atividadeId ID da atividade
 * @returns Promise<string> Nome da atividade ou 'Atividade desconhecida'
 */
export const obterNomeAtividade = async (atividadeId) => {
    var _a;
    try {
        const [rows] = await pool.query('SELECT nome_atividade FROM projetos_atividades WHERE id_atividade = ?', [atividadeId]);
        return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.nome_atividade) || 'Atividade desconhecida';
    }
    catch (error) {
        console.error('Erro ao obter nome da atividade:', error);
        return 'Atividade desconhecida';
    }
};
/**
 * Lista notificações de um projeto
 * @param projetoId ID do projeto
 * @returns Promise<Notificacao[]> Lista de notificações
 */
export const listarNotificacoes = async (projetoId) => {
    try {
        const [notificacoes] = await pool.query('SELECT * FROM notificacoes WHERE projeto_id = ? ORDER BY criado_em DESC', [projetoId]);
        return notificacoes;
    }
    catch (error) {
        console.error('Erro ao listar notificações:', error);
        throw new Error('Falha ao listar notificações');
    }
};
/**
 * Marca uma notificação como lida
 * @param notificacaoId ID da notificação
 * @returns Promise<void>
 */
export const marcarComoLida = async (notificacaoId) => {
    try {
        await pool.query('UPDATE notificacoes SET lida = true WHERE id = ?', [notificacaoId]);
    }
    catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw new Error('Falha ao marcar notificação como lida');
    }
};
