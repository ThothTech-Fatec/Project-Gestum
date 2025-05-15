import pool from '../config/dbconnection.js';
export const getStoryPointsByStatus = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        // Verifica se o projeto existe primeiro
        const [projeto] = await connection.query('SELECT id_projeto FROM projetos WHERE id_projeto = ?', [id]);
        if (projeto.length === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        // Retorna todos os dados em uma única consulta
        const [results] = await connection.query(`
      SELECT 
        SUM(CASE WHEN realizada = 1 THEN storypoint_atividade ELSE 0 END) AS concluido,
        SUM(CASE WHEN realizada = 0 THEN storypoint_atividade ELSE 0 END) AS naoConcluido,
        SUM(storypoint_atividade) AS total
      FROM projetos_atividades
      WHERE id_projeto = ?
    `, [id]);
        // Verifica se existem atividades para o projeto
        if (results[0].total === null) {
            return res.json({
                concluido: 0,
                naoConcluido: 0,
                total: 0,
                message: 'Nenhuma atividade encontrada para este projeto'
            });
        }
        res.json({
            concluido: results[0].concluido || 0,
            naoConcluido: results[0].naoConcluido || 0,
            total: results[0].total || 0
        });
    }
    catch (error) {
        console.error('Erro ao buscar storypoints:', error);
        res.status(500).json({
            error: 'Erro ao buscar storypoints',
            details: error instanceof Error ? error.message : String(error)
        });
    }
    finally {
        connection.release();
    }
};
