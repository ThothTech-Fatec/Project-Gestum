import axios from "axios";
import React, { useState, useEffect } from "react";

interface Props {
  projetoId: number;
  dataInicio?: string;
  dataFim?: string;
}

interface CalendarStyles {
  container: React.CSSProperties;
  header: React.CSSProperties;
  grid: React.CSSProperties;
  diaSemana: React.CSSProperties;
  dia: React.CSSProperties;
  diaVazio: React.CSSProperties;
}

const CalendarioProjeto: React.FC<Props> = ({ projetoId, dataInicio, dataFim }) => {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [datasProjeto, setDatasProjeto] = useState({
    inicio: null as Date | null,
    fim: null as Date | null
  });
  

  useEffect(() => {
    const parseDate = (dateString: string) => {
      const [day, month, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const fetchDatasProjeto = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/datasinicio_fim/${projetoId}`);
        const { data_inicio_proj, data_fim_proj } = response.data;

        setDatasProjeto({
          inicio: parseDate(data_inicio_proj),
          fim: parseDate(data_fim_proj)
        });
      } catch (error) {
        console.error("Erro ao buscar datas:", error);
      }
    };

    if (!dataInicio || !dataFim) {
      fetchDatasProjeto();
    } else {
      setDatasProjeto({
        inicio: parseDate(dataInicio),
        fim: parseDate(dataFim)
      });
    }
  }, [projetoId, dataInicio, dataFim]);

  const formatarMesAno = (ano: number, mes: number) => {
    return new Date(ano, mes)
      .toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(/^./, match => match.toUpperCase());
  };

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  const diasArray = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  const mudarMes = (direcao: number) => {
    const novoMes = mesAtual + direcao;
    if (novoMes < 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else if (novoMes > 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(novoMes);
    }
  };

  const isUmaSemanaAntes = (data: Date) => {
    if (!datasProjeto.fim) return false;
    const dataFinal = new Date(datasProjeto.fim);
    const umaSemanaAntes = new Date(dataFinal);
    umaSemanaAntes.setDate(dataFinal.getDate() - 7); // Subtrai 7 dias

    // Verifica se a data está entre uma semana antes e a data final
    return data >= umaSemanaAntes && data <= dataFinal;
  };
    const isDataInicial = (data: Date) => {
    return datasProjeto.inicio && data.toDateString() === datasProjeto.inicio.toDateString();
  };

  const isDataFinal = (data: Date) => {
    return datasProjeto.fim && data.toDateString() === datasProjeto.fim.toDateString();
  };




  const isDentroDoPeriodo = (data: Date) => {
    if (!datasProjeto.inicio || !datasProjeto.fim) return false;

    const inicio = new Date(datasProjeto.inicio);
    const fim = new Date(datasProjeto.fim);
    
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    
    return data >= inicio && data <= fim;
  };

  if (!datasProjeto.inicio || !datasProjeto.fim) {
    return <div>Carregando datas do projeto...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => mudarMes(-1)}>◀</button>
        <h2>{formatarMesAno(anoAtual, mesAtual)}</h2>
        <button onClick={() => mudarMes(1)}>▶</button>
      </div>
      <div style={styles.grid}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <div key={dia} style={styles.diaSemana}>{dia}</div>
        ))}
        {Array.from({ length: primeiroDiaSemana }).map((_, index) => (
          <div key={`empty-${index}`} style={styles.diaVazio}></div>
        ))}
        {diasArray.map((dia) => {
          const dataAtual = new Date(anoAtual, mesAtual, dia);
          const isHighlighted = isDentroDoPeriodo(dataAtual);
          const isInicio = isDataInicial(dataAtual);
          const isFim = isDataFinal(dataAtual);
          const isUmaSemanaAntesDia = isUmaSemanaAntes(dataAtual);


          return (
            <div
              key={dia}
              style={{
                ...styles.dia,
                backgroundColor: isInicio
                  ? "#4CAF50" // Verde para a data inicial
                  : isFim
                  ? "#F44336" // Vermelho para a data final
                  : isUmaSemanaAntesDia
                  ? "#FF9800" // Amarelo escuro para uma semana antes da data final
                  : isHighlighted
                  ? "#E0E0E0" // Cor neutra para as datas dentro do período
                  : "transparent", // Sem cor para os outros dias
                color: isInicio || isFim || isUmaSemanaAntesDia ? "white" : isHighlighted ? "black" : "black", // Textos claros para os destaques
                fontWeight: isInicio || isFim || isUmaSemanaAntesDia ? "bold" : isHighlighted ? "normal" : "normal" // Textos em negrito para destaques importantes
              }}
                title={isInicio ? "Data Inicial" : isFim ? "Data Final" : isUmaSemanaAntesDia ? "Uma Semana Antes" : ""}

            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: CalendarStyles = {
  container: {
    textAlign: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "350px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    padding: "10px",
    borderRadius: "5px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    justifyContent: "center"
  },
  diaSemana: {
    fontWeight: "bold",
    textAlign: "center",
    padding: "8px 0",
    fontSize: "14px"
  },
  dia: {
    padding: "10px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "5px",
    fontSize: "14px",
    cursor: "pointer",
    border: "1px solid #e0e0e0",
    transition: "all 0.2s ease"
  },
  diaVazio: {
    padding: "10px 0",
    visibility: "hidden" as const
  }
};

export default CalendarioProjeto;