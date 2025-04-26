import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

interface Instituicao {
  id_empresa: number;
  nome_empresa: string;
  cnpj: string;
}

interface CadastroInstituicaoProps {
  open: boolean;
  onClose: () => void;
  onSave: (instituicao: Instituicao) => Promise<void>;
}

const CadastroInstituicao = ({ open, onClose, onSave }: CadastroInstituicaoProps) => {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setNome('');
      setCnpj('');
      setError('');
    }
  }, [open]);

  const validarCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.length === 14;
  };

  const handleSubmit = async () => {
    if (!nome || !cnpj) {
      setError('Preencha todos os campos');
      return;
    }

    if (!validarCNPJ(cnpj)) {
      setError('CNPJ deve conter 14 dígitos');
      return;
    }

    try {
      const response = await api.post<Instituicao>('/instituicoes', {
        nome_empresa: nome,
        cnpj: cnpj.replace(/\D/g, '')
      });

      // Garante que a resposta contém id_empresa
      if (!response.data.id_empresa) {
        throw new Error('ID da instituição não retornado pelo servidor');
      }

      await onSave(response.data);
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Erro ao cadastrar instituição. Verifique os dados e tente novamente.';
      setError(errorMessage);
      console.error('Erro ao cadastrar instituição:', err);
    }
  };

  const formatCNPJ = (value: string) => {
    const nums = value.replace(/\D/g, '');
    return nums
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cadastrar Nova Instituição</DialogTitle>
      <DialogContent>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <TextField
          autoFocus
          margin="dense"
          label="Nome da Instituição"
          type="text"
          fullWidth
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="CNPJ"
          type="text"
          fullWidth
          value={formatCNPJ(cnpj)}
          onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ''))}
          inputProps={{ maxLength: 18 }}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CadastroInstituicao;