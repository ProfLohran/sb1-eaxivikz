export type LoginSuccess = {
  success: true;
  user: { 
    id: string; 
    name: string; 
    evaluationDeadline: string; 
    categoria: string 
  };
};

export type ErrorResponse = { 
  success: false; 
  error: string 
};

export type ApiResponse<T> = T | ErrorResponse;

export type Rubrica = {
  avaliacao: string;
  criterio: string;
  cincoPontos: string;
  quatroPontos: string;
  tresPontos: string;
  doisPontos: string;
  umPonto: string;
};

export type RubricasSuccess = {
  success: true;
  rubricas: Rubrica[];
};

export type InformacoesEvento = {
  id: string;
  nomeDoAvaliador: string;
  categoria: string;
  cliente: string;
  enderecoCliente: string;
  informacoesAdicionais: string;
  turmas: string;
  temaPerguntaRegras: string; // HTML/embed pronto para renderização
  dataLimiteAvaliacao: string;
  dataPitch: string;
  horarioInicio: string;
  horarioFim: string;
};

export type InformacoesSuccess = {
  success: true;
  informacoes: InformacoesEvento;
};

export type LoadDataSuccess = { 
  success: true; 
  data: Record<string, any>[] 
};

export type EvaluationSheet = {
  name: string;
  displayName: string;
  groups: AvaliacaoData[];
};
export type SaveNotasSuccess = {
  success: true;
  updatedRows: number;
};

export type User = {
  id: string;
  name: string;
  evaluationDeadline: string;
  categoria: string;
};

export type AvaliacaoData = Record<string, any>;