import express from 'express';
import cors from 'cors';
import { cadastrarUsuario } from './routes/SignUp.js';
const app = express();
// Configuração do CORS
app.use(cors({
    origin: process.env.ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
}));
// Middleware para interpretar JSON
app.use(express.json());
// Rota para cadastro de usuário
app.post('/signup', (req, res, next) => {
    cadastrarUsuario(req, res).then(() => next()).catch((err) => next(err));
});
// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
