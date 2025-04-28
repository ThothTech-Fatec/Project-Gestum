import express from 'express';
import { listarAtividades, criarAtividade, deletarAtividade, marcarComoRealizada, atualizarResponsavelAtividade, obterParticipantesProjeto, obterDetalhesAtividade } from '../routes/atividades.js';
const router = express.Router({ mergeParams: true });
// Listar todas as atividades de um projeto
router.get('/', listarAtividades);
// Criar nova atividade
router.post('/', criarAtividade);
// Obter detalhes de uma atividade específica
router.get('/:activityId', obterDetalhesAtividade);
// Deletar atividade
router.delete('/:activityId', deletarAtividade);
// Marcar/desmarcar atividade como realizada
router.put('/:activityId/status', marcarComoRealizada);
// Adicionar/remover responsável
router.put('/:activityId/responsibles', atualizarResponsavelAtividade);
// Obter participantes do projeto (para seleção de responsáveis)
router.get('/participants/available', obterParticipantesProjeto);
export default router;
