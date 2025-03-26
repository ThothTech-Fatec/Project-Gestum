create database gestum;

use gestum;

create table usuarios
(id_usuario INT PRIMARY KEY auto_increment,
avatar longblob,
nome_usuario VARCHAR (50) NOT NULL,
email_usuario VARCHAR (80) NOT NULL unique,
senha_usuario VARCHAR (80) NOT NULL
);


create table projetos(
id_projeto INT PRIMARY KEY auto_increment,
nome_projeto VARCHAR (50) NOT NULL,
descricao_projeto VARCHAR(300) NOT NULL,
area_projeto VARCHAR(60) NOT NULL,
progresso_projeto INT,
data_inicio_proj datetime default current_timestamp ,
data_fim_proj datetime 
);

CREATE TABLE notificacoes (
    id_notificacao INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL, 
    id_projeto INT,  
    titulo VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo ENUM('convite', 'atualizacao', 'comentario') NOT NULL,
    lida BOOLEAN DEFAULT FALSE, 
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto) ON DELETE CASCADE
);

CREATE TABLE projetos_participantes (
    id_participante INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_projeto INT NOT NULL,
    tipo ENUM('responsavel', 'colaborador') NOT NULL DEFAULT 'responsavel',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto) ON DELETE CASCADE
);

CREATE TABLE projetos_atividades (
	id_atividade INT PRIMARY KEY AUTO_INCREMENT,
    id_projeto INT,
    nome_atividade VARCHAR(50),
    descricao_atividade VARCHAR(70),
    storypoint_atividade INT,
    inicio_atividade datetime default current_timestamp,
	fim_atividade datetime,
    FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto)
);

CREATE TABLE responsaveis_atividade (
	id_responsaveis_atividade INT PRIMARY KEY AUTO_INCREMENT,
    id_atividade INT, 
    id_responsavel INT,
    FOREIGN KEY (id_atividade) REFERENCES projetos_atividades(id_atividade),
    FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario)
);

select * from usuarios;




