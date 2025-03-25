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
import { signUp, Login} from '../services/auth.ts'; 

export default function ImageAvatars() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(
    localStorage.getItem('Logado') === 'true'
  );
  const [profilePic, setProfilePic] = React.useState<string | null>(null); // Armazena a URL da imagem

  const [userName, setUserName] = React.useState(
    localStorage.getItem('UserName') || ''
  );
  const [userEmail, setUserEmail] = React.useState(
    localStorage.getItem('UserEmail') || ''
  );
  const [userPassword, setUserPassword] = React.useState(''); // Estado para a senha

  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);

  // Estados temporários para o nome e a imagem
  const [tempUserName, setTempUserName] = React.useState(userName);
  const [tempProfilePic, setTempProfilePic] = React.useState<string | null>(profilePic);


  const open = Boolean(anchorEl);
  

  const [editModalOpen, setEditModalOpen] = React.useState(false);

// Função para abrir o modal de edição
const handleOpenEditModal = () => {
  setTempUserName(userName);
  setTempProfilePic(profilePic);
  setModalOpen(false); // Fecha o modal de visualização
  setEditModalOpen(true); // Abre o modal de edição
};

const handleCloseEditModal = () => {
  setEditModalOpen(false);
  setModalOpen(true); // Reabre o modal de visualização
};

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempUserName(event.target.value); // Atualiza o estado temporário
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserPassword(event.target.value);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isLoggedIn) {
      setAnchorEl(event.currentTarget);
    } else {
      setTempUserName('')
      setUserEmail('')
      setUserPassword('')
      setLoginModalOpen(true);
    }
  };

  const fetchProfileImage = async (userEmail: string) => {
    try {
      const response = await fetch(`http://localhost:5000/profileimage/${userEmail}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar imagem.');
      }

      const data = await response.json(); // Recebe o JSON com nome_usuario e avatar

      // Atualiza o nome do usuário
      setUserName(data.nome_usuario);

      // Converte a imagem base64 para uma URL
      const imageUrl = `data:image/jpeg;base64,${data.avatar}`;
      setProfilePic(imageUrl); // Atualiza o estado com a URL da imagem
    } catch (error) {
      console.error("Erro ao buscar imagem:", error);
    }
  };

  React.useEffect(() => {
    if (isLoggedIn && userEmail) {
      fetchProfileImage(userEmail);
    }
  }, [isLoggedIn, userEmail]);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = async () => {
    if (userEmail === '' || userPassword === '') {
      alert('Preencha todos os campos.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
      });
  
      const data = await response.json();
      
  
      // Verifica se a resposta contém um erro
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login.');
      }
  
      // Armazena os dados do usuário no localStorage
      localStorage.setItem('UserID', data.id_usuario)
      localStorage.setItem('UserName', data.nome_usuario);
      localStorage.setItem('UserEmail', data.email_usuario);
      localStorage.setItem('token', 'true')
      console.log(data.id_usuario)
      localStorage.setItem('Logado', 'true');
  
      // Atualiza o estado
      setUserName(data.nome_usuario);
      setUserEmail(data.email_usuario);
      setIsLoggedIn(true);
      setLoginModalOpen(false);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert(error.message || 'Email ou senha incorretos.');
    }
  };

  const handleSignUp = async () => {
    if (tempUserName === '' || userEmail === '' || userPassword === '') {
      alert('Preencha todos os campos.');
      return;
    }
  
    try {
      // Chama a função signUp para cadastrar o usuário no backend
      await signUp(tempUserName, userEmail, userPassword);
  
      // Exibe uma mensagem de sucesso
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
  
      // Redireciona para a tela de login
      setIsSignUp(false); // Mostra o formulário de login
      resetForm(); // Limpa os campos do formulário
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert('Erro ao cadastrar. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setUserName('');
    setTempUserName('')
    setUserEmail('');
    setUserPassword('');
    setProfilePic(null);
    localStorage.setItem('Logado', 'false');
    setIsLoggedIn(false);
    setAnchorEl(null);
  };

  const handleOpenModal = () => {
    // Inicializa os estados temporários com os valores atuais
    setTempProfilePic(profilePic);
    setModalOpen(true);
    handleClose();
  };

  const handleCloseModal = () => {
    // Descarta as alterações temporárias ao fechar o modal
    setModalOpen(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (tempProfilePic) {
        URL.revokeObjectURL(tempProfilePic); // Libera a memória da URL temporária anterior
      }
      const imageUrl = URL.createObjectURL(file); // Cria uma URL temporária
      setTempProfilePic(imageUrl); // Armazena a URL temporária
    }
  };

  const handleSaveChanges = () => {
    if (tempUserName === '') {
      alert('Preencha todos os campos');
    } else {
      setConfirmOpen(true);
    }
  };

  const handleConfirmSave = async () => {
    try {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput.files?.[0]; // Obtém o arquivo original

      // Cria um FormData para enviar os dados do usuário
      const formData = new FormData();
      console.log(tempUserName);
      formData.append('userName', tempUserName); // Adiciona o nome temporário
      formData.append('userEmail', userEmail); // Adiciona o email do usuário (para identificação)

      // Adiciona a imagem ao FormData apenas se um arquivo foi selecionado
      if (file) {
        formData.append('profilePic', file); // Adiciona o arquivo de imagem
      }

      // Envia a requisição para o backend
      const response = await fetch('http://localhost:5000/alterprofile', {
        method: 'POST',
        body: formData, // Envia o FormData
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar perfil.');
      }

      const data = await response.json();
      console.log(data.message); // Exibe a mensagem de sucesso

      // Atualiza os estados principais com os valores temporários
      setUserName(tempUserName);
      setProfilePic(tempProfilePic);
      setTempUserName('');

      // Busca a nova imagem do backend após salvar (se uma nova imagem foi enviada)
      if (file) {
        await fetchProfileImage(userEmail);
      }

      setConfirmOpen(false);
      setEditModalOpen(false);
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert('Erro ao salvar perfil. Tente novamente.');
    }
  };

  const handleCancelSave = () => {
    setConfirmOpen(false);
  };

  const resetForm = () => {
    setUserName('');
    setTempUserName('');
    setUserEmail('');
    setUserPassword('');
  };

  return (
    <Stack direction="row" spacing={0}>
      {isLoggedIn ? (
        <>
          <Avatar
            alt={userName}
            src={profilePic || undefined} 
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
        </>
      ) : (
        <>
          <Avatar
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            <AddIcon /> {/* Ícone de adicionar para indicar login/cadastro */}
          </Avatar>
        </>
      )}

      {/* Modal de Login/Cadastro */}
      <Modal
        open={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          resetForm();
          setIsSignUp(false);
        }}
        aria-labelledby="login-modal"
        aria-describedby="login-modal-description"
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
            textAlign: 'center',
          }}
        >
          <Typography id="login-modal" variant="h6" component="h2">
            {isSignUp ? 'Cadastre-se' : 'Faça Login'}
          </Typography>
          {isSignUp && (
            <TextField
              value={tempUserName}
              onChange={handleNameChange}
              variant="outlined"
              margin="normal"
              fullWidth
              label="Nome do Usuário"
            />
          )}
          <TextField
            value={userEmail}
            onChange={handleEmailChange}
            variant="outlined"
            margin="normal"
            fullWidth
            label="Email"
          />
          <TextField
            value={userPassword}
            onChange={handlePasswordChange}
            variant="outlined"
            margin="normal"
            fullWidth
            label="Senha"
            type="password"
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={isSignUp ? handleSignUp : handleLogin}
          >
            {isSignUp ? 'Cadastrar' : 'Entrar'}
          </Button>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
          </Button>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => setLoginModalOpen(false)}
          >
            Fechar
          </Button>
        </Box>
      </Modal>

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
            textAlign: 'center',
          }}
        >
          <Typography id="profile-modal" variant="h6" component="h2">
            Meu Perfil
          </Typography>
          <Avatar
            alt={userName}
            src={profilePic || undefined}
            sx={{ width: 100, height: 100, margin: '10px auto' }}
          />
          <TextField
            value={userName}
            variant="outlined"
            margin="normal"
            fullWidth
            sx={{ mt: 2 }}
            label="Nome do Usuário"
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            value={userEmail}
            variant="outlined"
            margin="normal"
            fullWidth
            sx={{ mt: 2 }}
            label="Email do Usuário"
            InputProps={{
              readOnly: true,
            }}
          />
          <Button
            variant="contained"
            sx={{ mt: 2, mr: 2 }}
            onClick={handleOpenEditModal}
          >
            Editar Perfil
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

      {/* Modal de Edição do Perfil */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        aria-labelledby="edit-profile-modal"
        aria-describedby="edit-profile-modal-description"
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
            textAlign: 'center',
          }}
        >
          <Typography id="edit-profile-modal" variant="h6" component="h2">
            Editar Perfil
          </Typography>
          <Avatar
            alt={tempUserName}
            src={tempProfilePic || undefined}
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
            onClick={() => setEditModalOpen(false)}
          >
            Cancelar
          </Button>
        </Box>
      </Modal>

      {/* Diálogo de Confirmação */}
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
    </Stack>
  );
}