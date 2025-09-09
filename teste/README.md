# Sistema de Fluxo de Caixa

Um sistema completo para gestão de fluxo de caixa, cadastro de clientes e controle de faturamento com envio automático de cobranças.

## 🚀 Funcionalidades

### 1. Gestão de Clientes
- ✅ Cadastrar novos clientes
- ✅ Editar informações dos clientes
- ✅ Excluir clientes
- ✅ Controle de status (em dia/inadimplente)
- ✅ Informações: nome, e-mail, telefone e honorários mensais

### 2. Dashboard Inteligente
- 📊 Faturamento previsto para o mês
- 💰 Faturamento arrecadado no mês atual
- 📈 Faturamento total do ano
- 👥 Total de clientes
- ✅ Clientes em dia com pagamentos
- ⚠️ Clientes inadimplentes

### 3. Sistema de Pagamentos
- 💳 Registrar pagamentos dos clientes
- 📅 Controle de datas de pagamento
- 🔍 Histórico completo de transações

### 4. Cobranças Automáticas
- 📧 Envio automático de cobranças por e-mail
- ⏰ Agendamento automático (todo dia 5 de cada mês) ou manual para um dia específico do mês
- 🚀 Execução manual de cobranças
- 📝 Templates personalizados de e-mail

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados**: JSON (pode ser migrado para SQL)
- **E-mail**: Nodemailer
- **Agendamento**: Node-cron
- **Estilização**: CSS moderno com gradientes e animações

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn
- Conta de e-mail Gmail para envio de cobranças

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd sistema-fluxo-caixa
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-gmail
PORT=3000
```

**⚠️ Importante**: Para o Gmail, você precisa usar uma "Senha de App" em vez da senha normal da conta.

### 4. Inicie o servidor
```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

### 5. Acesse o sistema
Abra seu navegador e acesse: `http://localhost:3000`

## 📧 Configuração do E-mail

### Gmail - Senha de App
1. Acesse sua conta Google
2. Vá em "Segurança"
3. Ative a "Verificação em duas etapas"
4. Gere uma "Senha de app" para o sistema
5. Use essa senha no arquivo `.env`

## 🎯 Como Usar

### Dashboard
- Visualize todas as informações financeiras em tempo real
- Monitore clientes em dia e inadimplentes
- Acompanhe faturamento previsto vs. arrecadado

### Cadastro de Clientes
1. Clique em "Clientes" no menu
2. Clique em "Novo Cliente"
3. Preencha: nome, e-mail, telefone e honorários mensais
4. Clique em "Salvar"

### Registro de Pagamentos
1. Clique em "Pagamentos" no menu
2. Clique em "Novo Pagamento"
3. Selecione o cliente
4. Informe o valor e data do pagamento
5. Clique em "Salvar"

### Envio de Cobranças
- **Automático**: Sistema envia automaticamente no dia 5 de cada mês
- **Manual**: Clique no botão de cobrança na tabela de clientes
- **Em massa**: Use o botão "Executar Cobranças Automáticas" no dashboard

## 📁 Estrutura do Projeto

```
sistema-fluxo-caixa/
├── public/                 # Frontend
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   └── script.js          # JavaScript do frontend
├── data/                  # Banco de dados (JSON)
│   ├── clients.json       # Dados dos clientes
│   └── payments.json      # Dados dos pagamentos
├── server.js              # Servidor Node.js
├── package.json           # Dependências
└── README.md              # Este arquivo
```

## 🔄 API Endpoints

### Clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients` - Listar clientes
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Excluir cliente

### Pagamentos
- `POST /api/payments` - Registrar pagamento
- `GET /api/payments` - Listar pagamentos
- `DELETE /api/payments/:id` - Excluir pagamento

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

### Cobranças
- `POST /api/send-billing` - Enviar cobrança individual
- `POST /api/run-automatic-billing` - Executar cobranças automáticas

## 🚀 Funcionalidades Avançadas

### Agendamento Automático
O sistema usa cron jobs para:
- Enviar cobranças automaticamente no dia 5 de cada mês
- Verificar status dos clientes
- Atualizar dashboard

### Notificações em Tempo Real
- Sistema de notificações toast
- Feedback visual para todas as ações
- Confirmações para ações destrutivas

### Interface Responsiva
- Design adaptável para mobile e desktop
- Animações suaves e modernas
- Gradientes e sombras para melhor UX

## 🔒 Segurança

- Validação de dados no frontend e backend
- Sanitização de inputs
- Controle de acesso básico
- Logs de todas as operações

## 📊 Banco de Dados

### Estrutura dos Dados

**Clientes (clients.json)**
```json
{
  "id": "1234567890",
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-9999",
  "honorariosMensais": 500.00,
  "dataCadastro": "2024-01-15T10:30:00.000Z",
  "status": "em-dia"
}
```

**Pagamentos (payments.json)**
```json
{
  "id": "1234567891",
  "clientId": "1234567890",
  "valor": 500.00,
  "dataPagamento": "2024-01-15",
  "dataRegistro": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Deploy

### Local
```bash
npm start
```

### Produção
1. Configure variáveis de ambiente
2. Use PM2 ou similar para gerenciar processos
3. Configure proxy reverso (Nginx/Apache)
4. Configure SSL/HTTPS

## 🐛 Solução de Problemas

### Erro de E-mail
- Verifique se as credenciais estão corretas
- Confirme se a "Senha de App" está ativa
- Verifique se a verificação em duas etapas está ativada

### Erro de Porta
- Verifique se a porta 3000 está livre
- Altere a porta no arquivo `.env` se necessário

### Dados não carregam
- Verifique se o servidor está rodando
- Confirme se os arquivos JSON existem na pasta `data/`
- Verifique o console do navegador para erros

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no GitHub
- Entre em contato via e-mail
- Consulte a documentação da API

## 🔮 Próximas Funcionalidades

- [ ] Relatórios em PDF
- [ ] Integração com sistemas de pagamento
- [ ] Dashboard com gráficos
- [ ] Sistema de usuários e permissões
- [ ] Backup automático dos dados
- [ ] Notificações push
- [ ] App mobile

---

**Desenvolvido com ❤️ para facilitar a gestão financeira**
