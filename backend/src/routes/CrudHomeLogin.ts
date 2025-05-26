import { Request, Response } from 'express';
import pool from '../config/dbconnection.js';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2';

interface User extends RowDataPacket {
  id_usuario: number;
  nome_usuario: string;
  email_usuario: string;
}

interface Instituicao extends RowDataPacket {
  id_empresa: number;
  nome_empresa: string;
  cnpj: string;
  created_at?: Date;
}

interface Project extends RowDataPacket {
  id_projeto: number;
  nome_projeto: string;
  descricao_projeto: string;
  area_atuacao_id: number;
  id_empresa: number;
  data_inicio_proj: string;
  data_fim_proj: string;
  progresso_projeto?: number;
}

interface Participant extends RowDataPacket {
  id_participante: number;
  id_usuario: number;
  id_projeto: number;
  tipo: 'responsavel' | 'colaborador';
}

interface Orcamento extends RowDataPacket {
  id_orcamento: number;
  id_projeto: number;
  valor: number;
}

interface OrcamentoAtividade extends RowDataPacket {
  id_orcamento_ati: number;
  id_atividade: number;
  id_orcamento: number;
  valor: number;
}

interface ProjectWithBudget extends Project {
  orcamento?: Orcamento;
  atividadesComOrcamento?: OrcamentoAtividade[];
}

interface ProjectWithRole extends Project {
  user_role: string;
}

export const createProject = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const { 
      nome_projeto, 
      area_atuacao_id, 
      descricao_projeto, 
      data_fim_proj, 
      userId, 
      id_empresa,
      valor,
      instituicoes_parceiras = [],
      instituicoes_financiadoras = [] 
    } = req.body;
    
    if (!nome_projeto || !descricao_projeto || !data_fim_proj || !userId || !id_empresa || valor === undefined) {
      connection.release();
      return res.status(400).json({ error: 'Todos os campos obrigatórios são necessários' });
    }
    
    // Validar quantidade de instituições
    if (instituicoes_parceiras.length > 5) {
      return res.status(400).json({ error: 'Máximo de 5 instituições parceiras permitidas' });
    }
    
    if (instituicoes_financiadoras.length > 3) {
      return res.status(400).json({ error: 'Máximo de 3 instituições financiadoras permitidas' });
    }

    await connection.beginTransaction();

    // Verifica se a instituição principal existe
    const [instituicao] = await connection.query<Instituicao[]>(
      'SELECT id_empresa, nome_empresa, cnpj FROM instituicoes WHERE id_empresa = ?',
      [id_empresa]
    );
    
    if (instituicao.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Instituição principal não encontrada' });
    }

    // Verificar se as instituições parceiras existem
    if (instituicoes_parceiras.length > 0) {
      const [parceiras] = await connection.query<Instituicao[]>(
        'SELECT id_empresa FROM instituicoes WHERE id_empresa IN (?)',
        [instituicoes_parceiras]
      );
      
      if (parceiras.length !== instituicoes_parceiras.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Uma ou mais instituições parceiras não foram encontradas' });
      }
    }

    // Verificar se as instituições financiadoras existem
    if (instituicoes_financiadoras.length > 0) {
      const [financiadoras] = await connection.query<Instituicao[]>(
        'SELECT id_empresa FROM instituicoes WHERE id_empresa IN (?)',
        [instituicoes_financiadoras]
      );
      
      if (financiadoras.length !== instituicoes_financiadoras.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Uma ou mais instituições financiadoras não foram encontradas' });
      }
    }

    // Cria o projeto
    const [projectResult] = await connection.query<ResultSetHeader>(`
      INSERT INTO projetos 
      (nome_projeto, area_atuacao_id, descricao_projeto, data_inicio_proj, data_fim_proj, id_empresa) 
      VALUES (?, ?, ?, NOW(), ?, ?)
    `, [nome_projeto, area_atuacao_id, descricao_projeto, data_fim_proj, id_empresa]);
    
    const projectId = projectResult.insertId;

    // Adiciona o criador como responsável
    await connection.query<ResultSetHeader>(`
      INSERT INTO projetos_participantes 
      (id_usuario, id_projeto, tipo) 
      VALUES (?, ?, 'responsavel')
    `, [userId, projectId]);

    // Adiciona orçamento
    await connection.query<ResultSetHeader>(`
      INSERT INTO orcamento 
      (id_projeto, valor) 
      VALUES (?, ?)
    `, [projectId, valor]);

    // Adiciona instituições parceiras
    if (instituicoes_parceiras.length > 0) {
      const parceirasValues = instituicoes_parceiras.map((id: number) => [projectId, id]);
      await connection.query<ResultSetHeader>(
        'INSERT INTO projetos_instituicoes_parceiras (id_projeto, id_empresa) VALUES ?',
        [parceirasValues]
      );
    }

    // Adiciona instituições financiadoras
    if (instituicoes_financiadoras.length > 0) {
      const financiadorasValues = instituicoes_financiadoras.map((id: number) => [projectId, id]);
      await connection.query<ResultSetHeader>(
        'INSERT INTO projetos_instituicoes_financiadoras (id_projeto, id_empresa) VALUES ?',
        [financiadorasValues]
      );
    }

    await connection.commit();
    
    // Retorna os dados completos
    res.status(201).json({ 
      projectId,
      instituicao: {
        id_empresa: instituicao[0].id_empresa,
        nome_empresa: instituicao[0].nome_empresa,
        cnpj: instituicao[0].cnpj
      },
      orcamento: valor,
      instituicoes_parceiras,
      instituicoes_financiadoras
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ 
      error: 'Erro interno ao criar projeto',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    connection.release();
  }
};

