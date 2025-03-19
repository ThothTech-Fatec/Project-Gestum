import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function ImageAvatars() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(
    localStorage.getItem('Logado') === 'true'
  );
  const [profilePic, setProfilePic] = React.useState(
    localStorage.getItem('ProfilePic') || ''
  );
  const [userName, setUserName] = React.useState(
    localStorage.getItem('UserName') || ''
  );
  const [UserEmail, setUserEmail] = React.useState(
    localStorage.getItem('UserEmail') || ''
  );
  const [UserPhone, setUserPhone] = React.useState(
    localStorage.getItem('UserPhone') || ''
  );

  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false); // Estado para o diálogo de confirmação
  const [tempProfilePic, setTempProfilePic] = React.useState(profilePic); // Estado temporário para a foto
  const [tempUserName, setTempUserName] = React.useState(userName); // Estado temporário para o nome
  const [tempUserEmail, setTempUserEmail] = React.useState(UserEmail); // Estado temporário para o email
  const [tempUserPhone, setTempUserPhone] = React.useState(UserPhone); // Estado temporário para o telefone
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    localStorage.setItem('Logado', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.setItem('Logado', 'false');
    setIsLoggedIn(false);
    setAnchorEl(null);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setTempProfilePic(profilePic);
    setTempUserName(userName);
    setTempUserEmail(UserEmail);
    setTempUserPhone(UserPhone);
    handleClose();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cleaned.length > 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    } else if (cleaned.length > 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 2) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      return cleaned;
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempProfilePic(result); // Atualiza o estado temporário
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempUserName(event.target.value); // Atualiza o estado temporário
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempUserEmail(event.target.value); // Atualiza o estado temporário
  };
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempUserPhone(formatPhoneNumber(event.target.value)); // Atualiza o estado temporário
  };

  const handleSaveChanges = () => {
    if (tempUserEmail === '' || tempUserName === '' || tempUserPhone === '') {
      return alert('Preencha todos os campos');
    }
    else {
    setConfirmOpen(true); // Abre o diálogo de confirmação
    }
  };

  const handleConfirmSave = () => {
    setProfilePic(tempProfilePic);
    setUserName(tempUserName);
    setUserEmail(tempUserEmail);
    setUserPhone(tempUserPhone);
    localStorage.setItem('ProfilePic', tempProfilePic);
    localStorage.setItem('UserName', tempUserName);
    localStorage.setItem('UserEmail', tempUserEmail);
    localStorage.setItem('UserPhone', tempUserPhone);
    setConfirmOpen(false); // Fecha o diálogo de confirmação
    handleCloseModal(); // Fecha o modal
    
  };

  const handleCancelSave = () => {
    setConfirmOpen(false); // Fecha o diálogo de confirmação sem salvar
  };


  return (
    <Stack direction="row" spacing={0}>
      {isLoggedIn ? (
        <>
          <Avatar 
            alt={userName} 
            src={profilePic} 
            onClick={handleClick} 
            style={{ cursor: 'pointer' }}
          />
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <MenuItem onClick={handleOpenModal}>Perfil</MenuItem>
            <MenuItem 
              onClick={handleLogout} 
              sx={{ '&:hover': { backgroundColor: '#ff4d4d', color: 'white' } }}
            >
              Sair da Conta
            </MenuItem>
          </Menu>

          <Modal
            open={modalOpen}
            onClose={handleCloseModal}
            aria-labelledby="profile-modal"
            aria-describedby="profile-modal-description"
          >
            <Box 
              sx={{
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                width: 300, 
                bgcolor: 'background.paper', 
                boxShadow: 24, 
                p: 4, 
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography id="profile-modal" variant="h6" component="h2">
                Perfil do Usuário
              </Typography>
              <Avatar 
                alt={tempUserName} 
                src={tempProfilePic} 
                sx={{ width: 100, height: 100, margin: '10px auto' }}
              />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ marginTop: 10 }}
              />
              <TextField
                value={tempUserName}
                onChange={handleNameChange}
                variant="outlined"
                margin="normal"
                fullWidth
                sx={{ mt: 2 }}
                label="Nome do Usuário"
              />
              <TextField
                value={tempUserEmail}
                onChange={handleEmailChange}
                variant="outlined"
                margin="normal"
                fullWidth
                sx={{ mt: 2 }}
                label="Email do Usuário"
              />
              <TextField
                value={tempUserPhone}
                onChange={handlePhoneChange}
                variant="outlined"
                margin="normal"
                fullWidth
                sx={{ mt: 2 }}
                label="Telefone do Usuário"
              />
              <Button 
                variant="contained" 
                sx={{ mt: 2, mr: 2 }} 
                onClick={handleSaveChanges}
              >
                Salvar
              </Button>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }} 
                onClick={handleCloseModal}
              >
                Fechar
              </Button>
            </Box>
          </Modal>

          {/* Diálogo de confirmação */}
          <Dialog
            open={confirmOpen}
            onClose={handleCancelSave}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            <DialogTitle id="confirm-dialog-title">
              Confirmar Alterações
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="confirm-dialog-description">
                Tem certeza de que deseja salvar as alterações no perfil?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelSave} color="primary">
                Cancelar
              </Button>
              <Button onClick={handleConfirmSave} color="primary" autoFocus>
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <IconButton
          onClick={handleLogin}
          sx={{ 
            backgroundColor: 'rgba(0, 123, 255, 0.2)', 
            color: '#007bff', 
            transition: '0.3s',
            '&:hover': { 
              backgroundColor: '#007bff', 
              color: 'white' 
            }
          }}
        >
          <AddIcon />
        </IconButton>
      )}
    </Stack>
  );
}