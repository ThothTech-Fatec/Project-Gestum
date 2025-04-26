import React, { useState, useEffect } from "react";
import "../css/Atividades.css";
import { useLocation } from "react-router-dom";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import { 
  Grid, 
  Stack, 
  Typography, 
  Modal, 
  TextField, 
  Button, 
  Box, 
  Autocomplete,
  Chip,
  Tooltip,
  Alert
} from "@mui/material";
import axios from "axios";
import UserAvatar from "../components/UserAvatar.tsx";

interface Atividade {
  id_atividade: number;
  id_projeto: number;
  nome_atividade: string;
  descricao_atividade: string;
  storypoint_atividade: number | null;
  responsaveis?: string;
}

interface Participante {
  email: string;
  nome: string;
}

interface Projeto {
  id_projeto: number;
  nome_projeto: string;
  descricao_projeto: string;
  responsavel: string;
  data_inicio_proj: string;
  data_fim_proj: string;
  data_inicio_formatada?: string;
  data_fim_formatada?: string;
  progresso_projeto?: number;
  user_role?: string;
  nome_area: string; 
  area_atuacao_id?: number;
}

const Atividades = () => {
  const [open, setOpen] = useState(false);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantesProjeto, setParticipantesProjeto] = useState<Participante[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isResponsavel, setIsResponsavel] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [storypoint, setStorypoint] = useState<number | ''>('');
  const [selectedParticipants, setSelectedParticipants] = useState<Participante[]>([]);

  const location = useLocation();
  const projeto = location.state?.projeto as Projeto;
  const projectId = projeto?.id_projeto;

  useEffect(() => {
    if (projectId) {
      fetchAtividades();
      fetchParticipantesProjeto();
      setIsResponsavel(projeto.user_role === 'responsavel');
    }
  }, [projectId, projeto]);

  const fetchAtividades = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/atividades`, {
        params: { projectId }
      });
      setAtividades(response.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      setError('Falha ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipantesProjeto = async () => {
    try {
      setLoadingParticipants(true);
      const response = await axios.get(`http://localhost:5000/projetos/${projectId}/participantes`);
      
      const participantes = response.data.data.map((email: string) => ({
        email,
        nome: email.split('@')[0]
      }));
      
      setParticipantesProjeto(participantes);
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCriarAtividade = async () => {
    try {
      if (!nome || !descricao || !projectId) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      const participantesEmails = selectedParticipants.map(p => p.email);

      const response = await axios.post("http://localhost:5000/atividades", {
        id_projeto: projectId,
        nome_atividade: nome,
        descricao_atividade: descricao,
        storypoint_atividade: storypoint || null,
        participantes: participantesEmails
      });

      if (response.data.success) {
        alert('Atividade criada com sucesso!');
        setNome('');
        setDescricao('');
        setStorypoint('');
        setSelectedParticipants([]);
        setOpen(false);
        fetchAtividades();
      } else {
        alert(`Erro: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar atividade:", error);
      if (axios.isAxiosError(error)) {
        alert(`Erro: ${error.response?.data?.error || error.message}`);
      } else {
        alert('Erro desconhecido ao criar atividade');
      }
    }
  };

  const handleDeletarAtividade = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar esta atividade?')) return;
    
    try {
      const response = await axios.delete(`http://localhost:5000/atividades/${id}`);
      if (response.data.success) {
        alert('Atividade deletada com sucesso!');
        fetchAtividades();
      }
    } catch (error) {
      console.error("Erro ao deletar atividade:", error);
      alert('Erro ao deletar atividade');
    }
  };

  if (!projectId) {
    return <div className="container">
      <SuperiorMenu />
      <div className="participantes">
        <h1>Atividades</h1>
        <div className="error-message">Nenhum projeto selecionado</div>
      </div>
    </div>;
  }

  return (
    <div className="container">
      <SuperiorMenu />
      <main>
        <header style={{ marginTop: '55px' }}>
          {isResponsavel && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Você é o responsável por este projeto e pode gerenciar atividades.
            </Alert>
          )}
        </header>
      </main>

      <section className="minhas-atividades">
      
        <h2 className="h2_atividade">Minhas Atividades</h2>
      
        {isResponsavel && (
          <button className="nova-atividade" onClick={() => setOpen(true)}>
            Nova Atividade
          </button>
        )}

        {loading ? (
          <div>Carregando atividades...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : atividades.length > 0 ? (
          atividades.map((atividade) => (
            <div key={atividade.id_atividade} className="atividade">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Typography variant="h6">{atividade.nome_atividade}</Typography>
                </Grid>
                <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div className="responsaveis" style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography style={{ marginRight: 8 }}><strong>Responsáveis - </strong></Typography>
                    <Stack direction="row" spacing={0.5}>
                      {atividade.responsaveis?.split(',').map((email, index) => (
                        <Tooltip key={index} title={email}>
                          <UserAvatar email={email} />
                        </Tooltip>
                      ))}
                    </Stack>
                  </div>
                </Grid>
                <Grid item xs={12} style={{ display: "flex", textAlign: "justify" }}>
                  <Typography>{atividade.descricao_atividade}</Typography>
                </Grid>
                {atividade.storypoint_atividade && (
                  <Grid item xs={12}>
                    <Chip 
                      label={`Story Points: ${atividade.storypoint_atividade}`}
                      color="primary"
                      size="small"
                    />
                  </Grid>
                )}
                {isResponsavel && (
                  <Grid item container justifyContent="flex-end">
                    <Button 
                      variant="contained" 
                      color="error"
                      onClick={() => handleDeletarAtividade(atividade.id_atividade)}
                      style={{ marginRight: '2.35%' }}
                    >
                      Deletar
                    </Button>
                  </Grid>
                )}
              </Grid>
            </div>
          ))
        ) : (
          <div>Nenhuma atividade encontrada</div>
        )}
      </section>

      {/* Modal para nova atividade - só aparece para responsáveis */}
      {isResponsavel && (
        <Modal open={open} onClose={() => setOpen(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}>
            <h2>Nova Atividade</h2>
            <TextField
              fullWidth
              label="Nome da Atividade *"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descrição *"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              multiline
              rows={3}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Story Points"
              type="number"
              value={storypoint}
              onChange={(e) => setStorypoint(e.target.value ? parseInt(e.target.value) : '')}
              margin="normal"
              inputProps={{ min: 0 }}
            />
            <Autocomplete
              multiple
              options={participantesProjeto}
              getOptionLabel={(option) => option.email}
              value={selectedParticipants}
              onChange={(_, newValue) => {
                setSelectedParticipants(newValue);
              }}
              loading={loadingParticipants}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Selecione os participantes"
                  placeholder="Digite para buscar"
                  margin="normal"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UserAvatar email={option.email} size={24} />
                    <Typography sx={{ ml: 1 }}>{option.email}</Typography>
                  </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.email}
                    label={option.email}
                    avatar={<UserAvatar email={option.email} size={24} />}
                    size="small"
                  />
                ))
              }
            />
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={() => setOpen(false)} variant="outlined">Cancelar</Button>
              <Button 
                onClick={handleCriarAtividade} 
                variant="contained"
                disabled={!nome || !descricao}
              >
                Criar
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
    </div>
  );
};

export default Atividades;