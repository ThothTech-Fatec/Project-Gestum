import { Request, Response } from 'express';
import pool from '../config/dbconnection.js';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2';

interface User extends RowDataPacket {
  id_usuario: number;
  nome_usuario: string;
  email_usuario: string;
}

interface Project extends RowDataPacket {
  id_projeto: number;
  nome_projeto: string;
  descricao_projeto: string;
  area_projeto: string;
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

interface ProjectWithRole extends Project {
  user_role: string;
}

export const createProject = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const { nome_projeto, descricao_projeto, data_fim_proj, userId } = req.body;
    
    if (!nome_projeto || !descricao_projeto || !data_fim_proj || !userId) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const area_projeto = 1;
    
    // Iniciar transação
    await connection.beginTransaction();

    // 1. Criar o projeto na tabela projetos
    const [projectResult] = await connection.query<ResultSetHeader>(`
      INSERT INTO projetos 
      (nome_projeto, area_projeto, descricao_projeto, data_inicio_proj, data_fim_proj) 
      VALUES (?, ?, ?, NOW(), ?)
    `, [nome_projeto, area_projeto, descricao_projeto, data_fim_proj]);
    
    const projectId = projectResult.insertId;

    // 2. Adicionar o criador como responsável na tabela projetos_participantes
    await connection.query<ResultSetHeader>(`
      INSERT INTO projetos_participantes 
      (id_usuario, id_projeto, tipo) 
      VALUES (?, ?, 'responsavel')
    `, [userId, projectId]);

    // Commit da transação
    await connection.commit();
    
    res.status(201).json({ projectId });
  } catch (error) {
    // Rollback em caso de erro
    await connection.rollback();
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ 
      error: 'Erro interno ao criar projeto',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    // Liberar a conexão
    connection.release();
  }
};

