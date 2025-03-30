import { Request, Response } from 'express';
import pool from '../config/dbconnection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

interface AreaAtuacao extends RowDataPacket {
  id: number;
  nome: string;
  created_at?: Date;
}

export const criarAreaAtuacao = async (req: Request, res: Response) => {
  const { nome } = req.body;
  
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Inserir nova área
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO areas_atuacao (nome) VALUES (?)',
      [nome]
    );
    
    // Obter a área recém-criada
    const [rows] = await connection.query<AreaAtuacao[]>(
      'SELECT * FROM areas_atuacao WHERE id = ?',
      [result.insertId]
    );
    
    await connection.commit();
    res.status(201).json(rows[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar área:', error);
    res.status(500).json({ error: 'Erro ao criar área de atuação' });
  } finally {
    connection.release();
  }
};

export const buscarAreasAtuacao = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.query<AreaAtuacao[]>(
      'SELECT * FROM areas_atuacao ORDER BY nome'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    res.status(500).json({ error: 'Erro ao buscar áreas de atuação' });
  } finally {
    connection.release();
  }
};