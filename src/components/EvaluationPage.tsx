import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Star, Layers } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardContent } from './ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Rubrica, AvaliacaoData } from '../types';

interface EvaluationPageProps {
  grupo: AvaliacaoData;
  sheetName: string;
  onBack: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export function EvaluationPage({ grupo, sheetName, onBack, onToast }: EvaluationPageProps) {
  const { user } = useAuth();
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    loadRubricas();
  }, []);

  const loadRubricas = async () => {
    if (!user) return;

    try {
      const response = await apiService.getRubricas(user.categoria);
      
      if (response.success) {
        setRubricas(response.rubricas);
        // Inicializar notas com valores existentes ou 0
        const initialNotas: Record<string, number> = {};
        response.rubricas.forEach((rubrica, index) => {
          const notaKey = `NOTA ${index + 1}`;
          initialNotas[notaKey] = grupo[notaKey] ? Number(grupo[notaKey]) : 0;
        });
        setNotas(initialNotas);
        setFeedback(grupo.FEEDBACK || '');
      } else {
        onToast('Erro ao carregar rubricas: ' + response.error, 'error');
      }
    } catch (error) {
      onToast('Erro de conexão ao carregar rubricas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNotaChange = (notaKey: string, valor: string) => {
    const numericValue = Math.max(0, Math.min(5, parseInt(valor) || 0));
    setNotas(prev => ({ ...prev, [notaKey]: numericValue }));
    
    // Limpar erro se houver
    if (errors[notaKey]) {
      setErrors(prev => ({ ...prev, [notaKey]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(notas).forEach(key => {
      if (notas[key] < 1 || notas[key] > 5) {
        newErrors[key] = 'Nota deve ser entre 1 e 5';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validate()) return;

    setSaving(true);

    try {
      // Preparar dados para salvar
      const notasToSave: Record<string, string> = {};
      
      // Adicionar notas
      Object.keys(notas).forEach(key => {
        notasToSave[key] = String(notas[key]);
      });
      
      // Adicionar feedback se houver
      if (feedback.trim()) {
        notasToSave.FEEDBACK = feedback.trim();
      }

      const grupoIdentifier = grupo.GRUPO || grupo.NOME || `Grupo_${grupo.ID || ''}`;
      
      const response = await apiService.saveNotas(
        sheetName,
        user.id,
        grupoIdentifier,
        notasToSave
      );

      if (response.success) {
        if (response.updatedRows > 0) {
          onToast(`Avaliação salva com sucesso! ${response.updatedRows} linha(s) atualizadas.`, 'success');
          // Aguardar um pouco antes de voltar para dar feedback visual
          setTimeout(() => onBack(), 1500);
        } else {
          onToast('Nenhuma linha foi atualizada. Verifique se o grupo existe.', 'warning');
        }
      } else {
        onToast('Erro ao salvar avaliação: ' + response.error, 'error');
      }
    } catch (error) {
      onToast('Erro de conexão ao salvar avaliação', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando critérios...</p>
        </div>
      </div>
    );
  }

  const grupoName = grupo.GRUPO || grupo.NOME || `Grupo ${grupo.ID || ''}`;
  const sheetDisplayName = {
    'DT': 'Design Thinking',
    'PITCH': 'Pitch',
    'PROTÓTIPO': 'Protótipo',
    'PROTÓTIPO_FISICO': 'Protótipo Físico',
    'MARATONA': 'Maratona'
  }[sheetName] || sheetName;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Avaliação: {grupoName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {sheetDisplayName}
                  </span>
                {grupo.TURMA && (
                    <span>Turma: {grupo.TURMA}</span>
                )}
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSave}
              loading={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Avaliação
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {rubricas.map((rubrica, index) => {
            const notaKey = `NOTA ${index + 1}`;
            const currentNota = notas[notaKey] || 0;
            
            return (
              <Card key={index}>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    {rubrica.avaliacao}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {rubrica.criterio}
                  </p>
                </CardHeader>
                
                <CardContent>
                  {/* Escala de pontuação */}
                  <div className="mb-4 space-y-2 text-sm">
                    <div className="grid grid-cols-1 gap-2">
                      <div><strong>5 pontos:</strong> {rubrica.cincoPontos}</div>
                      <div><strong>4 pontos:</strong> {rubrica.quatroPontos}</div>
                      <div><strong>3 pontos:</strong> {rubrica.tresPontos}</div>
                      <div><strong>2 pontos:</strong> {rubrica.doisPontos}</div>
                      <div><strong>1 ponto:</strong> {rubrica.umPonto}</div>
                    </div>
                  </div>

                  {/* Input da nota */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={currentNota || ''}
                        onChange={(e) => handleNotaChange(notaKey, e.target.value)}
                        error={errors[notaKey]}
                        placeholder="Nota (1-5)"
                        className="text-center text-lg font-semibold"
                      />
                    </div>
                    
                    {/* Botões de pontuação rápida */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(nota => (
                        <button
                          key={nota}
                          onClick={() => handleNotaChange(notaKey, String(nota))}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                            currentNota === nota
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {nota}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Feedback */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Feedback (Opcional)
              </h3>
            </CardHeader>
            <CardContent>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Digite aqui seus comentários sobre o projeto..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              />
            </CardContent>
          </Card>

          {/* Botão de salvar fixo no mobile */}
          <div className="sticky bottom-4 md:hidden">
            <Button
              onClick={handleSave}
              loading={saving}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <Save className="h-4 w-4" />
              Salvar Avaliação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}