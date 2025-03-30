import axios from 'axios';


const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função para cadastrar um novo usuário
export const signUp = async (name: string, email: string, password: string) => {
  try {
    console.log('Cadastrando usuário...');
    const response = await api.post('/signup', { name, email, password });
    return response.data;
  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    throw error;
  }
};

// Função para autenticar um usuário
export const Login = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw error;
  }
};
