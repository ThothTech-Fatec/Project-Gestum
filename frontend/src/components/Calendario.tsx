import React, { useState } from "react";

interface CalendarioProps {
  dataInicio: string;
  dataFim: string;
}

const Calendario: React.FC<CalendarioProps> = ({ dataInicio, dataFim }) => {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

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

  const isDentroDoPeriodo = (data: Date) => {
    return data >= inicio && data <= fim;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => mudarMes(-1)}>◀</button>
        <h2>{new Date(anoAtual, mesAtual).toLocaleString("pt-BR", { month: "long", year: "numeric" }).replace(/^./, (match) => match.toUpperCase())}</h2>
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

          return (
            <div
              key={dia}
              style={{
                ...styles.dia,
                backgroundColor: isHighlighted ? "green" : "transparent",
                color: isHighlighted ? "white" : "black",
              }}
            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center" as const,
    padding: "10px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 40px)",
    gap: "5px",
    justifyContent: "center",
  },
  diaSemana: {
    fontWeight: "bold",
    textAlign: "center" as const,
  },
  dia: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "5px",
    fontSize: "14px",
    cursor: "pointer",
    border: "1px solid #ddd",
  },
  diaVazio: {
    width: "40px",
    height: "40px",
  },
};

export default Calendario;
