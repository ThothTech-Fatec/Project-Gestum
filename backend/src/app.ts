  import express from 'express';
  import cors from 'cors';
  import { cadastrarUsuario } from './routes/SignUp.js';
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