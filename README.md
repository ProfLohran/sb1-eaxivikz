# Sistema de Avaliação de Hackathon

Uma aplicação web moderna para avaliação de projetos de hackathon, desenvolvida com Vite + React + TypeScript e integrada com Google Apps Script.

## 🚀 Funcionalidades

- **Autenticação**: Login seguro com validação de credenciais
- **Dashboard do Avaliador**: Visão geral com informações do evento, rubricas e grupos
- **Sistema de Avaliação**: Interface intuitiva para avaliar projetos com critérios específicos
- **Feedback em Tempo Real**: Notificações visuais para todas as ações
- **Design Responsivo**: Otimizado para desktop, tablet e mobile
- **Estado Otimista**: Interface responsiva com rollback automático em caso de erro

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Backend**: Google Apps Script (API externa)

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Base URL da API Google Apps Script
VITE_API_BASE_URL=https://script.google.com/macros/s/SEU_SCRIPT_ID/exec
```

### 2. Instalação

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📊 Abas de Avaliação Suportadas

O sistema carrega automaticamente dados das seguintes abas da planilha:

- **DT** (Design Thinking)
- **PITCH** (Pitch)
- **PROTÓTIPO** (Protótipo)
- **PROTÓTIPO_FISICO** (Protótipo Físico)
- **MARATONA** (Maratona - compatibilidade)

Apenas abas que contêm dados para o avaliador logado serão exibidas no dashboard.

## 📋 Estrutura da API

A aplicação consome uma API Google Apps Script com os seguintes endpoints:

### Autenticação
- **POST** `action=login`
- Parâmetros: `login`, `senha`

### Carregar Dados
- **POST** `action=loadData`
- Parâmetros: `sheet`, `evaluatorId`

### Salvar Notas
- **POST** `action=saveNotas`
- Parâmetros: `sheet`, `evaluatorId`, `grupo`, + campos de nota

### Buscar Rubricas
- **POST** `action=getRubricas`
- Parâmetros: `tipoHacka`

### Informações do Evento
- **POST** `action=getInformacoes`
- Parâmetros: `avaliadorID`

## 🎯 Fluxo de Uso

1. **Login**: Acesse com suas credenciais de avaliador
2. **Dashboard**: Visualize informações do evento, tema/regras (HTML embed), rubricas da sua categoria e abas de avaliação disponíveis
3. **Seleção de Aba**: Escolha entre as diferentes modalidades de avaliação (DT, Pitch, Protótipo, etc.)
4. **Avaliação**: Clique em "Avaliar" para um grupo específico dentro da aba selecionada
5. **Pontuação**: Atribua notas de 1 a 5 para cada critério baseado nas rubricas
6. **Feedback**: Adicione comentários opcionais sobre o projeto
7. **Salvar**: Confirme a avaliação (salvamento automático otimista)

## 📱 Design Responsivo

A aplicação foi projetada com abordagem mobile-first:

- **Mobile** (<768px): Layout otimizado para telas pequenas
- **Tablet** (768px-1024px): Layout adaptado para tablets
- **Desktop** (>1024px): Layout completo com sidebar e múltiplas colunas

## 🎨 Funcionalidades Especiais

### Tema, Pergunta e Regras
- Renderização de conteúdo HTML/embed diretamente da planilha
- Suporte a formatação rica, links e elementos visuais
- Exibição em card dedicado no dashboard

### Múltiplas Abas de Avaliação
- Carregamento automático de todas as abas disponíveis
- Interface organizada por modalidade de avaliação
- Navegação clara entre diferentes tipos de avaliação

## 🔒 Segurança

- Validação de entrada em todos os formulários
- Tratamento de erros robusto
- Sanitização de dados antes do envio
- Logout automático em caso de sessão inválida

## 🎨 Componentes Principais

### UI Components
- `Button`: Botão reutilizável com estados de loading
- `Input`: Campo de entrada com validação
- `Card`: Container para conteúdo organizado
- `Toast`: Notificações visuais

### Pages
- `LoginPage`: Formulário de autenticação
- `Dashboard`: Painel principal do avaliador
- `EvaluationPage`: Interface de avaliação de grupos

### Services
- `apiService`: Centraliza todas as chamadas para a API
- `AuthContext`: Gerencia estado de autenticação

## 🧪 Testes Manuais

Para validar a integração:

1. **Login**: Teste credenciais válidas e inválidas
2. **Carregamento de dados**: Verifique se informações, rubricas e abas carregam
3. **Renderização HTML**: Confirme que tema/regras são exibidos corretamente
4. **Múltiplas abas**: Teste navegação entre diferentes modalidades
5. **Salvamento**: Confirme que notas são salvas na aba correta
6. **Responsividade**: Teste em diferentes tamanhos de tela
7. **Tratamento de erros**: Simule falhas de conexão

## 📦 Build e Deploy

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

Os arquivos otimizados estarão na pasta `dist/` prontos para deploy em qualquer servidor web estático.

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro CORS**: Verifique se a API Google Apps Script está configurada para aceitar requisições
2. **Dados não carregam**: Confirme a variável VITE_API_BASE_URL
3. **Login falha**: Verifique se o usuário está ativo na planilha
4. **Notas não salvam**: Confirme se os nomes das colunas estão em UPPERCASE
5. **HTML não renderiza**: Verifique se o campo temaPerguntaRegras contém HTML válido
6. **Abas não aparecem**: Confirme se existem dados para o avaliador nas abas esperadas

### Debug

Ative o modo de desenvolvimento para logs detalhados:
```bash
npm run dev
```

Os logs da API aparecerão no console do navegador.