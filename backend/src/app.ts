import express from 'express';
import cors from 'cors';
import { cadastrarUsuario } from './routes/SignUp.js';
import { Login } from './routes/Login.js';
import { AlterProfile, GetProfileImage } from './routes/AlterProfile.js';
import multer from 'multer';

const app = express();

// Configuração do CORS
app.use(cors({
  origin: process.env.ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));

// Middleware para interpretar JSON
app.use(express.json());

// Configuração do multer para processar o upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// Rota para cadastro de usuário
app.post('/signup', (req, res, next) => {
  cadastrarUsuario(req, res).then(() => next()).catch((err) => next(err));
});

// Rota para login
app.post('/login', Login);

// Rota para alteração de perfil (com upload de arquivo)
app.post('/alterprofile', upload.single('profilePic'), AlterProfile);

app.get('/profileimage/:userEmail', GetProfileImage);

// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});