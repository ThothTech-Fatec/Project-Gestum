
<span id="topo">
    

<p align="center">
    <a href="#visao"> Visão geral </a> | 
    <a href="#solucao">Solução proposta</a> |
    <a href="#mvp">MVP</a> |  
    <a href="#backlog">Backlog</a> | 
    <a href="#criteriosaceita">Critérios de Aceitação</a> | 
    <a href="#requisitos">Requisitos</a> | 
    <a href="#sprint">Relatório das sprints</a> | 
    <a href="#tecnologias">Tecnologias utilizadas</a> | 
    <a href="#time">Time</a> | 

 

    
</p>
<span id="visao">
    
<h2 aling="center"> 🔍Visão geral </h2>

   
O projeto visa desenvolver um Sistema de Gestão de Projetos de Pesquisa e Desenvolvimento Tecnológico para a FAPG. A plataforma permitirá o cadastro, acompanhamento e organização de projetos, garantindo maior transparência, controle e eficiência na gestão.
 
<span id="solucao">
    
<h2 aling="center">🎯Solução Proposta </h2>

A solução consiste em um sistema web responsivo que permite cadastrar, visualizar, filtrar e monitorar projetos de forma intuitiva. Além disso, contará com relatórios, controle de status e níveis de permissão para garantir a segurança e organização das informações. O desenvolvimento será dividido em três sprints, priorizando as funcionalidades essenciais primeiro e refinando a usabilidade e segurança nas etapas finais.

<span id="mvp">
    
<h2 aling="center"> 🧩MVP </h2>

