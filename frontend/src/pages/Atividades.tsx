import React from "react";
import "../css/Atividades.css";
import { useNavigate } from "react-router-dom";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import { Grid, Stack, Avatar, Typography} from "@mui/material";

const Atividades = () => {
  return (
    <div className="container">
      <main>
        <SuperiorMenu />
        <header>
          <h1>Thoth Tech</h1>
        </header>
      </main>

      <section className="minhas-atividades">
        <h2 className="h2_atividade">Minhas Atividades</h2>
        <button className="nova-atividade">Nova Atividade</button>
        

          <div className="atividade">
          <Grid container spacing={2} alignItems="center">
            {/* Atividade One - alinhado à esquerda */}
            <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Typography variant="h6">Atividade One - Embraer SJC</Typography>
            </Grid>
            
            {/* Responsáveis - alinhado à direita */}
            <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="responsaveis" style={{ display: 'flex', alignItems: 'center' }}>
                <Typography style={{ marginRight: 8 }}><strong>Responsáveis - </strong></Typography>
                <Stack direction="row" spacing={0.5}>
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  
                </Stack>
              </div>
              
            </Grid>
            
            {/* Texto descritivo - ocupa toda a largura */}
            <Grid item xs={12} style={{display:"flex",alignItems:"left", textAlign: "justify"}}>
              <Typography>is simply dummy text of the printing and typesetting industry. 
                Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a 
                galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in 
                the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.</Typography>
            </Grid>
          </Grid>
        </div>

        
        <div className="atividade">
          <Grid container spacing={2} alignItems="center">
            {/* Atividade One - alinhado à esquerda */}
            <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Typography variant="h6">Atividade Second - Embraer SJC</Typography>
            </Grid>
            
            {/* Responsáveis - alinhado à direita */}
            <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="responsaveis" style={{ display: 'flex', alignItems: 'center' }}>
                <Typography style={{ marginRight: 8 }}><strong>Responsáveis - </strong></Typography>
                <Stack direction="row" spacing={0.5}>
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  
                </Stack>
              </div>
            </Grid>
            
            {/* Texto descritivo - ocupa toda a largura */}
            <Grid item xs={12} style={{display:"flex",alignItems:"left", textAlign: "justify"}}>
              <Typography>is simply dummy text of the printing and typesetting industry. 
                Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a 
                galley of type and scrambled it to make a type specimen book. It has.</Typography>
            </Grid>
          </Grid>
        </div>
      </section>

      <section className="atividades-gerais">
        <h2 className="h2_atividade">Atividades Gerais</h2>

        <div className="atividade atividade-geral">
          <Grid container spacing={2} alignItems="center">
            {/* Atividade One - alinhado à esquerda */}
            <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Typography variant="h6">Atividade Three - Embraer SJC</Typography>
            </Grid>
            
            {/* Responsáveis - alinhado à direita */}
            <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="responsaveis" style={{ display: 'flex', alignItems: 'center' }}>
                <Typography style={{ marginRight: 8 }}><strong>Responsáveis - </strong></Typography>
                <Stack direction="row" spacing={0.5}>
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  <Avatar alt="Teste" src={undefined} style={{ cursor: 'pointer' }} />
                  
                </Stack>
              </div>
              
            </Grid>
            
            {/* Texto descritivo - ocupa toda a largura */}
            
        {/* Texto centralizado */}
        <Grid item xs={12} style={{display:"flex",alignItems:"left", textAlign: "justify"}}>
        <Typography>is simply dummy text of the printing and typesetting industry. 
                Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a 
                galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in 
                the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.</Typography>
        </Grid>
        
        {/* Botão à direita */}
        <Grid item container justifyContent="flex-end">
          <button className="participar" style={{ marginRight: '2.35%' }}>Participar</button>
        </Grid>
        
      </Grid>
        </div>
      </section>
    </div>
  );
};

export default Atividades;