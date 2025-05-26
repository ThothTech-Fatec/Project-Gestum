import React, { useState, useEffect } from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/Participantes.css";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Autocomplete, Chip } from "@mui/material";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import UserAvatar from "../components/UserAvatar.tsx";

interface Participant {
  id_usuario: number;
  nome_usuario: string;
  email_usuario: string;
  tipo: 'responsavel' | 'colaborador';
}

interface UserSuggestion {
  id_usuario: number;
  nome_usuario: string;
  email_usuario: string;
}

interface Projeto {
  id_projeto: number;
  user_role?: string;
}

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

const Participantes = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isResponsavel, setIsResponsavel] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const location = useLocation();
  const projeto = location.state?.projeto as Projeto;
  const projectId = projeto?.id_projeto; 

  useEffect(() => {
    if (projectId) {
      fetchParticipants();
      setIsResponsavel(projeto.user_role === 'responsavel');
    }
  }, [projectId, projeto]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/project_participants', { 
        params: { projectId }
      });
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Failed to load participants');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const response = await api.get('/search_users', {
        params: { term }
      });
      setUserSuggestions(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUserSuggestions([]);
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (!window.confirm('Tem certeza que deseja remover este participante?')) return;
    
    try {
      await api.delete(`/remove_participant/${projectId}`, {
        data: { participantId }
      });
      fetchParticipants();
    } catch (error) {
      console.error('Error removing participant:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Failed to remove participant');
      } else {
        setError('Failed to remove participant');
      }
    }
  };
  
  const handleAddParticipant = async () => {
    try {
      if (!newParticipantEmail) {
        setError('Por favor, selecione um usuário válido');
        return;
      }

      await api.post(`/add_participant/${projectId}`, {
        email: newParticipantEmail,
        role: 'colaborador'
      });

      setOpenDialog(false);
      setNewParticipantEmail('');
      setSearchTerm('');
      setUserSuggestions([]);
      setError('');
      fetchParticipants();
    } catch (error) {
      console.error('Error adding participant:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Failed to add participant');
      } else {
        setError('Failed to add participant');
      }
    }
  };

  if (!projectId) {
    return <div className="container">
      <SuperiorMenu />
      <div className="participantes">
        <h1>Participantes</h1>
        <div className="error-message">Nenhum projeto selecionado</div>
      </div>
    </div>;
  }

  return (
    <div className="container">
      <SuperiorMenu />
      <div className="participantes">
        <h1>Participantes</h1>
        
        {isResponsavel && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Você é o responsável por este projeto e pode gerenciar participantes.
          </Alert>
        )}

        {error && <div className="error-message">{error}</div>}
        
        <div className="participants-grid">
          {isResponsavel && (
            <div className="participant-card add-card" onClick={() => setOpenDialog(true)}>
              <div className="add-icon">➕</div>
              <p>Adicionar Participantes</p>
            </div>
          )}

          {loading ? (
            <div>Carregando participantes...</div>
          ) : participants.length > 0 ? (
            participants.map((participant) => (
              <div key={participant.id_usuario} className="participant-card">
                <div className="avatar-container">
                  <UserAvatar email={participant.email_usuario} size={64} />
                </div>
                <strong>{participant.nome_usuario}</strong>
                <p>{participant.email_usuario}</p>
                <span className={`role-badge ${participant.tipo}`}>
                  {participant.tipo === 'responsavel' ? 'Responsável' : 'Colaborador'}
                </span>
                
                {isResponsavel && participant.tipo !== 'responsavel' && (
                  <button
                    className="remove-part"
                    onClick={() => handleRemoveParticipant(participant.id_usuario)}
                  >
                    <div className="add-icons"> 
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="red" viewBox="0 0 16 16">
                        <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0v-6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 0 1 0-2H5h6h2.5a1 1 0 0 1 1 1zm-3 1H4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/>
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div>Nenhum participante encontrado</div>
          )}
        </div>

        {isResponsavel && (
          <Dialog open={openDialog} onClose={() => {
            setOpenDialog(false);
            setSearchTerm('');
            setUserSuggestions([]);
          }}>
            <DialogTitle>Adicionar Participante</DialogTitle>
            <DialogContent sx={{ minWidth: '400px', pt: 3 }}>
              <Autocomplete
                freeSolo
                options={userSuggestions}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : 
                  `${option.nome_usuario} (${option.email_usuario})`
                }
                inputValue={searchTerm}
                onInputChange={(_, newValue) => {
                  setSearchTerm(newValue);
                  searchUsers(newValue);
                }}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== 'string') {
                    setNewParticipantEmail(newValue.email_usuario);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pesquisar por nome ou email"
                    fullWidth
                    margin="normal"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id_usuario}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ marginRight: 10 }}>
                        <UserAvatar email={option.email_usuario} size={32} />
                      </div>
                      <div>
                        <div>{option.nome_usuario}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{option.email_usuario}</div>
                      </div>
                    </div>
                  </li>
                )}
                noOptionsText="Nenhum usuário encontrado"
              />
              
              {newParticipantEmail && (
                <div style={{ marginTop: 16 }}>
                  <Chip 
                    label={`Usuário selecionado: ${newParticipantEmail}`}
                    onDelete={() => {
                      setNewParticipantEmail('');
                      setSearchTerm('');
                    }}
                  />
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenDialog(false);
                setSearchTerm('');
                setUserSuggestions([]);
              }}>Cancelar</Button>
              <Button 
                onClick={handleAddParticipant} 
                variant="contained" 
                color="primary"
                disabled={!newParticipantEmail}
              >
                Adicionar
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Participantes;