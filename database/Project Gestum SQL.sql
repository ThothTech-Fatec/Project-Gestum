create database gestum;

use gestum;

create table usuarios
(id_usuario INT PRIMARY KEY auto_increment,
nome_usuario VARCHAR (50) NOT NULL,
email_usuario VARCHAR (80) NOT NULL,
senha_usuario VARCHAR (80) NOT NULL
);
create table projetos(
id_projeto INT PRIMARY KEY auto_increment,
nome_projeto VARCHAR (50) NOT NULL,
descricao_projeto VARCHAR(300) NOT NULL,
data_inicio_proj datetime default current_timestamp ,
data_fim_proj datetime 
);

create table projetos_participantes
(id_participantes INT PRIMARY KEY auto_increment,
id_usuario INT,
id_projeto INT,
FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
FOREIGN KEY(id_projeto) REFERENCES projetos(id_projeto),
colaborador boolean
);