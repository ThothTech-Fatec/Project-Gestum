import { Request, Response } from 'express';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/dbconnection.js';
import {
  criarNotificacao,
  NOTIFICATION_TYPES,
  obterNomeUsuario,
  obterNomeAtividade
} from './criarNotificacao.js';

interface AtividadeRequestBody {
  id_projeto: number;
  nome_atividade: string;
  descricao_atividade: string;
  storypoint_atividade?: number;
  participantes?: string[];
  isResponsavel: boolean;
  inicio_atividade?: string;
  fim_atividade?: string;
  data_limite_atividade?: string;
  userId: number;
  emailUsuario?: string;
  realizada?: boolean;
  currentUserId?: number;
  orcamento?: number;
}

// Função para obter orçamento total do projeto
const obterOrcamentoProjeto = async (connection: any, projetoId: number) => {
  const [orcamento] = await connection.query(
    `SELECT valor FROM orcamento WHERE id_projeto = ?`,
    [projetoId]
  );
  return orcamento.length > 0 ? orcamento[0].valor : 0;
};

// Função para obter orçamento total utilizado pelas atividades do projeto
const obterOrcamentoUtilizado = async (connection: any, projetoId: number) => {
  const [result] = await connection.query(`
    SELECT COALESCE(SUM(oa.valor), 0) as total
    FROM orcamento_ati oa
    JOIN projetos_atividades pa ON oa.id_atividade = pa.id_atividade
    WHERE pa.id_projeto = ?
  `, [projetoId]);
  return result[0].total;
};

// Função para validar se o orçamento da atividade é viável
const validarOrcamentoAtividade = async (
  connection: any,
  projetoId: number,
  orcamentoAtividade: number,
  atividadeId?: number
) => {
  const orcamentoProjeto = await obterOrcamentoProjeto(connection, projetoId);
  let orcamentoUtilizado = await obterOrcamentoUtilizado(connection, projetoId);
  
  if (atividadeId) {
    const [orcamentoAtual] = await connection.query(
      `SELECT valor FROM orcamento_ati WHERE id_atividade = ?`,
      [atividadeId]
    );
    if (orcamentoAtual.length > 0) {
      orcamentoUtilizado -= orcamentoAtual[0].valor;
    }
  }
  
  const novoTotal = orcamentoUtilizado + orcamentoAtividade;
  
  if (novoTotal > orcamentoProjeto) {
    throw new Error(`Orçamento da atividade excede o disponível. Projeto: R$ ${orcamentoProjeto}, Utilizado: R$ ${orcamentoUtilizado}`);
  }
  
  return true;
};

