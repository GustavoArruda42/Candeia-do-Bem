const TZ = 'America/Sao_Paulo';

export const formatarData = (data) => {
  const d = new Date(data);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatarDataHora = (data) => {
  return new Date(data).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const domingoAtual = () => {
  const agora = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const diaSemana = agora.getDay();
  const domingo = new Date(agora);
  domingo.setDate(agora.getDate() - diaSemana);
  return domingo.toISOString().split('T')[0];
};

export const formatarDataInput = (data) => {
  return new Date(data).toISOString().split('T')[0];
};
