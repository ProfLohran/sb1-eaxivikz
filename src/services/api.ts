import type { 
  ApiResponse, 
  LoginSuccess, 
  RubricasSuccess, 
  InformacoesSuccess, 
  LoadDataSuccess, 
  SaveNotasSuccess,
  EvaluationSheet
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error('VITE_API_BASE_URL não está configurada');
}

// Abas de avaliação disponíveis
const EVALUATION_SHEETS = [
  { name: 'DT', displayName: 'Design Thinking' },
  { name: 'PITCH', displayName: 'Pitch' },
  { name: 'PROTÓTIPO', displayName: 'Protótipo' },
  { name: 'PROTÓTIPO_FISICO', displayName: 'Protótipo Físico' },
  { name: 'MARATONA', displayName: 'Maratona' }, // Manter compatibilidade
];
class ApiService {
  private async makeRequest<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const body = new URLSearchParams(params);
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Log para debug
      if (import.meta.env.DEV) {
        console.log('API Response:', data);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
      };
    }
  }

  async login(login: string, senha: string): Promise<ApiResponse<LoginSuccess>> {
    return this.makeRequest<LoginSuccess>({
      action: 'login',
      login,
      senha,
    });
  }

  async getInformacoes(avaliadorID: string): Promise<ApiResponse<InformacoesSuccess>> {
    return this.makeRequest<InformacoesSuccess>({
      action: 'getInformacoes',
      avaliadorID,
    });
  }

  async getRubricas(tipoHacka: string): Promise<ApiResponse<RubricasSuccess>> {
    return this.makeRequest<RubricasSuccess>({
      action: 'getRubricas',
      tipoHacka,
    });
  }

  async loadData(sheet: string, evaluatorId: string): Promise<ApiResponse<LoadDataSuccess>> {
    return this.makeRequest<LoadDataSuccess>({
      action: 'loadData',
      sheet,
      evaluatorId,
    });
  }

  async loadAllEvaluationSheets(evaluatorId: string): Promise<EvaluationSheet[]> {
    const sheets: EvaluationSheet[] = [];
    
    for (const sheetConfig of EVALUATION_SHEETS) {
      try {
        const response = await this.loadData(sheetConfig.name, evaluatorId);
        if (response.success && response.data.length > 0) {
          sheets.push({
            name: sheetConfig.name,
            displayName: sheetConfig.displayName,
            groups: response.data,
          });
        }
      } catch (error) {
        console.warn(`Erro ao carregar aba ${sheetConfig.name}:`, error);
      }
    }
    
    return sheets;
  }
  async saveNotas(
    sheet: string, 
    evaluatorId: string, 
    grupo: string, 
    notas: Record<string, string>
  ): Promise<ApiResponse<SaveNotasSuccess>> {
    const params = {
      action: 'saveNotas',
      sheet,
      evaluatorId,
      grupo,
      ...notas,
    };

    return this.makeRequest<SaveNotasSuccess>(params);
  }
}

export const apiService = new ApiService();