export const listarAtividades = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId || isNaN(Number(projectId))) {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto inválido ou não fornecido'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      const [atividades] = await connection.query<RowDataPacket[]>(`
        SELECT 
          pa.id_atividade,
          pa.id_projeto,
          pa.nome_atividade,
          pa.descricao_atividade,
          NULLIF(pa.storypoint_atividade, 0) as storypoint_atividade,
          GROUP_CONCAT(DISTINCT u.email_usuario) as responsaveis,
          CASE WHEN pa.realizada = 1 THEN TRUE ELSE FALSE END as realizada,
          pa.inicio_atividade,
          pa.data_limite_atividade,
          pa.fim_atividade as data_conclusao,
          COALESCE(MAX(oa.valor), 0) as orcamento
        FROM projetos_atividades pa
        LEFT JOIN responsaveis_atividade ra ON pa.id_atividade = ra.id_atividade
        LEFT JOIN usuarios u ON ra.id_responsavel = u.id_usuario
        LEFT JOIN orcamento_ati oa ON pa.id_atividade = oa.id_atividade
        WHERE pa.id_projeto = ?
        GROUP BY 
          pa.id_atividade,
          pa.id_projeto,
          pa.nome_atividade,
          pa.descricao_atividade,
          pa.storypoint_atividade,
          pa.realizada,
          pa.inicio_atividade,
          pa.data_limite_atividade,
          pa.fim_atividade
        ORDER BY pa.realizada ASC, pa.fim_atividade DESC
      `, [Number(projectId)]);

      res.json({ success: true, data: atividades });
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao listar atividades:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao listar atividades' 
    });
  }
};

export const obterResumoOrcamento = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const projetoId = Number(projectId);
    if (isNaN(projetoId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto inválido'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      const orcamentoProjeto = await obterOrcamentoProjeto(connection, projetoId);
      const orcamentoUtilizado = await obterOrcamentoUtilizado(connection, projetoId);
      
      res.json({
        success: true,
        data: {
          orcamento_total: orcamentoProjeto,
          orcamento_utilizado: orcamentoUtilizado,
          orcamento_disponivel: orcamentoProjeto - orcamentoUtilizado,
          percentual_utilizado: orcamentoProjeto > 0 
            ? Math.round((orcamentoUtilizado / orcamentoProjeto) * 100)
            : 0
        }
      });
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao obter resumo de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao obter resumo de orçamento' 
    });
  }
};

export const criarAtividade = async (req: Request<{}, {}, AtividadeRequestBody>, res: Response) => {
  try {
    const { 
      id_projeto, 
      nome_atividade, 
      descricao_atividade, 
      storypoint_atividade, 
      participantes, 
      isResponsavel,
      inicio_atividade,
      fim_atividade,
      data_limite_atividade,
      userId,
      orcamento
    } = req.body;

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
      if (orcamento && orcamento > 0) {
        await validarOrcamentoAtividade(connection, id_projeto, orcamento);
      }

      const [user] = await connection.query<RowDataPacket[]>(
        'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
        [userId]
      );

      if (user.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          error: 'Usuário não encontrado' 
        });
      }

      const nomeUsuario = user[0].nome_usuario;

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO projetos_atividades 
         (id_projeto, nome_atividade, descricao_atividade, storypoint_atividade, inicio_atividade, fim_atividade, data_limite_atividade)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_projeto, 
          nome_atividade, 
          descricao_atividade, 
          storypoint_atividade || null, 
          inicio_atividade || null, 
          fim_atividade || null,
          data_limite_atividade || null
        ]
      );

      const idAtividade = result.insertId;

      if (orcamento && orcamento > 0) {
        const [orcamentoProjeto] = await connection.query<RowDataPacket[]>(
          `SELECT id_orcamento FROM orcamento WHERE id_projeto = ?`,
          [id_projeto]
        );

        let idOrcamento;
        
        if (orcamentoProjeto.length === 0) {
          const [resultOrcamento] = await connection.query<ResultSetHeader>(
            `INSERT INTO orcamento (id_projeto, valor) VALUES (?, ?)`,
            [id_projeto, 0]
          );
          idOrcamento = resultOrcamento.insertId;
        } else {
          idOrcamento = orcamentoProjeto[0].id_orcamento;
        }

        await connection.query(
          `INSERT INTO orcamento_ati (valor, id_atividade, id_orcamento) VALUES (?, ?, ?)`,
          [orcamento, idAtividade, idOrcamento]
        );
      }

      if (participantes && participantes.length > 0) {
        const [users] = await connection.query<RowDataPacket[]>(
          `SELECT id_usuario, nome_usuario FROM usuarios WHERE email_usuario IN (?)`,
          [participantes]
        );

        if (users.length > 0) {
          const responsaveisValues = users.map(user => [idAtividade, user.id_usuario]);
          await connection.query(
            `INSERT INTO responsaveis_atividade (id_atividade, id_responsavel) VALUES ?`,
            [responsaveisValues]
          );

          for (const user of users) {
            await criarNotificacao(
              NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO,
              `${user.nome_usuario} foi adicionado(a) como responsável na atividade: ${nome_atividade}`,
              id_projeto,
              userId,
              idAtividade,
              'atividade'
            );
          }
        }
      }

      await criarNotificacao(
        NOTIFICATION_TYPES.ATIVIDADE_CRIADA,
        `${nomeUsuario} criou a atividade: ${nome_atividade}`,
        id_projeto,
        userId,
        idAtividade,
        'atividade'
      );

      await connection.commit();
      res.status(201).json({ 
        success: true,
        message: 'Atividade criada com sucesso',
        id_atividade: idAtividade,
        nome_criador: nomeUsuario,
        orcamento_atividade: orcamento || 0
      });
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno ao criar atividade' 
    });
  }
};

export const deletarAtividade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isResponsavel, userId } = req.body as { isResponsavel: boolean, userId: number };

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
      const [user] = await connection.query<RowDataPacket[]>(
        'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
        [userId]
      );

      if (user.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          error: 'Usuário não encontrado' 
        });
      }

      const nomeUsuario = user[0].nome_usuario;

      const [atividade] = await connection.query<RowDataPacket[]>(
        `SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`,
        [atividadeId]
      );

      if (atividade.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      const nomeAtividade = atividade[0].nome_atividade;
      const projetoId = atividade[0].id_projeto;

      await connection.query(
        `DELETE FROM responsaveis_atividade WHERE id_atividade = ?`,
        [atividadeId]
      );

      const [result] = await connection.query<OkPacket>(
        `DELETE FROM projetos_atividades WHERE id_atividade = ?`,
        [atividadeId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      await criarNotificacao(
        NOTIFICATION_TYPES.ATIVIDADE_DELETADA,
        `${nomeUsuario} removeu a atividade: ${nomeAtividade}`,
        projetoId,
        userId,
        null,
        'atividade'
      );

      await connection.commit();
      res.json({ 
        success: true, 
        message: 'Atividade deletada com sucesso',
        nome_removedor: nomeUsuario
      });
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao deletar atividade:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao deletar atividade' 
    });
  }
};

export const marcarComoRealizada = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { emailUsuario, realizada, userId } = req.body as {
      emailUsuario: string,
      realizada: boolean,
      userId: number
    };

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
      const [currentUser] = await connection.query<RowDataPacket[]>(
        'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
        [userId]
      );

      if (currentUser.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          error: 'Usuário não encontrado' 
        });
      }

      const nomeUsuario = currentUser[0].nome_usuario;

      const [responsavel] = await connection.query<RowDataPacket[]>(
        `SELECT u.id_usuario, u.nome_usuario FROM responsaveis_atividade ra
         JOIN usuarios u ON ra.id_responsavel = u.id_usuario
         WHERE ra.id_atividade = ? AND u.email_usuario = ?`,
        [atividadeId, emailUsuario]
      );

      if (responsavel.length === 0) {
        await connection.rollback();
        return res.status(403).json({ 
          success: false, 
          error: 'Apenas responsáveis podem alterar o status da atividade' 
        });
      }

      const responsavelNome = responsavel[0].nome_usuario;

      const [atividade] = await connection.query<RowDataPacket[]>(
        `SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`,
        [atividadeId]
      );

      if (atividade.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      const nomeAtividade = atividade[0].nome_atividade;
      const projetoId = atividade[0].id_projeto;

      const [result] = await connection.query<OkPacket>(
        `UPDATE projetos_atividades 
         SET realizada = ?, fim_atividade = ?
         WHERE id_atividade = ?`,
        [realizada, realizada ? new Date() : null, atividadeId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      const tipoNotificacao = realizada 
        ? NOTIFICATION_TYPES.ATIVIDADE_CONCLUIDA 
        : NOTIFICATION_TYPES.ATIVIDADE_RETOMADA;
      
      const mensagem = realizada
        ? `${responsavelNome} concluiu a atividade: ${nomeAtividade}`
        : `${responsavelNome} retomou a atividade: ${nomeAtividade}`;

      await criarNotificacao(
        tipoNotificacao,
        mensagem,
        projetoId,
        userId,
        atividadeId,
        'atividade'
      );

      await connection.commit();
      res.json({ 
        success: true, 
        message: `Atividade ${realizada ? 'marcada como realizada' : 'desmarcada como realizada'}`,
        nome_responsavel: responsavelNome
      });
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao atualizar status da atividade:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao atualizar status da atividade' 
    });
  }
};

export const atualizarAtividade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activityId = Number(id);
    
    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da atividade inválido',
      });
    }

    const { 
      nome_atividade, 
      descricao_atividade, 
      storypoint_atividade, 
      participantes, 
      isResponsavel, 
      userId,
      orcamento
    } = req.body;

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
      const [atividade] = await connection.query<RowDataPacket[]>(
        `SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`,
        [activityId]
      );

      if (atividade.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Atividade não encontrada' });
      }

      const projetoId = atividade[0].id_projeto;
      const nomeAtividade = atividade[0].nome_atividade;

      if (orcamento !== undefined) {
        if (orcamento < 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            error: 'Orçamento não pode ser negativo'
          });
        }

        if (orcamento > 0) {
          await validarOrcamentoAtividade(connection, projetoId, orcamento, activityId);
        }
      }

      const [editor] = await connection.query<RowDataPacket[]>(
        'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
        [userId]
      );

      if (editor.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Usuário editor não encontrado' });
      }

      const nomeEditor = editor[0].nome_usuario;

      const [result] = await connection.query<OkPacket>(
        `UPDATE projetos_atividades 
         SET nome_atividade = ?, descricao_atividade = ?, storypoint_atividade = ?
         WHERE id_atividade = ?`,
        [
          nome_atividade, 
          descricao_atividade, 
          storypoint_atividade && !isNaN(storypoint_atividade) ? storypoint_atividade : null,
          activityId
        ]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Atividade não encontrada' });
      }

      if (orcamento !== undefined) {
        const [orcamentoExistente] = await connection.query<RowDataPacket[]>(
          `SELECT id_orcamento_ati FROM orcamento_ati WHERE id_atividade = ?`,
          [activityId]
        );

        const [orcamentoProjeto] = await connection.query<RowDataPacket[]>(
          `SELECT id_orcamento FROM orcamento WHERE id_projeto = ?`,
          [projetoId]
        );

        if (orcamentoProjeto.length === 0) {
          if (orcamento > 0) {
            const [resultOrcamento] = await connection.query<ResultSetHeader>(
              `INSERT INTO orcamento (id_projeto, valor) VALUES (?, ?)`,
              [projetoId, 0]
            );
            const idOrcamento = resultOrcamento.insertId;
            
            await connection.query(
              `INSERT INTO orcamento_ati (valor, id_atividade, id_orcamento) VALUES (?, ?, ?)`,
              [orcamento, activityId, idOrcamento]
            );
          }
        } else {
          const idOrcamento = orcamentoProjeto[0].id_orcamento;
          
          if (orcamentoExistente.length > 0) {
            if (orcamento > 0) {
              await connection.query(
                `UPDATE orcamento_ati SET valor = ? WHERE id_atividade = ?`,
                [orcamento, activityId]
              );
            } else {
              await connection.query(
                `DELETE FROM orcamento_ati WHERE id_atividade = ?`,
                [activityId]
              );
            }
          } else if (orcamento > 0) {
            await connection.query(
              `INSERT INTO orcamento_ati (valor, id_atividade, id_orcamento) VALUES (?, ?, ?)`,
              [orcamento, activityId, idOrcamento]
            );
          }
        }
      }

      if (participantes && Array.isArray(participantes)) {
        await connection.query(
          'DELETE FROM responsaveis_atividade WHERE id_atividade = ?',
          [activityId]
        );

        if (participantes.length > 0) {
          const [novosResponsaveis] = await connection.query<RowDataPacket[]>(
            'SELECT id_usuario, nome_usuario FROM usuarios WHERE email_usuario IN (?)',
            [participantes]
          );

          if (novosResponsaveis.length > 0) {
            const valoresResponsaveis = novosResponsaveis.map(user => [activityId, user.id_usuario]);
            await connection.query(
              'INSERT INTO responsaveis_atividade (id_atividade, id_responsavel) VALUES ?',
              [valoresResponsaveis]
            );

            const nomesResponsaveis = novosResponsaveis.map(u => u.nome_usuario).join(', ');
            
            await criarNotificacao(
              NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO,
              `${nomeEditor} adicionou ${nomesResponsaveis} como responsáveis pela atividade "${nomeAtividade}"`,
              projetoId,
              null,
              activityId,
              'atividade'
            );
          }
        }
      }

      await criarNotificacao(
        NOTIFICATION_TYPES.ATIVIDADE_ATUALIZADA,
        `${nomeEditor} atualizou a atividade "${nomeAtividade}"`,
        projetoId,
        null,
        activityId,
        'atividade'
      );

      await connection.commit();
      
      return res.json({
        success: true,
        message: 'Atividade atualizada com sucesso',
        data: {
          id_atividade: activityId,
          nome_atividade,
          descricao_atividade,
          storypoint_atividade,
          orcamento_atividade: orcamento || 0
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erro na transação:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao atualizar atividade'
    });
  }
};

export const obterParticipantesProjeto = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const projetoId = Number(projectId);
    if (isNaN(projetoId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do projeto inválido'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      const [participantes] = await connection.query<RowDataPacket[]>(
        `SELECT 
           u.id_usuario, 
           u.email_usuario, 
           u.nome_usuario,
           pp.tipo
         FROM projetos_participantes pp
         JOIN usuarios u ON pp.id_usuario = u.id_usuario
         WHERE pp.id_projeto = ?`,
        [projetoId]
      );

      res.json({ 
        success: true, 
        data: participantes 
      });
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao obter participantes:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao obter participantes' 
    });
  }
};

export const obterDetalhesAtividade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const atividadeId = Number(id);
    if (isNaN(atividadeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da atividade inválido'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      const [atividade] = await connection.query<RowDataPacket[]>(`
        SELECT 
          pa.id_atividade,
          pa.id_projeto,
          pa.nome_atividade,
          pa.descricao_atividade,
          NULLIF(pa.storypoint_atividade, 0) as storypoint_atividade,
          GROUP_CONCAT(DISTINCT u.email_usuario) as responsaveis,
          CASE WHEN pa.realizada = 1 THEN TRUE ELSE FALSE END as realizada,
          pa.fim_atividade as data_conclusao,
          COALESCE(MAX(oa.valor), 0) as orcamento
        FROM projetos_atividades pa
        LEFT JOIN responsaveis_atividade ra ON pa.id_atividade = ra.id_atividade
        LEFT JOIN usuarios u ON ra.id_responsavel = u.id_usuario
        LEFT JOIN orcamento_ati oa ON pa.id_atividade = oa.id_atividade
        WHERE pa.id_atividade = ?
        GROUP BY 
          pa.id_atividade,
          pa.id_projeto,
          pa.nome_atividade,
          pa.descricao_atividade,
          pa.storypoint_atividade,
          pa.realizada,
          pa.fim_atividade
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
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao obter detalhes da atividade:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao obter detalhes da atividade' 
    });
  }
};

