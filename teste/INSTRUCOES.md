# 🚀 Instruções Rápidas - Sistema de Fluxo de Caixa

## ⚡ Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar E-mail (Opcional)
Crie um arquivo `.env` na raiz do projeto:
```env
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-gmail
PORT=3000
```

**Nota**: Para usar e-mail, você precisa de uma "Senha de App" do Gmail.

### 3. Iniciar o Sistema
```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

### 4. Acessar o Sistema
- **Interface Principal**: http://localhost:3000
- **Página de Teste**: http://localhost:3000/test.html

## 🎯 Funcionalidades Principais

### 📊 Dashboard
- Visualize faturamento previsto e arrecadado
- Monitore clientes em dia e inadimplentes
- Acompanhe estatísticas em tempo real

### 👥 Gestão de Clientes
- **Adicionar**: Clique em "Clientes" → "Novo Cliente"
- **Editar**: Clique no ícone de edição na tabela
- **Excluir**: Clique no ícone de lixeira na tabela
- **Enviar Cobrança**: Clique no ícone de avião de papel

### 💰 Gestão de Pagamentos
- **Registrar**: Clique em "Pagamentos" → "Novo Pagamento"
- **Visualizar**: Todos os pagamentos aparecem na tabela
- **Excluir**: Clique no ícone de lixeira na tabela

### 📧 Cobranças Automáticas
- **Automático**: Sistema envia no dia 5 de cada mês
- **Manual**: Use o botão "Executar Cobranças Automáticas" no dashboard
- **Individual**: Use o botão de cobrança na tabela de clientes

## 🔧 Configurações Importantes

### E-mail Gmail
1. Ative verificação em duas etapas
2. Gere uma "Senha de App"
3. Use essa senha no arquivo `.env`

### Porta do Servidor
- Padrão: 3000
- Altere no arquivo `.env` se necessário

## 📱 Interface Responsiva
- Funciona em desktop, tablet e mobile
- Design moderno com gradientes e animações
- Navegação intuitiva entre abas

## 🧪 Testando o Sistema
Use a página `test.html` para:
- Verificar se a API está funcionando
- Testar criação de clientes e pagamentos
- Validar funcionalidades do dashboard

## 🚨 Solução de Problemas

### Servidor não inicia
- Verifique se a porta 3000 está livre
- Confirme se todas as dependências foram instaladas
- Verifique o console para mensagens de erro

### E-mail não funciona
- Confirme se as credenciais estão corretas
- Verifique se a "Senha de App" está ativa
- Confirme se a verificação em duas etapas está ativada

### Dados não aparecem
- Verifique se o servidor está rodando
- Confirme se os arquivos JSON existem na pasta `data/`
- Verifique o console do navegador

## 📞 Suporte
- Consulte o `README.md` completo
- Verifique os logs do servidor
- Teste com a página `test.html`

---

**🎉 Sistema pronto para uso! Acesse http://localhost:3000**
