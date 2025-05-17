import axios from 'axios';

export interface Notificacao {
  id: number;
  tipo: string;
  mensagem: string;
  projeto_id: number;
  usuario_id: number | null;
  referencia_id: number | null;
  referencia_tipo: string | null;
  lida: boolean;
  criado_em: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

// Listar notificações
export const listarNotificacoes = (projetoId: number): Promise<Notificacao[]> => {
  return axios.get(`${API_BASE_URL}/notificacoes?projeto_id=${projetoId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(res => res.data)
  .catch(err => {
    console.error("Erro ao buscar notificações:", err);
    throw err;
  });
};