export const getUserProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || 1;
    
    const [projects] = await pool.query<(ProjectWithRole & RowDataPacket)[]>(`
      SELECT 
        p.id_projeto,
        p.nome_projeto,
        p.descricao_projeto,
        p.area_projeto,
        pa.area_atuacao as nome_area,  -- Adicionando o nome da área
        DATE_FORMAT(p.data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(p.data_fim_proj, '%d/%m/%Y') as data_fim_proj,
        p.progresso_projeto,
        pp.tipo as user_role 
      FROM projetos p
      JOIN projetos_participantes pp ON p.id_projeto = pp.id_projeto
      LEFT JOIN projetos_areas pa ON p.area_projeto = pa.id_area  -- LEFT JOIN para incluir mesmo sem área definida
      WHERE pp.id_usuario = ?
      ORDER BY p.data_inicio_proj DESC
    `, [userId]);
    
    const formattedProjects = projects.map(project => ({
      ...project,
      responsavel: project.user_role === 'responsavel' ? 'Você' : 'Equipe',
      nome_area: project.nome_area || 'Sem área definida'  // Fallback para projetos sem área
    }));
    
    res.json(formattedProjects);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Falha ao buscar projetos' });
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  try {
    const { id_projeto, userId } = req.query;

    if (!id_projeto || !userId) {
      return res.status(400).json({ error: 'ID do projeto e ID do usuário são obrigatórios' });
    }

    // Verifica se o usuário tem acesso ao projeto
    const [access] = await pool.query<(Participant & RowDataPacket)[]>(
      'SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?',
      [id_projeto, userId]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const userRole = access[0].tipo;

    // Obtém detalhes do projeto
    const [project] = await pool.query<(Project & RowDataPacket)[]>(`
      SELECT 
        id_projeto,
        nome_projeto,
        descricao_projeto,
        area_projeto,
        DATE_FORMAT(data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(data_fim_proj, '%d/%m/%Y') as data_fim_proj,
        progresso_projeto
      FROM projetos 
      WHERE id_projeto = ?`,
      [id_projeto]
    );

    if (project.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Obtém participantes do projeto
    const [participants] = await pool.query<(Participant & RowDataPacket)[]>(`
      SELECT u.id_usuario, u.nome_usuario, pp.tipo 
      FROM projetos_participantes pp
      JOIN usuarios u ON pp.id_usuario = u.id_usuario
      WHERE pp.id_projeto = ?
    `, [id_projeto]);

    const response = {
      ...project[0],
      user_role: userRole,
      participantes: participants
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar detalhes do projeto:', error);
    res.status(500).json({ error: 'Falha ao buscar detalhes do projeto' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { nome_projeto, descricao_projeto, data_fim_proj } = req.body;

    const area_projeto = 'teste';
    
    await pool.query<ResultSetHeader>(
      `UPDATE projetos 
       SET nome_projeto = ?, descricao_projeto = ?, area_projeto = ?, data_fim_proj = ?
       WHERE id_projeto = ?`,
      [nome_projeto, descricao_projeto, area_projeto, data_fim_proj, projectId]
    );
    
    res.json({ message: 'Projeto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Falha ao atualizar projeto' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    
    await pool.query<ResultSetHeader>(
      'DELETE FROM projetos WHERE id_projeto = ?', 
      [projectId]
    );
    
    res.json({ message: 'Projeto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    res.status(500).json({ error: 'Falha ao excluir projeto' });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { participantId, role } = req.body;
    
    const [user] = await pool.query<(User & RowDataPacket)[]>(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = ?', 
      [participantId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const [existing] = await pool.query<(Participant & RowDataPacket)[]>(
      'SELECT id_participante FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?',
      [projectId, participantId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuário já é participante do projeto' });
    }
    
    await pool.query<ResultSetHeader>(
      'INSERT INTO projetos_participantes (id_usuario, id_projeto, tipo) VALUES (?, ?, ?)',
      [participantId, projectId, role || 'colaborador']
    );
    
    const [project] = await pool.query<(Project & RowDataPacket)[]>(`
      SELECT 
        id_projeto,
        nome_projeto,
        DATE_FORMAT(data_inicio_proj, '%d/%m/%Y') as data_inicio_proj,
        DATE_FORMAT(data_fim_proj, '%d/%m/%Y') as data_fim_proj
      FROM projetos 
      WHERE id_projeto = ?`, 
      [projectId]
    );
    
    await pool.query<ResultSetHeader>(
      'INSERT INTO notificacoes (id_usuario, id_projeto, titulo, descricao, tipo) VALUES (?, ?, ?, ?, ?)',
      [
        participantId,
        projectId,
        'Convite para projeto',
        `Você foi adicionado ao projeto "${project[0].nome_projeto}" como ${role || 'colaborador'}`,
        'convite'
      ]
    );
    
    res.json({ message: 'Participante adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    res.status(500).json({ error: 'Falha ao adicionar participante' });
  }
};

export const createAreaAtuacao = async (req: Request, res: Response) => {
  try {
    const { area_atuacao } = req.body;

    if (!area_atuacao) {
      return res.status(400).json({ error: 'O nome da área de atuação é obrigatório' });
    }

    console.log('Criando área de atuação:', area_atuacao);  // Log para depuração

    // Inserir nova área de atuação na tabela projetos_areas
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO projetos_areas (area_atuacao) VALUES (?)',
      [area_atuacao]
    );

    res.status(201).json({
      message: 'Área de atuação criada com sucesso',
      id_area: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar área de atuação:', error);
    res.status(500).json({ error: 'Erro interno ao criar área de atuação' });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { participantId } = req.body;
    
    const [participant] = await pool.query<(Participant & RowDataPacket)[]>(
      'SELECT tipo FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?',
      [projectId, participantId]
    );
    
    if (participant.length === 0) {
      return res.status(404).json({ error: 'Participante não encontrado neste projeto' });
    }
    
    if (participant[0].tipo === 'responsavel') {
      const [owners] = await pool.query<({count: number} & RowDataPacket)[]>(
        'SELECT COUNT(*) as count FROM projetos_participantes WHERE id_projeto = ? AND tipo = "responsavel"',
        [projectId]
      );
      
      if (owners[0].count <= 1) {
        return res.status(400).json({ error: 'Não é possível remover o último responsável do projeto' });
      }
    }
    
    await pool.query<ResultSetHeader>(
      'DELETE FROM projetos_participantes WHERE id_projeto = ? AND id_usuario = ?',
      [projectId, participantId]
    );
    
    res.json({ message: 'Participante removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover participante:', error);
    res.status(500).json({ error: 'Falha ao remover participante' });
  }
};