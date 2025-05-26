import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';


const InputMoeda = ({ value, onChange, label }: { 
    value: string | number | null;
  onChange: (value: number | null) => void; 
  label: string 
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Atualiza o valor exibido quando o value prop muda
  useEffect(() => {
    if (value === null || (typeof value === 'number' && isNaN(value))) {
      setDisplayValue('');
    } else {
      setDisplayValue(Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove todos os caracteres não numéricos
    const numericValue = rawValue.replace(/\D/g, '');
    
    // Converte para número dividindo por 100 para obter os centavos
    const numberValue = numericValue ? parseFloat(numericValue) / 100 : null;
    
    // Atualiza o estado do valor numérico
    onChange(numberValue);
    
    // Atualiza o display formatado
    if (numericValue === '' || numberValue === null) {
      setDisplayValue('');
    } else {
      setDisplayValue(numberValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
    }
  };

  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleChange}
      fullWidth
      margin="normal"
      InputProps={{
        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
      }}
      placeholder="0,00"
    />
  );
};

export default InputMoeda;