import pool from '../config/dbconnection.js';
export const DatasInicio_Fim = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT data_inicio_proj, data_fim_proj FROM projetos WHERE id_projeto = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensagem: "Projeto não encontrado" });
        }
        return res.json(rows[0]);
    }
    catch (error) {
        console.error("Erro ao buscar projeto:", error);
        return res.status(500).json({ mensagem: "Erro no servidor" });
    }
};
