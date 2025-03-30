import pool from '../config/dbconnection.js';
export const criarAreaAtuacao = async (req, res) => {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Inserir nova área
        const [result] = await connection.execute('INSERT INTO areas_atuacao (nome) VALUES (?)', [nome]);
        // Obter a área recém-criada
        const [rows] = await connection.query('SELECT * FROM areas_atuacao WHERE id = ?', [result.insertId]);
        await connection.commit();
        res.status(201).json(rows[0]);
    }
    catch (error) {
        await connection.rollback();
        console.error('Erro ao criar área:', error);
        res.status(500).json({ error: 'Erro ao criar área de atuação' });
    }
    finally {
        connection.release();
    }
};
export const buscarAreasAtuacao = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM areas_atuacao ORDER BY nome');
        res.json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar áreas:', error);
        res.status(500).json({ error: 'Erro ao buscar áreas de atuação' });
    }
    finally {
        connection.release();
    }
};
