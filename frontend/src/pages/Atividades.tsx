import React, { useState, useEffect } from "react";
import "../css/Atividades.css";
import { useLocation } from "react-router-dom";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import EditIcon from '@mui/icons-material/Edit';
import { 
  Stack, 
  Typography, 
  Modal, 
  TextField, 
  Button, 
  Box, 
  Autocomplete,
  Chip,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Checkbox,
  IconButton,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Divider
} from "@mui/material";
import axios from "axios";
import UserAvatar from "../components/UserAvatar.tsx";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

interface Atividade {
  id_atividade: number;
  id_projeto: number;
  nome_atividade: string;
  descricao_atividade: string;
  storypoint_atividade?: number | null;
  responsaveis?: string;
  realizada: boolean;
  data_criacao?: string; 
  data_conclusao?: string;
  isCurrentUserResponsavel?: boolean;
}

interface Participante {
  email: string;
  nome: string;
  id_usuario: number;
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
  const [isResponsavelProjeto, setIsResponsavelProjeto] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [storypoint, setStorypoint] = useState<number | ''>('');
  const [selectedParticipants, setSelectedParticipants] = useState<Participante[]>([]);

  const location = useLocation();
  const projeto = location.state?.projeto as Projeto;
  const projectId = projeto?.id_projeto;

  useEffect(() => {
    const userEmail = localStorage.getItem('UserEmail') || '';
    const userId = parseInt(localStorage.getItem('UserID') || '');
    
    setCurrentUserEmail(userEmail);
    setCurrentUserId(userId);

    if (projectId) {
      fetchAtividades();
      fetchParticipantesProjeto();
      setIsResponsavelProjeto(projeto.user_role === 'responsavel');
    }
  }, [projectId, projeto]);

  const fetchAtividades = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/atividades`, {
        params: { projectId }
      });
      
      const userEmail = localStorage.getItem('UserEmail') || '';
      
      const atividadesAtualizadas = response.data.data.map((atividade: Atividade) => {
        const responsaveis = atividade.responsaveis?.split(',') || [];
        const isResponsavel = responsaveis.includes(userEmail);
        const storypoint = atividade.storypoint_atividade === 0 ? null : atividade.storypoint_atividade;
        
        return { 
          ...atividade, 
          storypoint_atividade: storypoint,
          isCurrentUserResponsavel: isResponsavel,
          data_criacao: atividade.data_criacao || new Date().toISOString()
        };
      });
      
      setAtividades(atividadesAtualizadas || []);
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
      
      const participantes = response.data.data.map((user: any) => ({
        id_usuario: user.id_usuario,
        email: user.email_usuario,
        nome: user.nome_usuario || user.email_usuario.split('@')[0]
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
        setSnackbarMessage('Preencha todos os campos obrigatórios');
        return;
      }

      const participantesEmails = selectedParticipants.map(p => p.email);
      const storyPointValue = storypoint === '' ? null : Number(storypoint);

      const response = await axios.post("http://localhost:5000/atividades", {
        id_projeto: projectId,
        nome_atividade: nome,
        descricao_atividade: descricao,
        storypoint_atividade: storyPointValue,
        participantes: participantesEmails,
        isResponsavel: isResponsavelProjeto
      });

      if (response.data.success) {
        setSnackbarMessage('Atividade criada com sucesso!');
        setNome('');
        setDescricao('');
        setStorypoint('');
        setSelectedParticipants([]);
        setOpen(false);
        fetchAtividades();
      } else {
        setSnackbarMessage(`Erro: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar atividade:", error);
      if (axios.isAxiosError(error)) {
        setSnackbarMessage(`Erro: ${error.response?.data?.error || error.message}`);
      } else {
        setSnackbarMessage('Erro desconhecido ao criar atividade');
      }
    }
  };

const handleOpenEdit = (atividade: Atividade) => {
  setCurrentEditId(atividade.id_atividade); // Armazena o ID
  setNome(atividade.nome_atividade);
  setDescricao(atividade.descricao_atividade);
  setStorypoint(atividade.storypoint_atividade || '');
  
  // Preencher responsáveis
  if (atividade.responsaveis) {
    const responsaveis = participantesProjeto.filter(participante => 
      atividade.responsaveis?.split(',').includes(participante.email)
    );
    setSelectedParticipants(responsaveis);
  }
  
  setOpenEdit(true);
};

