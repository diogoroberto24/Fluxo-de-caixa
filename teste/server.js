const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do banco de dados (arquivos JSON)
const DB_PATH = './data';
const CLIENTS_FILE = path.join(DB_PATH, 'clients.json');
const PAYMENTS_FILE = path.join(DB_PATH, 'payments.json');
const BILLS_FILE = path.join(DB_PATH, 'bills.json');

// Garantir que o diretório de dados existe
async function ensureDataDirectory() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.mkdir(DB_PATH, { recursive: true });
    }
}

// Inicializar arquivos de dados se não existirem
async function initializeDataFiles() {
    try {
        await fs.access(CLIENTS_FILE);
    } catch {
        await fs.writeFile(CLIENTS_FILE, JSON.stringify([], null, 2));
    }
    
    try {
        await fs.access(PAYMENTS_FILE);
    } catch {
        await fs.writeFile(PAYMENTS_FILE, JSON.stringify([], null, 2));
    }
    
    try {
        await fs.access(BILLS_FILE);
    } catch {
        await fs.writeFile(BILLS_FILE, JSON.stringify([], null, 2));
    }
}

// Funções de leitura/escrita do banco
async function readClients() {
    const data = await fs.readFile(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
}

async function readBills() {
    const data = await fs.readFile(BILLS_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeClients(clients) {
    await fs.writeFile(CLIENTS_FILE, JSON.stringify(clients, null, 2));
}

async function readPayments() {
    const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
    return JSON.parse(data);
}

async function writePayments(payments) {
    await fs.writeFile(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
}

async function writeBills(bills) {
    await fs.writeFile(BILLS_FILE, JSON.stringify(bills, null, 2));
}

// Configuração do email (para envio de cobranças)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'seu-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'sua-senha-app'
    }
});

// ROTAS DA API

// 1. Cadastrar cliente
app.post('/api/clients', async (req, res) => {
    try {
        const { nome, cnpjCpf, enderecoCnpj, tipoTributacao, email, telefone, honorariosMensais, socios, modulos } = req.body;
        
        if (!nome || !cnpjCpf || !enderecoCnpj || !tipoTributacao || !email || !telefone || !honorariosMensais) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const clients = await readClients();
        
        // Verificar se email já existe
        if (clients.find(client => client.email === email)) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Verificar se CNPJ/CPF já existe
        if (clients.find(client => client.cnpjCpf === cnpjCpf)) {
            return res.status(400).json({ error: 'CNPJ/CPF já cadastrado' });
        }

        // Gerar ID sequencial (formatado com 3 dígitos)
        // Encontrar o maior ID atual e incrementar, garantindo que seja sequencial mesmo após exclusões
        const nextIdNumber = clients.length > 0 ? Math.max(...clients.map(c => parseInt(c.id, 10))) + 1 : 1;
        const nextId = nextIdNumber.toString().padStart(3, '0');

        const newClient = {
            id: nextId,
            nome,
            cnpjCpf,
            enderecoCnpj,
            tipoTributacao,
            email,
            telefone,
            honorariosMensais: parseFloat(honorariosMensais),
            socios: socios || '',
            modulos: modulos || [],
            dataCadastro: new Date().toISOString(),
            status: 'em-dia', // Inicialmente em dia
            historicoHonorarios: [{
                valor: parseFloat(honorariosMensais),
                dataAlteracao: new Date().toISOString(),
                tipo: 'cadastro'
            }]
        };

        clients.push(newClient);
        await writeClients(clients);

        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 2. Listar todos os clientes
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await readClients();
        const payments = await readPayments();
        
        // Calcular status de cada cliente preservando INATIVOS
        const clientsWithStatus = clients.map(client => {
            // Se já está inativo, mantém
            if (client.status === 'inativo') {
                return client;
            }

            const clientPayments = payments.filter(p => p.clientId === client.id);
            const currentMonth = moment().format('YYYY-MM');
            const hasPaymentThisMonth = clientPayments.some(p => moment(p.dataPagamento).format('YYYY-MM') === currentMonth);

            return {
                ...client,
                status: hasPaymentThisMonth ? 'em-dia' : 'inadimplente'
            };
        });

        res.json(clientsWithStatus);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 2.1. Atualizar cliente
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cnpjCpf, enderecoCnpj, tipoTributacao, email, telefone, honorariosMensais, socios, modulos } = req.body;
        
        if (!nome || !cnpjCpf || !enderecoCnpj || !tipoTributacao || !email || !telefone || !honorariosMensais) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const clients = await readClients();
        const clientIndex = clients.findIndex(c => c.id === id);
        
        if (clientIndex === -1) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Verificar se email já existe em outro cliente
        const emailExists = clients.find(client => client.email === email && client.id !== id);
        if (emailExists) {
            return res.status(400).json({ error: 'Email já cadastrado para outro cliente' });
        }

        // Verificar se CNPJ/CPF já existe em outro cliente
        const cnpjExists = clients.find(client => client.cnpjCpf === cnpjCpf && client.id !== id);
        if (cnpjExists) {
            return res.status(400).json({ error: 'CNPJ/CPF já cadastrado para outro cliente' });
        }

        const clienteAnterior = clients[clientIndex];
        const honorariosAnteriores = clienteAnterior.honorariosMensais;
        const novosHonorarios = parseFloat(honorariosMensais);

        // Verificar se houve alteração nos honorários
        if (honorariosAnteriores !== novosHonorarios) {
            if (!clienteAnterior.historicoHonorarios) {
                clienteAnterior.historicoHonorarios = [];
            }
            
            clienteAnterior.historicoHonorarios.push({
                valor: novosHonorarios,
                valorAnterior: honorariosAnteriores,
                dataAlteracao: new Date().toISOString(),
                tipo: 'alteracao'
            });
        }

        // Atualizar cliente
        clients[clientIndex] = {
            ...clienteAnterior,
            nome,
            cnpjCpf,
            enderecoCnpj,
            tipoTributacao,
            email,
            telefone,
            honorariosMensais: novosHonorarios,
            socios: socios || '',
            modulos: modulos || []
        };

        await writeClients(clients);
        res.json(clients[clientIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 3. Excluir cliente
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const clients = await readClients();
        const payments = await readPayments();
        
        const clientIndex = clients.findIndex(c => c.id === id);
        if (clientIndex === -1) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Remover cliente
        clients.splice(clientIndex, 1);
        await writeClients(clients);

        // Remover pagamentos relacionados
        const filteredPayments = payments.filter(p => p.clientId !== id);
        await writePayments(filteredPayments);

        res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 4. Registrar pagamento
app.post('/api/payments', async (req, res) => {
    try {
        const { clientId, valor, dataPagamento, observacoes } = req.body;
        
        if (!clientId || !valor || !dataPagamento) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const payments = await readPayments();
        const newPayment = {
            id: Date.now().toString(),
            clientId,
            valor: parseFloat(valor),
            dataPagamento,
            observacoes: observacoes || '',
            dataRegistro: new Date().toISOString()
        };

        payments.push(newPayment);
        await writePayments(payments);

        res.status(201).json(newPayment);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 4.1. Listar pagamentos
app.get('/api/payments', async (req, res) => {
    try {
        const payments = await readPayments();
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 4.2. Excluir pagamento
app.delete('/api/payments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const payments = await readPayments();
        
        const paymentIndex = payments.findIndex(p => p.id === id);
        if (paymentIndex === -1) {
            return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        payments.splice(paymentIndex, 1);
        await writePayments(payments);

        res.json({ message: 'Pagamento excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 5. Dashboard - Faturamento previsto e arrecadado
app.get('/api/dashboard', async (req, res) => {
    try {
        const clients = await readClients();
        const payments = await readPayments();
        
        const currentMonth = moment().format('YYYY-MM');
        const currentYear = moment().year();
        const currentMonthNumber = moment().month() + 1;

        // Faturamento arrecadado no mês atual
        const faturamentoArrecadado = payments
            .filter(p => moment(p.dataPagamento).format('YYYY-MM') === currentMonth)
            .reduce((total, p) => total + p.valor, 0);

        // Faturamento total esperado (todos os clientes ativos)
        const faturamentoTotal = clients
            .filter(client => client.status !== 'inativo')
            .reduce((total, client) => total + client.honorariosMensais, 0);
            
        // Faturamento previsto = soma dos honorários dos clientes ativos que ainda não pagaram no mês atual
        let faturamentoPrevisto = 0;
        
        // Verificar cada cliente ativo
        const clientesAtivos = clients.filter(client => client.status !== 'inativo');
        
        // Se não houver clientes ativos, o faturamento previsto é zero
        if (clientesAtivos.length === 0) {
            faturamentoPrevisto = 0;
        } else {
            // Verificar pagamentos de cada cliente ativo
            for (const client of clientesAtivos) {
                // Verificar se o cliente já pagou no mês atual
                const clientPaidThisMonth = payments.some(p => 
                    p.clientId === client.id && 
                    moment(p.dataPagamento).format('YYYY-MM') === currentMonth
                );
                
                // Se o cliente não pagou, adicionar seus honorários ao faturamento previsto
                if (!clientPaidThisMonth) {
                    faturamentoPrevisto += client.honorariosMensais;
                }
            }
        }

        // Faturamento arrecadado no ano
        const faturamentoAno = payments
            .filter(p => moment(p.dataPagamento).year() === currentYear)
            .reduce((total, p) => total + p.valor, 0);

        // Clientes inadimplentes (apenas ativos)
        const clientesInadimplentes = clients.filter(client => {
            if (client.status === 'inativo') return false;
            const clientPayments = payments.filter(p => p.clientId === client.id);
            return !clientPayments.some(p => 
                moment(p.dataPagamento).format('YYYY-MM') === currentMonth
            );
        }).length;

        // Clientes em dia (apenas ativos)
        const clientesEmDia = clients.filter(client => client.status !== 'inativo').length - clientesInadimplentes;

        res.json({
            faturamentoPrevisto,
            faturamentoArrecadado,
            faturamentoAno,
            clientesInadimplentes,
            clientesEmDia,
            totalClientes: clients.filter(client => client.status !== 'inativo').length,
            totalClientesInativos: clients.filter(client => client.status === 'inativo').length,
            mesAtual: currentMonth,
            anoAtual: currentYear
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 5.1. Dados para gráficos de faturamento mensal reais
app.get('/api/dashboard/monthly-revenue', async (req, res) => {
    try {
        const payments = await readPayments();
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Verificar se queremos dados diários
        const showDailyData = req.query.daily === 'true';
        
        // Verificar se temos um mês específico selecionado
        const selectedMonth = req.query.month ? parseInt(req.query.month) : null;
        const selectedYear = req.query.year ? parseInt(req.query.year) : null;
        
        // Determinar qual mês e ano usar
        const targetMonth = selectedMonth || currentMonth;
        const targetYear = selectedYear || currentYear;
        
        if (showDailyData) {
            // Agrupar por dia do mês selecionado (YYYY-MM-DD)
            const byDay = {};
            const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
            
            // Inicializar todos os dias do mês com zero
            for (let day = 1; day <= daysInMonth; day++) {
                const formattedDay = day.toString().padStart(2, '0');
                const key = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${formattedDay}`;
                byDay[key] = 0;
            }
            
            // Adicionar pagamentos aos dias correspondentes
            for (const p of payments) {
                const paymentDate = new Date(p.dataPagamento);
                const paymentMonth = paymentDate.getMonth() + 1;
                const paymentYear = paymentDate.getFullYear();
                
                // Apenas considerar pagamentos do mês selecionado
                if (paymentMonth === targetMonth && paymentYear === targetYear) {
                    const key = moment(p.dataPagamento).format('YYYY-MM-DD');
                    byDay[key] = (byDay[key] || 0) + (Number(p.valor) || 0);
                }
            }
            
            // Ordenar por dia
            const days = Object.keys(byDay).sort();
            const values = days.map(d => byDay[d]);
            
            res.json({ months: days, values });
        } else {
            // Comportamento original - agrupar por mês (YYYY-MM)
            const byMonth = {};
            for (const p of payments) {
                const key = moment(p.dataPagamento).format('YYYY-MM');
                if (!byMonth[key]) byMonth[key] = 0;
                byMonth[key] += Number(p.valor) || 0;
            }

            // Ordenar por mês
            const months = Object.keys(byMonth).sort();
            const values = months.map(m => byMonth[m]);

            res.json({ months, values });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 6. Enviar cobrança por email
app.post('/api/send-billing', async (req, res) => {
    try {
        const { clientId } = req.body;
        
        const clients = await readClients();
        const client = clients.find(c => c.id === clientId);
        
        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'seu-email@gmail.com',
            to: client.email,
            subject: 'Cobrança de Honorários - Sistema de Fluxo de Caixa',
            html: `
                <h2>Cobrança de Honorários</h2>
                <p>Prezado(a) <strong>${client.nome}</strong>,</p>
                <p>Informamos que está pendente o pagamento dos honorários referentes ao mês de <strong>${moment().format('MMMM/YYYY')}</strong>.</p>
                <p><strong>Valor: R$ ${client.honorariosMensais.toFixed(2)}</strong></p>
                <p>Por favor, realize o pagamento para manter sua conta em dia.</p>
                <p>Agradecemos sua atenção.</p>
                <br>
                <p>Atenciosamente,<br>Sistema de Fluxo de Caixa</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ message: 'Cobrança enviada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar cobrança' });
    }
});

// 7. Inativar cliente
app.post('/api/clients/:id/inactivate', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivoInativacao } = req.body;
        
        if (!motivoInativacao) {
            return res.status(400).json({ error: 'Motivo da inativação é obrigatório' });
        }

        const clients = await readClients();
        const clientIndex = clients.findIndex(c => c.id === id);
        
        if (clientIndex === -1) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Inativar cliente
        clients[clientIndex].status = 'inativo';
        clients[clientIndex].motivoInativacao = motivoInativacao;
        clients[clientIndex].dataInativacao = new Date().toISOString();

        await writeClients(clients);
        res.json({ message: 'Cliente inativado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 8. Obter histórico de honorários de um cliente
app.get('/api/clients/:id/historico-honorarios', async (req, res) => {
    try {
        const { id } = req.params;
        const clients = await readClients();
        const client = clients.find(c => c.id === id);
        
        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        const historico = client.historicoHonorarios || [];
        res.json(historico);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// 9. Enviar cobranças automáticas para todos os inadimplentes
async function sendAutomaticBillings() {
    try {
        const clients = await readClients();
        const payments = await readPayments();
        const currentMonth = moment().format('YYYY-MM');

        for (const client of clients) {
            // Pular clientes inativos
            if (client.status === 'inativo') continue;
            
            const hasPaymentThisMonth = payments.some(p => 
                p.clientId === client.id && 
                moment(p.dataPagamento).format('YYYY-MM') === currentMonth
            );

            if (!hasPaymentThisMonth) {
                // Enviar cobrança automática
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'seu-email@gmail.com',
                    to: client.email,
                    subject: 'Cobrança Automática - Honorários em Atraso',
                    html: `
                        <h2>Cobrança Automática de Honorários</h2>
                        <p>Prezado(a) <strong>${client.nome}</strong>,</p>
                        <p>Esta é uma cobrança automática para os honorários referentes ao mês de <strong>${moment().format('MMMM/YYYY')}</strong>.</p>
                        <p><strong>Valor: R$ ${client.honorariosMensais.toFixed(2)}</strong></p>
                        <p>Por favor, realize o pagamento para evitar a inadimplência.</p>
                        <p>Agradecemos sua atenção.</p>
                        <br>
                        <p>Atenciosamente,<br>Sistema de Fluxo de Caixa</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`Cobrança automática enviada para: ${client.email}`);
            }
        }
    } catch (error) {
        console.error('Erro ao enviar cobranças automáticas:', error);
    }
}

// Agendar envio de cobranças automáticas (todo dia 5 de cada mês às 9h)
cron.schedule('0 9 5 * *', () => {
    console.log('Executando cobranças automáticas...');
    sendAutomaticBillings();
});

// Rota para teste manual das cobranças automáticas
app.post('/api/run-automatic-billing', async (req, res) => {
    try {
        await sendAutomaticBillings();
        res.json({ message: 'Cobranças automáticas executadas com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao executar cobranças automáticas' });
    }
});

// Inicializar sistema
async function initializeSystem() {
    await ensureDataDirectory();
    await initializeDataFiles();
    console.log('Sistema inicializado com sucesso!');
}

// API para contas a pagar
app.get('/api/bills', async (req, res) => {
    try {
        const bills = await readBills();
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/bills', async (req, res) => {
    try {
        const { descricao, valor, dataVencimento, categoria, status, observacoes } = req.body;
        
        if (!descricao || !valor || !dataVencimento || !categoria) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const bills = await readBills();
        
        const newBill = {
            id: Date.now().toString(),
            descricao,
            valor: parseFloat(valor),
            dataVencimento,
            dataPagamento: status === 'pago' ? new Date().toISOString() : null,
            categoria,
            status: status || 'pendente',
            recorrente: false,
            observacoes: observacoes || ''
        };
        
        bills.push(newBill);
        await writeBills(bills);
        
        res.status(201).json(newBill);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/bills/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, valor, dataVencimento, categoria, status, observacoes } = req.body;
        
        if (!descricao || !valor || !dataVencimento || !categoria) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const bills = await readBills();
        const billIndex = bills.findIndex(b => b.id === id);
        
        if (billIndex === -1) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        bills[billIndex] = {
            ...bills[billIndex],
            descricao,
            valor: parseFloat(valor),
            dataVencimento,
            categoria,
            status: status || 'pendente',
            observacoes: observacoes || ''
        };

        await writeBills(bills);
        res.json(bills[billIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/bills/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bills = await readBills();
        
        const billIndex = bills.findIndex(b => b.id === id);
        if (billIndex === -1) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        bills.splice(billIndex, 1);
        await writeBills(bills);

        res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Iniciar servidor
app.listen(PORT, async () => {
    await initializeSystem();
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
