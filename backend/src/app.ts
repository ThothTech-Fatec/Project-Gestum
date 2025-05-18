import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
  import { cadastrarUsuario } from './routes/SignUp.js';
  import { RowDataPacket } from 'mysql2';
  import { Login } from './routes/Login.js';
  import { AlterProfile, GetProfileImage } from './routes/AlterProfile.js';
  import multer from 'multer';
  import {
    getUserProjects,
    createProject,
    getProjectDetails,
    updateProject,
    deleteProject
  } from './routes/CrudHomeLogin.js'; 
  import { buscarAreasAtuacao, criarAreaAtuacao } from './routes/Area_Atuacao.js';
  import { addParticipant, getProjectParticipants, removeParticipant } from './routes/Participantes.js';
  import { atualizarAtividade, atualizarResponsavelAtividade, criarAtividade, deletarAtividade, listarAtividades, marcarComoRealizada, obterParticipantesProjeto } from './routes/atividades.js';
  import { criarInstituicao, listarInstituicoes } from './routes/Instituicoes.js';
  import { DatasInicio_Fim } from './routes/Calendario.js';
  import { getStoryPointsByStatus } from './routes/ProgressBar.js';
  import{listarNotificacoes} from './routes/notificationController.js'
import pool from './config/dbconnection.js';



  const app = express();

  // Configuração do CORS
  app.use(cors({
    origin: process.env.ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));

  // Middleware para interpretar JSON
  app.use(express.json());

  // Configuração do multer para processar o upload de arquivos
  const upload = multer({ storage: multer.memoryStorage() });

interface DashboardMetrics extends RowDataPacket {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

interface WeeklyProgress extends RowDataPacket {
  date: string;
  completed: number;
}
  // Rotas de autenticação
  app.post('/signup', (req, res, next) => {
    cadastrarUsuario(req, res).then(() => next()).catch((err) => next(err));
  });

  app.post('/login', Login);
  app.post('/alterprofile', upload.single('profilePic'), AlterProfile);

  // Rotas de projetos
  app.get('/user_projects', getUserProjects); 
  app.post('/create_projects', createProject); 
  app.get('/get_projectdetails', getProjectDetails);
  app.put('/update_project/:id', updateProject); 
  app.delete('/delete_project/:id', deleteProject); 
  app.post('/add_participant/:id', addParticipant); 
  app.delete('/remove_participant/:id', removeParticipant);
  app.post('/criar_area', criarAreaAtuacao);
  app.get('/areas', buscarAreasAtuacao);
  app.get('/project_participants', getProjectParticipants);
  app.post('/atividades', criarAtividade);
  app.get('/atividades', listarAtividades);
  app.delete('/atividades/:id', deletarAtividade);
  app.get('/projetos/:projectId/participantes', obterParticipantesProjeto);
  app.post('/instituicoes', criarInstituicao);
  app.get('/getinstituicoes', listarInstituicoes);
  app.put('/:id/realizada', marcarComoRealizada);
  app.put('/:id/responsavel', atualizarResponsavelAtividade);
  app.get('/datasinicio_fim/:id', DatasInicio_Fim  )
  app.get('/progressStoryPoints/:id', getStoryPointsByStatus)
  app.put('/atividades/:id', atualizarAtividade)
  
// Rotas de notificação
  app.get('/api/notificacoes', listarNotificacoes);


  // Rota de imagem de perfil
  app.get('/profileimage/:userEmail', GetProfileImage);

  // Atualize a rota do dashboard
  // ... (importações anteriores permanecem iguais)

// ... (importações anteriores permanecem iguais)

app.get('/api/dashboard/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // 1. Verifica se o projeto existe
    const [project] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM projetos WHERE id_projeto = ?',
      [projectId]
    );

    if (project.length === 0) {
      return res.status(404).json({ 
        error: `Projeto com ID ${projectId} não encontrado`
      });
    }

    // 2. Busca métricas básicas
    const [tasks] = await pool.query<DashboardMetrics[]>(`
      SELECT
        COUNT(*) as totalTasks,
        SUM(CASE WHEN realizada = 1 THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN realizada = 0 AND data_limite_atividade < NOW() THEN 1 ELSE 0 END) as overdueTasks,
        SUM(storypoint_atividade) as totalStoryPoints,
        SUM(CASE WHEN realizada = 1 THEN storypoint_atividade ELSE 0 END) as completedStoryPoints
      FROM projetos_atividades
      WHERE id_projeto = ?
    `, [projectId]);

    // 3. Busca progresso semanal
    const [weeklyProgress] = await pool.query<WeeklyProgress[]>(`
      SELECT
        DATE(fim_atividade) as date,
        COUNT(*) as completed
      FROM projetos_atividades
      WHERE realizada = 1 AND fim_atividade >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND id_projeto = ?
      GROUP BY DATE(fim_atividade)
      ORDER BY DATE(fim_atividade)
    `, [projectId]);

    // 4. Busca participantes
    const [participants] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id_usuario, 
        u.email_usuario, 
        u.nome_usuario,
        pp.tipo
      FROM projetos_participantes pp
      JOIN usuarios u ON pp.id_usuario = u.id_usuario
      WHERE pp.id_projeto = ?
    `, [projectId]);

    res.json({
      totalTasks: tasks[0]?.totalTasks || 0,
      completedTasks: tasks[0]?.completedTasks || 0,
      overdueTasks: tasks[0]?.overdueTasks || 0,
      totalStoryPoints: tasks[0]?.totalStoryPoints || 0,
      completedStoryPoints: tasks[0]?.completedStoryPoints || 0,
      weeklyProgress: weeklyProgress || [],
      participants: participants || []
    });

  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ 
      error: 'Erro ao carregar dados do dashboard',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ... (restante do código do app.ts permanece igual)
// ... (restante do código permanece igual)
  // Middleware de erro (adicione no final, antes do listen)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
  });

  // Inicia o servidor
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
  