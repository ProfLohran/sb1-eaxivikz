import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  Clock,
  Info,
  Layers,
  ListChecks,
  LogOut,
  MapPin,
  RefreshCcw,
  Users,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type {
  AvaliacaoData,
  EvaluationSheet,
  InformacoesEvento,
  Rubrica,
  User,
} from '../types';

type ToastType = 'success' | 'error' | 'warning';

interface DashboardProps {
  onToast: (message: string, type: ToastType) => void;
  onNavigateToEvaluation: (grupo: AvaliacaoData, sheetName: string) => void;
}

const STOP_WORDS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'd', 'di', 'du']);
const VALUE_SPLITTER = /[,;|/\n]+/;
const TOKEN_SPLITTER = /[\s\-_/]+/;

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function normalizeString(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeString(value)
    .replace(/[|,;/]/g, ' ')
    .split(TOKEN_SPLITTER)
    .map(token => token.trim())
    .filter(token => token && !STOP_WORDS.has(token));
}

function isGroupAssignedToUser(grupo: AvaliacaoData, user: User): boolean {
  const normalizedId = normalizeString(user.id ?? '');
  const normalizedName = normalizeString(user.name ?? '');
  const nameTokens = user.name ? tokenize(user.name) : [];
  const idTokens = user.id ? tokenize(user.id) : [];

  let hasAssigneeField = false;

  for (const key of Object.keys(grupo)) {
    if (!key || !key.toLowerCase().includes('avaliador')) {
      continue;
    }

    hasAssigneeField = true;
    const rawValue = grupo[key];

    if (!hasValue(rawValue)) {
      continue;
    }

    const rawValues = Array.isArray(rawValue)
      ? rawValue
      : String(rawValue).split(VALUE_SPLITTER);

    for (const raw of rawValues) {
      if (!hasValue(raw)) {
        continue;
      }

      const candidateString = String(raw);
      const normalizedCandidate = normalizeString(candidateString);
      if (!normalizedCandidate) {
        continue;
      }

      const candidateTokens = tokenize(candidateString);

      if (
        normalizedId &&
        (normalizedCandidate === normalizedId || candidateTokens.includes(normalizedId))
      ) {
        return true;
      }

      if (
        idTokens.length > 0 &&
        idTokens.every(token => candidateTokens.includes(token))
      ) {
        return true;
      }

      if (normalizedName) {
        if (
          normalizedCandidate === normalizedName ||
          normalizedCandidate.includes(normalizedName)
        ) {
          return true;
        }

        if (
          nameTokens.length > 0 &&
          nameTokens.every(token => candidateTokens.includes(token))
        ) {
          return true;
        }
      }
    }
  }

  return hasAssigneeField ? false : true;
}

function filterSheetsForUser(sheets: EvaluationSheet[], user: User): EvaluationSheet[] {
  return sheets
    .map(sheet => ({
      ...sheet,
      groups: sheet.groups.filter(group => isGroupAssignedToUser(group, user)),
    }))
    .filter(sheet => sheet.groups.length > 0);
}

function getFirstAvailableField(grupo: AvaliacaoData, keys: string[]): string | undefined {
  const groupKeys = Object.keys(grupo);

  for (const key of keys) {
    if (!key) continue;

    if (hasValue(grupo[key])) {
      return String(grupo[key]);
    }

    const foundKey = groupKeys.find(
      groupKey => groupKey.toLowerCase() === key.toLowerCase(),
    );

    if (foundKey && hasValue(grupo[foundKey])) {
      return String(grupo[foundKey]);
    }
  }

  return undefined;
}

function getGroupName(grupo: AvaliacaoData): string {
  const name = getFirstAvailableField(grupo, [
    'GRUPO',
    'NOME DO GRUPO',
    'NOME_DA_EQUIPE',
    'EQUIPE',
    'NOME',
    'NOME DA EQUIPE',
  ]);

  if (name) {
    return name;
  }

  const project = getFirstAvailableField(grupo, [
    'PROJETO',
    'NOME DO PROJETO',
    'DESAFIO',
    'TEMA',
  ]);

  if (project) {
    return project;
  }

  const id = getFirstAvailableField(grupo, ['ID', 'ID_GRUPO', 'CODIGO']);
  if (id) {
    return `Grupo ${id}`;
  }

  return 'Grupo sem nome';
}

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const yearValue = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
    const date = new Date(yearValue, month, day);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  return trimmed;
}

function formatTime(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }

  return trimmed;
}

