import pool from '../config/dbconnection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Notificacao {
  id: number;
  tipo: string;
  mensagem: string;
  projeto_id: number;
  usuario_id: number | null;
  referencia_id: number | null;
  referencia_tipo: string | null;
  lida: boolean;
  criado_em: string;
}

export enum NOTIFICATION_TYPES {
  ATIVIDADE_CRIADA = 'atividade_criada',
  ATIVIDADE_CONCLUIDA = 'atividade_concluida',
  ATIVIDADE_RETOMADA = 'atividade_retomada',
  ATIVIDADE_ATUALIZADA = 'atividade_atualizada',
  ATIVIDADE_DELETADA = 'atividade_deletada',
  RESPONSAVEL_ADICIONADO = 'responsavel_adicionado',
  RESPONSAVEL_REMOVIDO = 'responsavel_removido',
  PARTICIPANTE_ADICIONADO = 'participante_adicionado',
  PARTICIPANTE_REMOVIDO = 'participante_removido', 
  PRAZO_PROXIMO = 'prazo_proximo',
  MENSAGEM_DIRETA = 'mensagem_direta'
}

export const criarNotificacao = async (
  tipo: NOTIFICATION_TYPES,
  mensagem: string,
  projetoId: number,
  usuarioId: number | null = null,
  referenciaId: number | null = null,
  referenciaTipo: string | null = null
): Promise<number> => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO notificacoes 
       (tipo, mensagem, projeto_id, usuario_id, referencia_id, referencia_tipo, criado_em, lida)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
      [tipo, mensagem, projetoId, usuarioId, referenciaId, referenciaTipo]
    );
    return result.insertId;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw new Error('Falha ao criar notificação');
  } finally {
    connection.release();
  }
};

/**
 * Obtém o nome de um usuário pelo ID
 * @param userId ID do usuário
 * @returns Promise<string> Nome do usuário ou 'Usuário desconhecido'
 */
export const obterNomeUsuario = async (userId: number): Promise<string> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
      [userId]
    );
    return rows[0]?.nome_usuario || 'Usuário desconhecido';
  } catch (error) {
    console.error('Erro ao obter nome do usuário:', error);
    return 'Usuário desconhecido';
  }
};

/**
 * Obtém o nome de uma atividade pelo ID
 * @param atividadeId ID da atividade
 * @returns Promise<string> Nome da atividade ou 'Atividade desconhecida'
 */
export const obterNomeAtividade = async (atividadeId: number): Promise<string> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT nome_atividade FROM projetos_atividades WHERE id_atividade = ?',
      [atividadeId]
    );
    return rows[0]?.nome_atividade || 'Atividade desconhecida';
  } catch (error) {
    console.error('Erro ao obter nome da atividade:', error);
    return 'Atividade desconhecida';
  }
};

/**
 * Lista notificações de um projeto
 * @param projetoId ID do projeto
 * @returns Promise<Notificacao[]> Lista de notificações
 */
export const listarNotificacoes = async (projetoId: number): Promise<Notificacao[]> => {
  try {
    const [notificacoes] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM notificacoes WHERE projeto_id = ? ORDER BY criado_em DESC',
      [projetoId]
    );
    return notificacoes as Notificacao[];
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    throw new Error('Falha ao listar notificações');
  }
};

/**
 * Marca uma notificação como lida
 * @param notificacaoId ID da notificação
 * @returns Promise<void>
 */
export const marcarComoLida = async (notificacaoId: number): Promise<void> => {
  try {
    await pool.query(
      'UPDATE notificacoes SET lida = true WHERE id = ?',
      [notificacaoId]
    );
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw new Error('Falha ao marcar notificação como lida');
  }
};