export const getUserProjects = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  const connection = await pool.getConnection();
  
  try {
    const [projects] = await connection.query<RowDataPacket[]>(`
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
        o.valor as orcamento_total,
        (SELECT COUNT(*) FROM projetos_instituicoes_parceiras pip WHERE pip.id_projeto = p.id_projeto) as total_parceiras,
        (SELECT COUNT(*) FROM projetos_instituicoes_financiadoras pif WHERE pif.id_projeto = p.id_projeto) as total_financiadoras
      FROM projetos p
      JOIN projetos_participantes pp ON p.id_projeto = pp.id_projeto
      LEFT JOIN areas_atuacao a ON p.area_atuacao_id = a.id
      LEFT JOIN instituicoes i ON p.id_empresa = i.id_empresa
      LEFT JOIN orcamento o ON p.id_projeto = o.id_projeto
      WHERE pp.id_usuario = ?
      ORDER BY p.data_inicio_proj DESC
    `, [userId]);

    res.json(projects);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  } finally {
    connection.release();
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const { id_projeto, userId } = req.query;

    if (!id_projeto || !userId) {
      connection.release();
      return res.status(400).json({ error: 'ID do projeto e ID do usuário são obrigatórios' });
    }

    // Verifica acesso
    const [access] = await connection.query<(Participant & RowDataPacket)[]>(
      'SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?',
      [id_projeto, userId]
    );

    if (access.length === 0) {
      connection.release();
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const userRole = access[0].tipo;

    // Obtém detalhes do projeto
    const [project] = await connection.query<(Project & RowDataPacket)[]>(`
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
      WHERE p.id_projeto = ?`,
      [id_projeto]
    );

    if (project.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Obtém atividades com orçamento
    const [atividadesOrcamento] = await connection.query<(OrcamentoAtividade & RowDataPacket)[]>(`
      SELECT oa.*, pa.nome_atividade 
      FROM orcamento_ati oa
      JOIN projetos_atividades pa ON oa.id_atividade = pa.id_atividade
      WHERE oa.id_orcamento = ?`,
      [project[0].id_orcamento]
    );

    // Obtém participantes
    const [participants] = await connection.query<(Participant & RowDataPacket)[]>(`
      SELECT u.id_usuario, u.nome_usuario, pp.tipo 
      FROM projetos_participantes pp
      JOIN usuarios u ON pp.id_usuario = u.id_usuario
      WHERE pp.id_projeto = ?
    `, [id_projeto]);

    // Obtém instituições parceiras
    const [parceiras] = await connection.query<Instituicao[]>(`
      SELECT i.id_empresa, i.nome_empresa, i.cnpj
      FROM projetos_instituicoes_parceiras pip
      JOIN instituicoes i ON pip.id_empresa = i.id_empresa
      WHERE pip.id_projeto = ?
    `, [id_projeto]);

    // Obtém instituições financiadoras
    const [financiadoras] = await connection.query<Instituicao[]>(`
      SELECT i.id_empresa, i.nome_empresa, i.cnpj
      FROM projetos_instituicoes_financiadoras pif
      JOIN instituicoes i ON pif.id_empresa = i.id_empresa
      WHERE pif.id_projeto = ?
    `, [id_projeto]);

    const response = {
      ...project[0],
      user_role: userRole,
      participantes: participants,
      atividadesComOrcamento: atividadesOrcamento,
      instituicoes_parceiras: parceiras,
      instituicoes_financiadoras: financiadoras
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar detalhes do projeto:', error);
    res.status(500).json({ 
      error: 'Falha ao buscar detalhes do projeto',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const projectId = req.params.id;
    const { 
      nome_projeto, 
      area_atuacao_id, 
      descricao_projeto, 
      data_fim_proj, 
      id_empresa, 
      valor,
      instituicoes_parceiras = [],
      instituicoes_financiadoras = [] 
    } = req.body;

    // Validar quantidade de instituições
    if (instituicoes_parceiras.length > 5) {
      return res.status(400).json({ error: 'Máximo de 5 instituições parceiras permitidas' });
    }
    
    if (instituicoes_financiadoras.length > 3) {
      return res.status(400).json({ error: 'Máximo de 3 instituições financiadoras permitidas' });
    }

    await connection.beginTransaction();
    
    // Verifica se a nova instituição principal existe
    if (id_empresa) {
      const [instituicao] = await connection.query<Instituicao[]>(
        'SELECT id_empresa FROM instituicoes WHERE id_empresa = ?',
        [id_empresa]
      );
      
      if (instituicao.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Instituição principal não encontrada' });
      }
    }

    // Verificar se as instituições parceiras existem
    if (instituicoes_parceiras.length > 0) {
      const [parceiras] = await connection.query<Instituicao[]>(
        'SELECT id_empresa FROM instituicoes WHERE id_empresa IN (?)',
        [instituicoes_parceiras]
      );
      
      if (parceiras.length !== instituicoes_parceiras.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Uma ou mais instituições parceiras não foram encontradas' });
      }
    }

    // Verificar se as instituições financiadoras existem
    if (instituicoes_financiadoras.length > 0) {
      const [financiadoras] = await connection.query<Instituicao[]>(
        'SELECT id_empresa FROM instituicoes WHERE id_empresa IN (?)',
        [instituicoes_financiadoras]
      );
      
      if (financiadoras.length !== instituicoes_financiadoras.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Uma ou mais instituições financiadoras não foram encontradas' });
      }
    }

    // Atualiza o projeto
    await connection.query<ResultSetHeader>(
      `UPDATE projetos 
       SET nome_projeto = ?, descricao_projeto = ?, area_atuacao_id = ?, 
           data_fim_proj = ?, id_empresa = ?
       WHERE id_projeto = ?`,
      [nome_projeto, descricao_projeto, area_atuacao_id, data_fim_proj, id_empresa, projectId]
    );

    // Atualiza ou cria o orçamento
    if (valor !== undefined) {
      const [existingBudget] = await connection.query<Orcamento[]>(
        'SELECT id_orcamento FROM orcamento WHERE id_projeto = ?',
        [projectId]
      );

      if (existingBudget.length > 0) {
        await connection.query<ResultSetHeader>(
          'UPDATE orcamento SET valor = ? WHERE id_projeto = ?',
          [valor, projectId]
        );
      } else {
        await connection.query<ResultSetHeader>(
          'INSERT INTO orcamento (id_projeto, valor) VALUES (?, ?)',
          [projectId, valor]
        );
      }
    }

    // Atualiza instituições parceiras
    await connection.query(
      'DELETE FROM projetos_instituicoes_parceiras WHERE id_projeto = ?',
      [projectId]
    );
    
    if (instituicoes_parceiras.length > 0) {
      const parceirasValues = instituicoes_parceiras.map((id: number) => [projectId, id]);
      await connection.query(
        'INSERT INTO projetos_instituicoes_parceiras (id_projeto, id_empresa) VALUES ?',
        [parceirasValues]
      );
    }

    // Atualiza instituições financiadoras
    await connection.query(
      'DELETE FROM projetos_instituicoes_financiadoras WHERE id_projeto = ?',
      [projectId]
    );
    
    if (instituicoes_financiadoras.length > 0) {
      const financiadorasValues = instituicoes_financiadoras.map((id: number) => [projectId, id]);
      await connection.query(
        'INSERT INTO projetos_instituicoes_financiadoras (id_projeto, id_empresa) VALUES ?',
        [financiadorasValues]
      );
    }

    await connection.commit();
    
    res.json({ 
      message: 'Projeto atualizado com sucesso',
      orcamento_atualizado: valor !== undefined,
      instituicoes_parceiras_atualizadas: instituicoes_parceiras.length > 0,
      instituicoes_financiadoras_atualizadas: instituicoes_financiadoras.length > 0
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ 
      error: 'Falha ao atualizar projeto',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
};

// Função para excluir um projeto e suas notificações
export const deleteProject = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const projectId = req.params.id;
    
    await connection.beginTransaction();

    // 1. Obter todas as atividades do projeto
    const [atividades] = await connection.query<RowDataPacket[]>(
      'SELECT id_atividade FROM projetos_atividades WHERE id_projeto = ?',
      [projectId]
    );

    // 2. Para cada atividade, excluir suas dependências
    for (const atividade of atividades) {
      // 2.1. Excluir responsáveis pela atividade
      await connection.query<ResultSetHeader>(
        'DELETE FROM responsaveis_atividade WHERE id_atividade = ?',
        [atividade.id_atividade]
      );

      // 2.2. Excluir orçamentos específicos da atividade
      await connection.query<ResultSetHeader>(
        'DELETE FROM orcamento_ati WHERE id_atividade = ?',
        [atividade.id_atividade]
      );
    }

    // 3. Excluir as atividades do projeto
    await connection.query<ResultSetHeader>(
      'DELETE FROM projetos_atividades WHERE id_projeto = ?',
      [projectId]
    );

    // 4. Excluir notificações relacionadas ao projeto
    await connection.query<ResultSetHeader>(
      'DELETE FROM notificacoes WHERE projeto_id = ?', 
      [projectId]
    );

    // 5. Excluir orçamento principal do projeto
    await connection.query<ResultSetHeader>(
      'DELETE FROM orcamento WHERE id_projeto = ?',
      [projectId]
    );

    // 6. Excluir instituições parceiras
    await connection.query<ResultSetHeader>(
      'DELETE FROM projetos_instituicoes_parceiras WHERE id_projeto = ?',
      [projectId]
    );

    // 7. Excluir instituições financiadoras
    await connection.query<ResultSetHeader>(
      'DELETE FROM projetos_instituicoes_financiadoras WHERE id_projeto = ?',
      [projectId]
    );

    // 8. Excluir participantes do projeto
    await connection.query<ResultSetHeader>(
      'DELETE FROM projetos_participantes WHERE id_projeto = ?',
      [projectId]
    );

    // 9. Finalmente, excluir o projeto
    await connection.query<ResultSetHeader>(
      'DELETE FROM projetos WHERE id_projeto = ?', 
      [projectId]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true,
      message: 'Projeto e todos os dados relacionados foram excluídos com sucesso',
      atividadesExcluidas: atividades.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir projeto:', error);
    res.status(500).json({ 
      success: false,
      error: 'Falha ao excluir projeto',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : String(error) : 
        'Ocorreu um erro interno'
    });
  } finally {
    connection.release();
  }
};

// Funções auxiliares para gerenciamento de instituições
export const addInstituicaoParceira = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const { id_projeto, id_empresa } = req.body;

    // Verificar se o projeto existe
    const [project] = await connection.query<RowDataPacket[]>(
      'SELECT id_projeto FROM projetos WHERE id_projeto = ?',
      [id_projeto]
    );

    if (project.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Verificar se a instituição existe
    const [instituicao] = await connection.query<RowDataPacket[]>(
      'SELECT id_empresa FROM instituicoes WHERE id_empresa = ?',
      [id_empresa]
    );

    if (instituicao.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }

    // Verificar quantidade máxima de parceiras (5)
    const [count] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM projetos_instituicoes_parceiras WHERE id_projeto = ?',
      [id_projeto]
    );

    if (count[0].total >= 5) {
      connection.release();
      return res.status(400).json({ error: 'Limite máximo de 5 instituições parceiras atingido' });
    }

    // Adicionar relação
    await connection.query<ResultSetHeader>(
      'INSERT INTO projetos_instituicoes_parceiras (id_projeto, id_empresa) VALUES (?, ?)',
      [id_projeto, id_empresa]
    );

    res.status(201).json({ message: 'Instituição parceira adicionada com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar instituição parceira:', error);
    res.status(500).json({ error: 'Falha ao adicionar instituição parceira' });
  } finally {
    connection.release();
  }
};

export const removeInstituicaoParceira = async (req: Request, res: Response) => {
  try {
    const { id_projeto, id_empresa } = req.body;

    await pool.query<ResultSetHeader>(
      'DELETE FROM projetos_instituicoes_parceiras WHERE id_projeto = ? AND id_empresa = ?',
      [id_projeto, id_empresa]
    );

    res.json({ message: 'Instituição parceira removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover instituição parceira:', error);
    res.status(500).json({ error: 'Falha ao remover instituição parceira' });
  }
};

export const addInstituicaoFinanciadora = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const { id_projeto, id_empresa } = req.body;

    // Verificar se o projeto existe
    const [project] = await connection.query<RowDataPacket[]>(
      'SELECT id_projeto FROM projetos WHERE id_projeto = ?',
      [id_projeto]
    );

    if (project.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Verificar se a instituição existe
    const [instituicao] = await connection.query<RowDataPacket[]>(
      'SELECT id_empresa FROM instituicoes WHERE id_empresa = ?',
      [id_empresa]
    );

    if (instituicao.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }

    // Verificar quantidade máxima de financiadoras (3)
    const [count] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM projetos_instituicoes_financiadoras WHERE id_projeto = ?',
      [id_projeto]
    );

    if (count[0].total >= 3) {
      connection.release();
      return res.status(400).json({ error: 'Limite máximo de 3 instituições financiadoras atingido' });
    }

    // Adicionar relação
    await connection.query<ResultSetHeader>(
      'INSERT INTO projetos_instituicoes_financiadoras (id_projeto, id_empresa) VALUES (?, ?)',
      [id_projeto, id_empresa]
    );

    res.status(201).json({ message: 'Instituição financiadora adicionada com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar instituição financiadora:', error);
    res.status(500).json({ error: 'Falha ao adicionar instituição financiadora' });
  } finally {
    connection.release();
  }
};

export const removeInstituicaoFinanciadora = async (req: Request, res: Response) => {
  try {
    const { id_projeto, id_empresa } = req.body;

    await pool.query<ResultSetHeader>(
      'DELETE FROM projetos_instituicoes_financiadoras WHERE id_projeto = ? AND id_empresa = ?',
      [id_projeto, id_empresa]
    );

    res.json({ message: 'Instituição financiadora removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover instituição financiadora:', error);
    res.status(500).json({ error: 'Falha ao remover instituição financiadora' });
  }
};