function formatSchedule(start?: string | null, end?: string | null): string | null {
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime || endTime;
}

export function Dashboard({ onToast, onNavigateToEvaluation }: DashboardProps) {
  const { user, logout } = useAuth();
  const [informacoes, setInformacoes] = useState<InformacoesEvento | null>(null);
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [evaluationSheets, setEvaluationSheets] = useState<EvaluationSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (showFullLoading = true) => {
      if (!user) {
        return;
      }

      setError(null);

      if (showFullLoading) {
        setLoading(true);
      }

      try {
        const [infoResponse, rubricasResponse, sheetsResponse] = await Promise.all([
          apiService.getInformacoes(user.id),
          apiService.getRubricas(user.categoria),
          apiService.loadAllEvaluationSheets(user.id),
        ]);

        if (infoResponse.success) {
          setInformacoes(infoResponse.informacoes);
        } else {
          setInformacoes(null);
          onToast(infoResponse.error ?? 'Erro ao carregar informações do evento.', 'warning');
        }

        if (rubricasResponse.success) {
          setRubricas(rubricasResponse.rubricas);
        } else {
          setRubricas([]);
          onToast(rubricasResponse.error ?? 'Erro ao carregar rubricas.', 'warning');
        }

        const filteredSheets = filterSheetsForUser(sheetsResponse, user);
        setEvaluationSheets(filteredSheets);

        setSelectedSheet(prev => {
          if (prev && filteredSheets.some(sheet => sheet.name === prev)) {
            return prev;
          }
          return filteredSheets[0]?.name ?? '';
        });

        if (filteredSheets.length === 0) {
          onToast('Nenhum projeto atribuído encontrado para você neste momento.', 'warning');
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setInformacoes(null);
        setRubricas([]);
        setEvaluationSheets([]);
        setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
        onToast('Erro ao carregar dados do dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [onToast, user],
  );

  useEffect(() => {
    if (user) {
      loadDashboard(true);
    }
  }, [loadDashboard, user]);

  const handleRefresh = useCallback(async () => {
    if (!user) {
      return;
    }

    setRefreshing(true);
    await loadDashboard(false);
    setRefreshing(false);
  }, [loadDashboard, user]);

  const handleLogout = useCallback(() => {
    logout();
    onToast('Você saiu do sistema.', 'success');
  }, [logout, onToast]);

  const selectedSheetData = useMemo(
    () => evaluationSheets.find(sheet => sheet.name === selectedSheet),
    [evaluationSheets, selectedSheet],
  );

  const evaluationDeadline = formatDate(
    informacoes?.dataLimiteAvaliacao ?? user?.evaluationDeadline ?? null,
  );
  const pitchDate = formatDate(informacoes?.dataPitch ?? null);
  const pitchSchedule = formatSchedule(
    informacoes?.horarioInicio ?? null,
    informacoes?.horarioFim ?? null,
  );

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  const eventHighlights = informacoes
    ? [
        {
          label: 'Cliente',
          value: informacoes.cliente,
          icon: Building2,
        },
        {
          label: 'Endereço',
          value: informacoes.enderecoCliente,
          icon: MapPin,
        },
        {
          label: 'Turmas',
          value: informacoes.turmas,
          icon: Users,
        },
        {
          label: 'Data do pitch',
          value: pitchDate,
          icon: Calendar,
        },
        {
          label: 'Horário',
          value: pitchSchedule,
          icon: Clock,
        },
        {
          label: 'Informações adicionais',
          value: informacoes.informacoesAdicionais,
          icon: Info,
        },
      ].filter(item => hasValue(item.value))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Bem-vindo de volta, {informacoes?.nomeDoAvaliador ?? user.name}!
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Painel do avaliador</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
              {evaluationDeadline && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data limite: {evaluationDeadline}
                </span>
              )}
              {informacoes?.categoria && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Categoria: {informacoes.categoria}
                </span>
              )}
              {!informacoes?.categoria && user.categoria && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Categoria: {user.categoria}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRefresh}
              loading={refreshing}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold">Erro ao carregar dados</p>
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {informacoes && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Informações do evento
                  </h2>
                  <p className="text-sm text-gray-500">
                    Confira os detalhes principais antes de iniciar suas avaliações.
                  </p>
                </CardHeader>
                <CardContent>
                  {eventHighlights.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {eventHighlights.map(({ label, value, icon: Icon }) => (
                        <div
                          key={label}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{label}</p>
                              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                                {value}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhuma informação adicional disponível no momento.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {informacoes?.temaPerguntaRegras && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Tema, pergunta e regras
                  </h2>
                </CardHeader>
                <CardContent>
                  <div
                    className="space-y-3 text-sm leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: informacoes.temaPerguntaRegras }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-blue-600" />
                  Rubricas da categoria
                </h2>
                <p className="text-sm text-gray-500">
                  Consulte os critérios que serão utilizados na avaliação.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                {rubricas.length > 0 ? (
                  rubricas.map((rubrica, index) => (
                    <div
                      key={`${rubrica.avaliacao}-${index}`}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {rubrica.avaliacao}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{rubrica.criterio}</p>
                      <div className="mt-3 grid gap-2 text-xs text-gray-500">
                        <span>
                          <strong>5 pontos:</strong> {rubrica.cincoPontos}
                        </span>
                        <span>
                          <strong>4 pontos:</strong> {rubrica.quatroPontos}
                        </span>
                        <span>
                          <strong>3 pontos:</strong> {rubrica.tresPontos}
                        </span>
                        <span>
                          <strong>2 pontos:</strong> {rubrica.doisPontos}
                        </span>
                        <span>
                          <strong>1 ponto:</strong> {rubrica.umPonto}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhuma rubrica disponível para a sua categoria.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    Projetos atribuídos
                  </h2>
                  <p className="text-sm text-gray-500">
                    Selecione uma modalidade para visualizar os grupos disponíveis.
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {evaluationSheets.map(sheet => (
                    <button
                      key={sheet.name}
                      type="button"
                      onClick={() => setSelectedSheet(sheet.name)}
                      className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        selectedSheet === sheet.name
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span>{sheet.displayName}</span>
                      <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/20 px-2 text-xs font-semibold">
                        {sheet.groups.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {evaluationSheets.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Users className="mx-auto mb-4 h-8 w-8 text-gray-400" />
                  <p className="text-base font-semibold text-gray-700">
                    Nenhum projeto atribuído
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Assim que novos projetos forem designados para você, eles aparecerão aqui.
                  </p>
                </div>
              ) : selectedSheetData ? (
                <div className="space-y-4">
                  {selectedSheetData.groups.map((grupo, index) => {
                    const groupName = getGroupName(grupo);
                    const projectName = getFirstAvailableField(grupo, [
                      'PROJETO',
                      'NOME DO PROJETO',
                      'DESAFIO',
                      'TEMA',
                      'PROJETO_NOME',
                      'NOME_PROJETO',
                    ]);
                    const turma = getFirstAvailableField(grupo, [
                      'TURMA',
                      'TURMAS',
                      'CLASSE',
                      'SALA',
                    ]);
                    const integrantes = getFirstAvailableField(grupo, [
                      'INTEGRANTES',
                      'PARTICIPANTES',
                      'MEMBROS',
                      'INTEGRANTES DO GRUPO',
                    ]);
                    const categoriaProjeto = getFirstAvailableField(grupo, [
                      'CATEGORIA',
                      'MODALIDADE',
                    ]);
                    const groupKey =
                      getFirstAvailableField(grupo, [
                        'ID',
                        'GRUPO',
                        'NOME DO GRUPO',
                        'CODIGO',
                      ]) ?? `${selectedSheetData.name}-${index}`;

                    return (
                      <div
                        key={groupKey}
                        className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-900">
                            <Users className="h-5 w-5 text-blue-600" />
                            <p className="text-base font-semibold">{groupName}</p>
                          </div>
                          {projectName && projectName !== groupName && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-700">Projeto:</span> {projectName}
                            </p>
                          )}
                          {turma && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-700">Turma:</span> {turma}
                            </p>
                          )}
                          {categoriaProjeto && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-700">Categoria:</span> {categoriaProjeto}
                            </p>
                          )}
                          {integrantes && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-700">Integrantes:</span> {integrantes}
                            </p>
                          )}
                        </div>
                        <div className="md:text-right">
                          <Button
                            type="button"
                            className="flex items-center gap-2"
                            onClick={() => onNavigateToEvaluation(grupo, selectedSheetData.name)}
                          >
                            <ClipboardList className="h-4 w-4" />
                            Avaliar projeto
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Layers className="mx-auto mb-4 h-8 w-8 text-gray-400" />
                  <p className="text-base font-semibold text-gray-700">
                    Selecione uma modalidade
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Escolha uma das abas acima para visualizar os grupos disponíveis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