![Captura de tela 2025-03-28 225256](https://github.com/user-attachments/assets/578b95c8-b178-4884-ae31-22f9246511f1)


</p>
<span id="backlog">


<h2 aling="center">📃Backlog do Produto </h2>

| Rank | Prioridade |  User Story   | Estimativa | Sprint |  Requisito do Parceiro   | Critério de Aceitação | Status |
| :----: | :----: | :----: | :----: | :----: | :----: | :----: | :----: |
1|Alta|Como usuário, quero cadastrar novos projetos para que possamos acompanha.|5 Pontos|1|Cadastrar projetos da FAPG|-O usuário pode cadastrar um projeto informando nome,descrição,data de início,data de encerramento,área de atuação<br>-Após o cadastro, o projeto é salvo corretamente no sistema.|✅
2|Alta|Como usuário, quero visualizar a lista de projetos cadastrados para ter um panorama geral.|3 Pontos|1|Permitir recuperação de dados de projetos|-Os projetos são exibidos em uma lista com informações básicas.<br>-A lista é apresentada de forma clara e organizada, permitindo fácil acesso às informações dos projetos.|✅
3|Alta|	Como usuário, quero editar e excluir um projeto cadastrado para manter os dados atualizados.|5 Pontos|1|Permitir atualizar e excluir dados dos projetos|-O usuário pode editar ou excluir um projeto existente.<br>-As alterações feitas são salvas corretamente no sistema e refletem na visualização dos projetos.|✅
4|Alta|Como usuário, quero adicionar participantes a um projeto para que possamos colaborar de forma organizada.|5 Pontos|2|Adicionar participantes aos projetos|-O usuário pode adicionar participantes informando nome, e-mail e função.<br>-Os participantes são vinculados corretamente ao projeto e aparecem na lista de integrantes.|✅
5|Alta|Como usuário, quero criar atividades dentro dos projetos para organizar as tarefas e prazos.|8 Pontos|2|Criar atividades dentro dos projetos|-O usuário pode criar atividades informando nome, descrição, prazo, responsável e status.<br>-As atividades são corretamente vinculadas ao projeto.<br>-A lista de atividades é apresentada de forma organizada e permite fácil edição.|✅
6|Média|Como usuário, quero visualizar projetos por área de atuação para facilitar a busca.|3 Pontos|2|Visualizar projetos por área de atuação|-Os projetos são filtráveis por área de atuação.<br>-A filtragem por área de atuação é intuitiva e os resultados são apresentados de forma clara.|✅
7|Média|Como usuário, quero visualizar projetos por responsáveis para acompanhar suas atribuições.|3 Pontos|2|Visualizar projetos por responsáveis|-Os projetos podem ser filtrados por responsável.<br>-A lista de projetos exibe claramente os responsáveis de cada projeto filtrado.|✅
8|Alta|Como usuário, quero visualizar projetos por instituição para identificar quais projetos pertencem a cada organização.|3 Pontos|2|Visualizar projetos por instituição|-O usuário pode filtrar os projetos por instituição.<br>-A lista de projetos exibe claramente a instituição 9ssociada a cada projeto.<br>-A filtragem por instituição deve ser responsiva e eficiente.|✅
10|Alta|Como coordenador, quero visualizar projetos pelo status para acompanhar seu progresso.|5 Pontos|3|Visualizar projetos pelo status|-Os projetos são exibidos com status.<br>-A visualização do status é atualizada automaticamente conforme mudanças no progresso do projeto.|✅
11|Alta|Como coordenador, quero acompanhar o andamento das atividades de um projeto para garantir que prazos sejam cumpridos.|8 Pontos|3|Acompanhar andamento das atividades|-O sistema deve exibir uma linha do tempo das atividades.<br>-As atividades são exibidas de forma cronológica, destacando prazos importantes e marcos do projeto.<br>-O sistema deve permitir visualizar detalhes de cada atividade.|✅
12|Alta|Como coordenador, quero um dashboard de evolução de projetos para ter uma visão geral do progresso e métricas dos projetos.|8 Pontos|3|Dashboard de Evolução de Projetos: Visão geral dos Projetos / Visão por Projeto|-O dashboard deve exibir um panorama geral de todos os projetos, incluindo status e métricas de desempenho.<br>-Deve permitir visualizar um projeto específico com detalhes sobre progresso e atividades.<br>-As informações devem ser apresentadas de forma clara e visualmente intuitiva.|✅
13|Alta|Como coordenador, quero gerar relatórios de projetos e suas atividades por área para acompanhar a execução das tarefas.|5 Pontos|3|Relatórios: Projetos e suas atividades, por área|-O sistema deve permitir a geração de relatórios com a lista de projetos e suas atividades agrupadas por área.<br>-O relatório deve incluir informações sobre prazos, responsáveis e status das atividades.<br>-Deve ser possível exportar os relatórios em formatos como PDF e Excel.|✅


<span id="criteriosaceita">

<h2 aling="center">✅ Critérios de Aceitação </h2>


| Nº | Critério de Aceitação | Cenário de Teste |
|----|------------------------|------------------|
| 1.1 | Cadastrar projetos da FAPG | Dado que estou na tela de cadastro de projeto, quando preencho todos os campos obrigatórios e clico em 'Salvar', então o projeto deve ser salvo no sistema. |
| 1.2 | Cadastrar projetos da FAPG | Dado que preenchi o formulário de projeto, quando clico em 'Salvar', então os dados devem ser armazenados corretamente. |
| 2.1 | Permitir recuperação de dados de projetos | Dado que existem projetos cadastrados, quando acesso a lista de projetos, então devo visualizar todos os projetos com informações básicas. |
| 2.2 | Permitir recuperação de dados de projetos | Dado que estou na tela de listagem de projetos, então a lista deve estar organizada de forma clara e acessível. |
| 3.1 | Permitir atualizar e excluir dados dos projetos | Dado que estou na tela de projetos, quando clico em editar e altero os dados, então as alterações devem ser salvas corretamente. |
| 3.2 | Permitir atualizar e excluir dados dos projetos | Dado que estou na tela de projetos, quando clico em excluir, então o projeto deve ser removido do sistema. |
| 4.1 | Adicionar participantes aos projetos | Dado que estou na tela de participantes, quando informo nome, e-mail e função, então o participante deve ser adicionado ao projeto. |
| 4.2 | Adicionar participantes aos projetos | Dado que adicionei participantes, então eles devem aparecer corretamente na lista de integrantes. |
| 5.1 | Criar atividades dentro dos projetos | Dado que estou em um projeto, quando crio uma nova atividade com nome, descrição, prazo e responsável, então a atividade deve ser vinculada ao projeto. |
| 5.2 | Criar atividades dentro dos projetos | Dado que existem atividades em um projeto, então elas devem ser listadas de forma clara e permitir edição. |
| 6.1 | Visualizar projetos por área de atuação | Dado que estou na tela de projetos, quando seleciono uma área de atuação, então apenas os projetos daquela área devem ser exibidos. |
| 6.2 | Visualizar projetos por área de atuação | Dado que uso a filtragem por área, então os resultados devem ser apresentados de forma clara e intuitiva. |
| 7.1 | Visualizar projetos por responsáveis | Dado que estou na tela de projetos, quando filtro por responsável, então a lista deve mostrar apenas os projetos atribuídos àquele responsável. |
| 7.2 | Visualizar projetos por responsáveis | Dado que vejo um projeto listado, então devo ver claramente o responsável vinculado a ele. |
| 8.1 | Visualizar projetos por instituição | Dado que estou na tela de projetos, quando seleciono uma instituição, então os projetos vinculados devem ser listados. |
| 8.2 | Visualizar projetos por instituição | Dado que vejo a lista filtrada por instituição, então cada projeto deve exibir sua instituição associada. |
| 10.1 | Visualizar projetos pelo status | Dado que estou na tela de projetos, então cada projeto deve exibir seu status atual. |
| 10.2 | Visualizar projetos pelo status | Dado que um projeto tem mudanças em seu progresso, então o status exibido deve ser atualizado automaticamente. |
| 11.1 | Acompanhar andamento das atividades | Dado que estou visualizando um projeto, então deve ser exibida uma linha do tempo com as atividades do projeto. |
| 11.2 | Acompanhar andamento das atividades | Dado que visualizo a linha do tempo, então as atividades devem estar em ordem cronológica com destaque para marcos importantes. |
| 12.1 | Dashboard de Evolução de Projetos: Visão geral dos Projetos / Visão por Projeto | Dado que acesso o dashboard, então devo ver um panorama geral de todos os projetos, incluindo status e métricas. |
| 12.2 | Dashboard de Evolução de Projetos: Visão geral dos Projetos / Visão por Projeto | Dado que seleciono um projeto no dashboard, então devo ver detalhes como progresso e atividades. |
| 13.1 | Relatórios: Projetos e suas atividades, por área | Dado que desejo acompanhar tarefas, então devo gerar um relatório agrupado por área com informações de prazos e responsáveis. |
| 13.2 | Relatórios: Projetos e suas atividades, por área | Dado que desejo exportar o relatório, então devo conseguir baixar em PDF ou Excel. |





<span id="requisitos">



 <h2> 📈Requisitos Funcionais</h2>

| Nº Requisito   | Requisito do Parceiro |
| :----: | :----: |
| 1  | Cadastrar projetos da FAPG (nome do projeto, descrição, etc) |
| 2  | Permitir a recuperação de dados de projetos, de forma intuitiva |
| 3  | Permitir atualizar e excluir dados dos projetos. |
| 4  |  Visualizar projetos por **área de atuação** <br>  Visualizar projetos por **responsáveis** <br>  Visualizar projetos pelo **status**. <br>|
| 5  | Acompanhar andamento das atividades.|



 <h2> 📊Requisitos Não Funcionais</h2>

| Nº Requisito   | Requisito do Parceiro |
| :----: | :----: |
| 1 | Usabilidade. |
| 2 |  Privacidade de dados |
| 3 | Conversão de linguagem natural para chamada de funções . |
| 4 | Extração de parâmetros da mensagem do usuário . |
| 5 | Orquestrar chamadas de funções. |



<span id="sprint">
    
## 🧷Sprints

As entregas de valor de cada sprint estão mais detalhadas nos relatórios disponíveis nos links abaixo.

 
 ### <a href="./Relatorios/Sprint 1.md">1️⃣SPRINT 1 - Entrega: 30/03/2025</a> 

 ### <a href="./Relatorios/Sprint 2.md">2️⃣SPRINT 2 - Entrega: 27/04/2025</a> 

 ### <a href="./Relatorios/Sprint 3.md">3️⃣SPRINT 3 - Entrega: 25/05/2025</a> 



<span id="tecnologias">

## 🛠️ Tecnologias

As seguintes ferramentas, linguagens, bibliotecas e tecnologias foram usadas na construção do projeto:

<table>
  <thead>
    <th><img
    src="https://github.com/ThothTech-Fatec/Maat-View/blob/main/Static/Github.png"
    alt="Alt text"
    title="GitHub"
    style="display: inline-block; margin: 0 auto; width: 40px"></th>
    <th><img
    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original-wordmark.svg" /></th>
    <th><img
    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg"
    alt="Alt text"
    title="React"
    style="display: inline-block; margin: 0 auto; width: 60px"></th>
    <th><img
    src="https://user-images.githubusercontent.com/76211125/227505063-5839c5e0-9524-41ff-9d24-ce6cbaf217a6.png"
    alt="Alt text"
    title="VSCode"
    style="display: inline-block; margin: 0 auto; width: 50px"></th>
     <th><img
    src="https://user-images.githubusercontent.com/89823203/190717820-53e9f06b-1aec-4e46-91e1-94ea2cf07100.svg"
    alt="Alt text"
    title="JavaScript"
    style="display: inline-block; margin: 0 auto; width: 60px"></th>
     <th><img
    src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg"
    alt="Alt text"
    title="TypeScript"
    style="display: inline-block; margin: 0 auto; width: 60px"></th>
     <th><img
    src="https://user-images.githubusercontent.com/76211125/227503103-bb7005d7-5f2f-46e4-adb5-92ef19ce677d.png"
    alt="Alt text"
    title="CSS3"
    style="display: inline-block; margin: 0 auto; width: 60px"></th>
    <th><img
    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jira/jira-original.svg"
    alt="Alt text"
    title="Jira"
    style="display: inline-block; margin: 0 auto; width: 60px"></th>
  </thead>

  <tbody>
    <td>GitHub</td>
    <td>MySQL</td>
    <td>React</td>
    <td>VSCode</td>
    <td>JavaScript</td>
    <td>Typescript</td>
    <td>CSS3</td>
    <td>Jira</td>

  </tbody>

</table>
    
## 🎓TIME
<span id="time" width="100%" height="auto">


|      Nome      |    Função       |                            Github                             |                           Linkedin                           |
| :--------------: | :-----------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
| Flávio Gonçalves| Scrum Master | [<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/flaviogcunha)|[<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">](https://www.linkedin.com/in/flavio-gon%C3%A7alves-21aa91261/) |
|Gustavo Badim | Product Owner |[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/gubasssss) |[<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">](https://www.linkedin.com/in/gustavo-badim-8538b7285)
|  Márcio Gabriel  | Dev Team |[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/Porisso90) | [<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">](https://www.linkedin.com/in/m%C3%A1rcio-gabriel-426b0527b/)
|  Gustavo Henrique   | Dev Team | [<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/HenryBRG)| [<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">](https://www.linkedin.com/in/gustavo-henrique-braga-b92544252/)|
|Lucas Kendi | Dev Team|[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/Subinoonibus) | [<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">](https://www.linkedin.com/in/vin%C3%ADcius-henrique-souza-4085b1226/)


<a href="#topo">→ Voltar ao Topo </a>
>
