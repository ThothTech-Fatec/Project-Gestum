CREATE DATABASE IF NOT EXISTS gestum;
USE gestum;

CREATE TABLE usuarios (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  avatar LONGBLOB,
  nome_usuario VARCHAR(50) NOT NULL,
  email_usuario VARCHAR(80) NOT NULL UNIQUE,
  senha_usuario VARCHAR(80) NOT NULL
);

CREATE TABLE instituicoes (
  id_empresa INT PRIMARY KEY AUTO_INCREMENT,
  nome_empresa VARCHAR(50) NOT NULL,
  cnpj VARCHAR(14) NOT NULL
);

CREATE TABLE areas_atuacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projetos (
  id_projeto INT PRIMARY KEY AUTO_INCREMENT,
  nome_projeto VARCHAR(50) NOT NULL,
  descricao_projeto VARCHAR(300) NOT NULL,
  area_atuacao_id INT,
  progresso_projeto INT,
  data_inicio_proj DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_fim_proj DATETIME,
  id_empresa INT,
  FOREIGN KEY (area_atuacao_id) REFERENCES areas_atuacao(id),
  FOREIGN KEY (id_empresa) REFERENCES instituicoes(id_empresa)
);

CREATE TABLE orcamento (
  id_orcamento INT PRIMARY KEY AUTO_INCREMENT,
  id_projeto INT,
  valor DECIMAL(10,2),
  FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto) 
);

CREATE TABLE projetos_participantes (
  id_participante INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_projeto INT NOT NULL,
  tipo ENUM('responsavel', 'colaborador') NOT NULL DEFAULT 'responsavel',
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto) ON DELETE CASCADE,
  UNIQUE KEY (id_usuario, id_projeto) -- Evita duplicatas
);

CREATE TABLE projetos_atividades (
  id_atividade INT PRIMARY KEY AUTO_INCREMENT,
  id_projeto INT,
  nome_atividade VARCHAR(50),
  descricao_atividade VARCHAR(70),
  storypoint_atividade INT,
  realizada BOOLEAN DEFAULT FALSE,
  inicio_atividade DATETIME DEFAULT CURRENT_TIMESTAMP,
  fim_atividade DATETIME,
  FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto)
);

CREATE TABLE responsaveis_atividade (
  id_responsaveis_atividade INT PRIMARY KEY AUTO_INCREMENT,
  id_atividade INT, 
  id_responsavel INT,
  FOREIGN KEY (id_atividade) REFERENCES projetos_atividades(id_atividade),
  FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario),
  UNIQUE KEY (id_atividade, id_responsavel) -- Evita duplicatas
);

CREATE TABLE orcamento_ati (
  id_orcamento_ati INT PRIMARY KEY AUTO_INCREMENT,
  valor FLOAT,
  id_atividade INT,
  id_orcamento INT,
  FOREIGN KEY (id_atividade) REFERENCES projetos_atividades(id_atividade) ON DELETE CASCADE,
  FOREIGN KEY (id_orcamento) REFERENCES orcamento(id_orcamento) ON DELETE CASCADE
);

CREATE TABLE notificacoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  projeto_id INT NOT NULL,
  usuario_id INT, -- quem disparou a notificação
  referencia_id INT, -- id da atividade/membro relacionado
  referencia_tipo VARCHAR(50), -- 'atividade', 'membro', etc
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos(id_projeto),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);