const handleEditarAtividade = async () => {
  try {
    setIsLoadingAction(true);
    
    if (!currentEditId) {
      setSnackbarMessage('ID da atividade não encontrado');
      return;
    }

    if (!nome || !descricao) {
      setSnackbarMessage('Preencha todos os campos obrigatórios');
      return;
    }

    const participantesEmails = selectedParticipants.map(p => p.email);
    const storyPointValue = storypoint === '' ? null : Number(storypoint);

    const response = await axios.put(`http://localhost:5000/atividades/${currentEditId}`, {
      nome_atividade: nome,
      descricao_atividade: descricao,
      storypoint_atividade: storyPointValue,
      participantes: participantesEmails,
      isResponsavel: isResponsavelProjeto
    });

    if (response.data.success) {
      setSnackbarMessage('Atividade atualizada com sucesso!');
      setOpenEdit(false);
      fetchAtividades(); // Recarrega a lista
    } else {
      setSnackbarMessage(response.data.error || 'Erro ao atualizar');
    }
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    if (axios.isAxiosError(error)) {
      setSnackbarMessage(error.response?.data?.error || error.message);
    } else {
      setSnackbarMessage('Erro ao atualizar atividade');
    }
  } finally {
    setIsLoadingAction(false);
  }
};

  const handleDeletarAtividade = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar esta atividade?')) return;
    
    try {
      const response = await axios.delete(`http://localhost:5000/atividades/${id}`, {
        data: { isResponsavel: isResponsavelProjeto }
      });
      if (response.data.success) {
        setSnackbarMessage('Atividade deletada com sucesso!');
        fetchAtividades();
      }
    } catch (error) {
      console.error("Erro ao deletar atividade:", error);
      setSnackbarMessage('Erro ao deletar atividade. Tente novamente.');
    }
  };

  

  const handleMarcarRealizada = async (id: number, realizada: boolean) => {
    setIsLoadingAction(true);
    try {
      const atividade = atividades.find(a => a.id_atividade === id);
      if (!atividade?.isCurrentUserResponsavel) {
        setSnackbarMessage('Apenas responsáveis podem marcar atividades como concluídas');
        return;
      }
  
      setAtividades(prev => prev.map(a => 
        a.id_atividade === id ? { 
          ...a, 
          realizada,
          data_conclusao: realizada ? new Date().toISOString() : undefined
        } : a
      ));
  
      const response = await axios.put(`http://localhost:5000/${id}/realizada`, {
        emailUsuario: currentUserEmail,
        realizada
      });
  
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao atualizar atividade');
      }
  
      setSnackbarMessage(`Atividade ${realizada ? 'concluída' : 'reaberta'} com sucesso!`);
      if (realizada) {
        setTimeout(() => setTabValue(2), 1000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setAtividades(prev => prev.map(a => 
        a.id_atividade === id ? { 
          ...a, 
          realizada: !realizada,
          data_conclusao: realizada ? undefined : a.data_conclusao
        } : a
      ));
      setSnackbarMessage(error instanceof Error ? error.message : 'Erro ao atualizar atividade');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleToggleResponsavel = async (idAtividade: number, isResponsavel: boolean) => {
    try {
      setIsLoadingAction(true);
      const userId = currentUserId;
      
      if (!userId) {
        setSnackbarMessage('Usuário não identificado');
        return;
      }
  
      const response = await axios.put(`http://localhost:5000/${idAtividade}/responsavel`, {
        userId,
        isResponsavel
      });
      
      if (response.data.success) {
        setAtividades(prev => prev.map(atividade => {
          if (atividade.id_atividade === idAtividade) {
            const responsaveis = atividade.responsaveis?.split(',').filter(Boolean) || [];
            let newResponsaveis = [...responsaveis];
            
            if (isResponsavel && !responsaveis.includes(currentUserEmail)) {
              newResponsaveis.push(currentUserEmail);
            } else if (!isResponsavel) {
              newResponsaveis = newResponsaveis.filter(email => email !== currentUserEmail);
            }
            
            return {
              ...atividade,
              responsaveis: newResponsaveis.join(','),
              isCurrentUserResponsavel: isResponsavel
            };
          }
          return atividade;
        }));
        
        setSnackbarMessage(`Você foi ${isResponsavel ? 'adicionado como' : 'removido dos'} responsáveis`);
      }
    } catch (error) {
      console.error("Erro:", error);
      setSnackbarMessage('Erro ao atualizar responsável');
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Filtrar atividades
  const minhasAtividades = atividades.filter(atividade => 
    atividade.isCurrentUserResponsavel && !atividade.realizada
  );
  
  const atividadesConcluidas = atividades.filter(atividade => 
    atividade.realizada
  );
  
  const todasAtividades = atividades.filter(atividade => 
    !atividade.realizada
  );

  const renderAtividadeCard = (atividade: Atividade, showActions: boolean = false) => (
    <Card 
      key={atividade.id_atividade}
      sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: atividade.realizada ? '4px solid #4caf50' : '4px solid #2196f3',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
    >
      <CardContent>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2
        }}>
          {showActions ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
              <Checkbox
                checked={atividade.realizada}
                onChange={(e) => handleMarcarRealizada(atividade.id_atividade, e.target.checked)}
                color="primary"
                disabled={!atividade.isCurrentUserResponsavel || isLoadingAction}
                sx={{ mr: 1 }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  textDecoration: atividade.realizada ? 'line-through' : 'none',
                  color: atividade.realizada ? 'text.secondary' : 'text.primary'
                }}
              >
                {atividade.nome_atividade}
              </Typography>
            </Box>
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 0 } }}>
              {atividade.nome_atividade}
            </Typography>
          )}
  
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}>
            {/* Mostra o status da atividade */}
            {atividade.realizada ? (
              <>
                {atividade.storypoint_atividade && atividade.storypoint_atividade > 0 && (
                  <Chip
                    label={`${atividade.storypoint_atividade} SP`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                )}
                <Chip
                  label="Concluída"
                  color="success"
                  size="small"
                />
              </>
            ) : (
              <>
                {atividade.storypoint_atividade && atividade.storypoint_atividade > 0 && (
                  <Chip
                    label={`${atividade.storypoint_atividade} SP`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                )}
                <Chip
                  label="Em andamento"
                  color="warning"
                  size="small"
                />
              </>
            )}
          </Box>
        </Box>
  
        <Typography variant="body1" sx={{ 
          color: 'text.secondary', 
          lineHeight: 1.6, 
          mb: 2,
          whiteSpace: 'pre-line'
        }}>
          {atividade.descricao_atividade}
        </Typography>
  
        <Divider sx={{ my: 2 }} />
  
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Responsáveis:
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {atividade.responsaveis?.split(',').filter(Boolean).map((email, index) => (
                <Tooltip key={index} title={email}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UserAvatar email={email} />
                  </Box>
                </Tooltip>
              ))}
              <Tooltip title={atividade.isCurrentUserResponsavel ? "Remover como responsável" : "Tornar responsável"}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleResponsavel(atividade.id_atividade, !atividade.isCurrentUserResponsavel)}
                  disabled={isLoadingAction}
                >
                  {atividade.isCurrentUserResponsavel ?
                    <PersonRemoveIcon color="error" /> :
                    <PersonAddIcon color="primary" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
  
          {/* Data de status */}
          {atividade.realizada && atividade.data_conclusao ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Concluída em: {new Date(atividade.data_conclusao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          ) : null}
        </Box>
      </CardContent>
  
      {isResponsavelProjeto && (
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDeletarAtividade(atividade.id_atividade)}
            size="small"
            disabled={isLoadingAction}
          >
            Deletar
          </Button>
          <IconButton 
  onClick={() => handleOpenEdit(atividade)} 
  color="primary"
  aria-label="editar"
>
  <EditIcon />
</IconButton>

        </CardActions>
      )}
    </Card>
  );




  if (!projectId) {
    return (
      <div className="container">
        <SuperiorMenu />
        <div className="participantes">
          <h1>Atividades</h1>
          <div className="error-message">Nenhum projeto selecionado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <SuperiorMenu />
      <main>
        <header style={{ marginTop: '55px' }}>
          {isResponsavelProjeto && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Você é o responsável por este projeto e pode gerenciar atividades.
            </Alert>
          )}
        </header>
      </main>

      <section className="atividades-container">
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          sx={{ mb: 3 }}
          variant="fullWidth"
        >
          <Tab label="Minhas Atividades" />
          <Tab label="Todas as Atividades" />
          <Tab label="Atividades Concluídas" />
        </Tabs>

        {isResponsavelProjeto && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', sm: 'flex-end' },
            mb: 3,
            px: 2
          }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setOpen(true)}
              sx={{ 
                fontSize: '1rem',
                padding: '10px 20px',
                borderRadius: '8px',
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Nova Atividade
            </Button>
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Carregando atividades...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {tabValue === 0 && (
              <div className="atividades-section">
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Minhas Atividades
                </Typography>
                {minhasAtividades.length > 0 ? (
                  minhasAtividades.map(atividade => renderAtividadeCard(atividade, true))
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1
                  }}>
                    <Typography variant="body1" color="textSecondary">
                      Nenhuma atividade atribuída a você
                    </Typography>
                  </Box>
                )}
              </div>
            )}

            {tabValue === 1 && (
              <div className="atividades-section">
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Todas as Atividades
                </Typography>
                {todasAtividades.length > 0 ? (
                  todasAtividades.map(atividade => renderAtividadeCard(atividade))
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1
                  }}>
                    <Typography variant="body1" color="textSecondary">
                      Nenhuma atividade pendente
                    </Typography>
                  </Box>
                )}
              </div>
            )}

            {tabValue === 2 && (
              <div className="atividades-section">
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Atividades Concluídas
                </Typography>
                {atividadesConcluidas.length > 0 ? (
                  atividadesConcluidas.map(atividade => renderAtividadeCard(atividade))
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1
                  }}>
                    <Typography variant="body1" color="textSecondary">
                      Nenhuma atividade concluída
                    </Typography>
                  </Box>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {isResponsavelProjeto && (
        <Modal open={open} onClose={() => setOpen(false)}>
          <Box 
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 600 },
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              p: 4,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Nova Atividade
            </Typography>
            <TextField
              fullWidth
              label="Nome da Atividade "
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descrição "
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
              getOptionLabel={(option) => `${option.nome} (${option.email})`}
              value={selectedParticipants}
              onChange={(_, newValue) => {
                setSelectedParticipants(newValue);
              }}
              loading={loadingParticipants}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Selecione os responsáveis"
                  placeholder="Digite para buscar"
                  margin="normal"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UserAvatar email={option.email} size={24} />
                    <Box sx={{ ml: 1 }}>
                      <Typography>{option.nome}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id_usuario}
                    label={`${option.nome} (${option.email})`}
                    avatar={<UserAvatar email={option.email} size={24} />}
                    size="small"
                  />
                ))
              }
            />
            <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
              <Button 
                onClick={() => setOpen(false)} 
                variant="outlined"
                sx={{ borderRadius: 1 }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCriarAtividade} 
                variant="contained"
                disabled={!nome || !descricao || isLoadingAction}
                sx={{ borderRadius: 1 }}
              >
                Criar Atividade
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
      {isResponsavelProjeto && (
  <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 600 },
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 4,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Editar Atividade
      </Typography>
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
        getOptionLabel={(option) => `${option.nome} (${option.email})`}
        value={selectedParticipants}
        onChange={(_, newValue) => {
          setSelectedParticipants(newValue);
        }}
        loading={loadingParticipants}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Responsáveis"
            placeholder="Digite para buscar"
            margin="normal"
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <UserAvatar email={option.email} size={24} />
              <Box sx={{ ml: 1 }}>
                <Typography>{option.nome}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {option.email}
                </Typography>
              </Box>
            </Box>
          </li>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id_usuario}
              label={`${option.nome} (${option.email})`}
              avatar={<UserAvatar email={option.email} size={24} />}
              size="small"
            />
          ))
        }
      />
      <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
        <Button 
          onClick={() => setOpenEdit(false)} 
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          Cancelar
        </Button>
              <Button 
        onClick={handleEditarAtividade} 
        variant="contained"
        disabled={!nome || !descricao || isLoadingAction}
      >
                {isLoadingAction ? 'Salvando...' : 'Salvar Alterações'}

      </Button>
      </Box>
    </Box>
  </Modal>
)}


      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
      >
        <Alert 
          onClose={() => setSnackbarMessage('')} 
          severity={snackbarMessage.includes('Erro') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Atividades;