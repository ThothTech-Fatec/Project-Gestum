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
        <h2>Minhas Atividades</h2>
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
            <Grid item xs={12}>
              <Typography>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</Typography>
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
            <Grid item xs={12}>
              <Typography>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</Typography>
            </Grid>
          </Grid>
        </div>
      </section>

      <section className="atividades-gerais">
        <h2>Atividades Gerais</h2>

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
            <Grid container spacing={2} direction="column">
        {/* Texto centralizado */}
        <Grid item>
          <Typography align="center" sx={{ width: '100%' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit...
          </Typography>
        </Grid>
        
        {/* Botão à direita */}
        <Grid item container justifyContent="flex-end">
          <button className="participar" style={{ marginRight: '2.35%' }}>Participar</button>
        </Grid>
        
      </Grid>
      </Grid>
        </div>
      </section>
    </div>
  );
};

export default Atividades;