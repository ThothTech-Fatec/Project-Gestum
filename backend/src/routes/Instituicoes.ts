import { Request, Response } from 'express';
import pool from '../config/dbconnection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

interface Instituicao extends RowDataPacket {
  id_empresa: number;
  nome_empresa: string;
  cnpj: string;
  created_at?: Date;
}

export const listarInstituicoes = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.query<Instituicao[]>(
      'SELECT id_empresa, nome_empresa FROM instituicoes ORDER BY nome_empresa'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar instituições:', error);
    res.status(500).json({ error: 'Erro ao buscar instituições' });
  } finally {
    connection.release();
  }
};

export const criarInstituicao = async (req: Request, res: Response) => {
  const { nome_empresa, cnpj } = req.body;
  const connection = await pool.getConnection();
  
  if (!nome_empresa || !cnpj) {
    connection.release();
    return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
  }

  try {
    await connection.beginTransaction();
    
    // Validação adicional do CNPJ
    const cnpjNumeros = cnpj.replace(/\D/g, '');
    if (cnpjNumeros.length !== 14) {
      await connection.rollback();
      return res.status(400).json({ error: 'CNPJ deve conter 14 dígitos' });
    }

    // Verifica se CNPJ já existe
    const [existing] = await connection.query<Instituicao[]>(
      'SELECT id_empresa FROM instituicoes WHERE cnpj = ?',
      [cnpjNumeros]
    );
    
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }

    // Insere nova instituição
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO instituicoes (nome_empresa, cnpj) VALUES (?, ?)',
      [nome_empresa, cnpjNumeros]
    );
    
    // Obtém a instituição recém-criada
    const [rows] = await connection.query<Instituicao[]>(
      'SELECT * FROM instituicoes WHERE id_empresa = ?',
      [result.insertId]
    );
    
    await connection.commit();
    res.status(201).json(rows[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar instituição:', error);
    res.status(500).json({ error: 'Erro ao criar instituição' });
  } finally {
    connection.release();
  }
};