export const atualizarResponsavelAtividade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, isResponsavel, currentUserId } = req.body as {
      userId: number,
      isResponsavel: boolean,
      currentUserId: number
    };

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
      const [user] = await connection.query<RowDataPacket[]>(
        'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
        [userId]
      );
      
      const [currentUser] = await connection.query<RowDataPacket[]>(
        'SELECT nome_usuario FROM usuarios WHERE id_usuario = ?',
        [currentUserId]
      );

      if (user.length === 0 || currentUser.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      const userName = user[0].nome_usuario;
      const currentUserName = currentUser[0].nome_usuario;

      const [atividade] = await connection.query<RowDataPacket[]>(
        `SELECT nome_atividade, id_projeto FROM projetos_atividades WHERE id_atividade = ?`,
        [atividadeId]
      );

      if (atividade.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      const atividadeNome = atividade[0].nome_atividade;
      const projetoId = atividade[0].id_projeto;

      const [existing] = await connection.query<RowDataPacket[]>(
        `SELECT 1 FROM responsaveis_atividade 
         WHERE id_atividade = ? AND id_responsavel = ?`,
        [atividadeId, userId]
      );

      if (isResponsavel) {
        if (existing.length === 0) {
          await connection.query(
            `INSERT INTO responsaveis_atividade (id_atividade, id_responsavel)
             VALUES (?, ?)`,
            [atividadeId, userId]
          );

          await criarNotificacao(
            NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO,
            `${userName} foi adicionado(a) como responsável na atividade: ${atividadeNome}`,
            projetoId,
            currentUserId,
            atividadeId,
            'atividade'
          );
        }
      } else {
        if (existing.length > 0) {
          await connection.query(
            `DELETE FROM responsaveis_atividade 
             WHERE id_atividade = ? AND id_responsavel = ?`,
            [atividadeId, userId]
          );

          await criarNotificacao(
            NOTIFICATION_TYPES.RESPONSAVEL_REMOVIDO,
            `${userName} foi removido(a) como responsável da atividade: ${atividadeNome}`,
            projetoId,
            currentUserId,
            atividadeId,
            'atividade'
          );
        }
      }

      await criarNotificacao(
        isResponsavel ? NOTIFICATION_TYPES.RESPONSAVEL_ADICIONADO : NOTIFICATION_TYPES.RESPONSAVEL_REMOVIDO,
        `${currentUserName} ${isResponsavel ? 'adicionou' : 'removeu'} ${userName} como responsável na atividade: ${atividadeNome}`,
        projetoId,
        currentUserId,
        atividadeId,
        'atividade'
      );

      await connection.commit();
      res.json({ 
        success: true, 
        message: `Responsável ${isResponsavel ? 'adicionado' : 'removido'} com sucesso`,
        nome_operador: currentUserName,
        nome_usuario_afetado: userName
      });
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Erro ao atualizar responsável:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao atualizar responsável' 
    });
  }
};