import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardContent } from './ui/Card';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export function LoginPage({ onToast }: LoginPageProps) {
  const [form, setForm] = useState({ login: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.login.trim()) {
      newErrors.login = 'Login é obrigatório';
    }
    
    if (!form.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    
    try {
      const response = await apiService.login(form.login.trim(), form.senha);
      
      if (response.success) {
        login(response.user);
        onToast('Login realizado com sucesso!', 'success');
      } else {
        const errorMessage = response.error === 'Login ou senha incorretos.'
          ? 'Credenciais inválidas. Verifique seu login e senha.'
          : response.error === 'Usuário inativo.'
          ? 'Sua conta está inativa. Entre em contato com o administrador.'
          : response.error;
        
        onToast(errorMessage, 'error');
      }
    } catch (error) {
      onToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Avaliação de Hackathon
          </h1>
          <p className="text-gray-600 mt-2">
            Faça login para acessar o sistema
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Login"
              type="text"
              value={form.login}
              onChange={(e) => handleInputChange('login', e.target.value)}
              error={errors.login}
              placeholder="Digite seu login"
              disabled={loading}
              autoComplete="username"
            />
            
            <Input
              label="Senha"
              type="password"
              value={form.senha}
              onChange={(e) => handleInputChange('senha', e.target.value)}
              error={errors.senha}
              placeholder="Digite sua senha"
              disabled={loading}
              autoComplete="current-password"
            />
            
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}