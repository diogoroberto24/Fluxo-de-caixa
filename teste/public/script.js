// Configuração da API
const API_BASE_URL = 'http://localhost:3002/api';

// Estado da aplicação
const appState = {
    clients: [],
    payments: [],
    bills: [],
    editingClientId: null,
    editingBillId: null,
    inactivatingClientId: null,
    manualPaymentClientId: null,
    nextClientId: 1,
    faturamentoChart: null,
    dashboardData: null,
};

// Mapeamento dos modais para facilitar o controle
const modalElements = {
    client: document.getElementById('client-modal'),
    payment: document.getElementById('payment-modal'),
    manualPayment: document.getElementById('manual-payment-modal'),
    inactivateClient: document.getElementById('inactivate-client-modal'),
    honorariosHistory: document.getElementById('honorarios-history-modal'),
    inactiveClients: document.getElementById('inactive-clients-modal'),
    bill: document.getElementById('bill-modal'),
    clientDetails: document.getElementById('client-details-modal'),
    confirm: document.getElementById('confirm-modal'),
    billsToPay: document.getElementById('bills-to-pay-modal'),
    clientsList: document.getElementById('clients-list-modal'),
};

// --- FUNÇÕES DE INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando aplicação...');

    // Inicializar a aplicação
    initializeApp();

    // Garantir que o gráfico seja inicializado após o carregamento completo da página
    setTimeout(() => {
        console.log('Inicializando gráfico após carregamento completo da página');
        initializeChart();
        updateChart();

        // Forçar a navegação para o dashboard para garantir que tudo seja carregado corretamente
        const dashboardButton = document.querySelector('.nav-btn[data-tab="dashboard"]');
        if (dashboardButton) {
            console.log('Forçando clique no botão do dashboard');
            dashboardButton.click(); // Isso vai chamar handleNavigation
        } else {
            console.error('Botão do dashboard não encontrado');
        }

        // Adicionar evento de clique direto para o botão de clientes
        const clientsButton = document.querySelector('.nav-btn[data-tab="clients"]');
        if (clientsButton) {
            clientsButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Evento de clique direto no botão de clientes');
                
                // Remover classe ativa de todos os botões
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                
                // Adicionar classe ativa ao botão de clientes
                clientsButton.classList.add('active');
                
                // Esconder todas as abas
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                    tab.style.display = 'none';
                });
                
                // Mostrar a aba de clientes
                const clientsTab = document.getElementById('clients');
                if (clientsTab) {
                    clientsTab.classList.add('active');
                    clientsTab.style.display = 'block';
                    clientsTab.style.visibility = 'visible';
                    clientsTab.style.opacity = '1';
                    console.log('Aba de clientes exibida com sucesso');
                } else {
                    console.error('Aba de clientes não encontrada');
                }
            }, true);
        }
    }, 2000);
});

async function initializeApp() {
    setupEventListeners();
    await loadAllData();
    updateNextClientId();
    setCurrentDate();
    
    // Garantir que todos os botões sejam clicáveis
    makeAllButtonsClickable();

    // Inicializar gráfico diretamente após o carregamento dos dados
    initializeChart();
    // Atualizar o gráfico com os dados carregados
    if (appState.faturamentoMensal) {
        updateChart(appState.faturamentoMensal);
    }
}

function setupEventListeners() {
    console.log('Configurando event listeners...');

    // Navegação
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log(`Encontrados ${navButtons.length} botões de navegação`);

    // Adicionar event listeners para todos os botões de navegação
    navButtons.forEach(button => {
        // Remover qualquer event listener 'click' existente para evitar duplicação
        button.removeEventListener('click', handleNavigation);
        
        // Adiciona o listener principal de navegação
        button.addEventListener('click', handleNavigation);
    });
    
    // Garantir que todos os botões dentro das seções também sejam clicáveis
    document.querySelectorAll('button:not(.nav-btn)').forEach(button => {
        if (button.onclick === null && button.getAttribute('onclick') === null) {
            console.log('Adicionando event listener para botão:', button);
            button.addEventListener('click', function(event) {
                console.log('Botão clicado:', button);
                // Se o botão tem um ID, podemos usar isso para identificar a ação
                const buttonId = button.id;
                if (buttonId) {
                    console.log('ID do botão clicado:', buttonId);
                }
            });
        }
    });
    
    // Garantir que todos os botões sejam clicáveis
    makeAllButtonsClickable();
    
    // Adicionar evento específico para o botão de clientes
    const clientsButton = document.querySelector('.nav-btn[data-tab="clients"]');
    if (clientsButton) {
        clientsButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Botão de clientes clicado diretamente');
            
            // Remover classe ativa de todos os botões
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe ativa ao botão de clientes
            clientsButton.classList.add('active');
            
            // Esconder todas as abas
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
                tab.style.display = 'none';
            });
            
            // Mostrar a aba de clientes
            const clientsSection = document.getElementById('clients');
            if (clientsSection) {
                clientsSection.classList.add('active');
                clientsSection.style.display = 'block';
                clientsSection.style.visibility = 'visible';
                clientsSection.style.opacity = '1';
                
                // Forçar a renderização da tabela de clientes
                renderClientsTable(appState.clients);
                
                console.log('Aba de clientes exibida com sucesso');
            } else {
                console.error('Aba de clientes não encontrada');
            }
        });
        console.log('Event listener personalizado adicionado ao botão de clientes');
    }

    // Garantir que o botão do dashboard esteja ativo inicialmente (será tratado por handleNavigation.click())
    // const dashboardButton = document.querySelector('.nav-btn[data-tab="dashboard"]');
    // if (dashboardButton) {
    //     dashboardButton.classList.add('active');
    // }

    // Submissão de Formulários
    document.getElementById('client-form').addEventListener('submit', handleClientSubmit);
    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);
    document.getElementById('bill-form').addEventListener('submit', handleBillSubmit);

    // Botões de Ação
    document.getElementById('bills-to-pay-button').addEventListener('click', () => openModal('billsToPay'));
    document.getElementById('close-bills-modal').addEventListener('click', () => closeModal('billsToPay'));

    // Fechar modais ao clicar fora ou com a tecla ESC
    window.addEventListener('click', (event) => {
        for (const key in modalElements) {
            if (event.target === modalElements[key]) {
                closeModal(key);
            }
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            for (const key in modalElements) {
                closeModal(key);
            }
        }
    });

    console.log('Event listeners configurados com sucesso');
}

async function loadAllData() {
    try {
        const [dashboardData, clientsData, paymentsData, billsData] = await Promise.all([
            makeApiRequest('/dashboard'),
            makeApiRequest('/clients'),
            makeApiRequest('/payments'),
            makeApiRequest('/bills')
        ]);

        appState.clients = clientsData;
        appState.payments = paymentsData;
        appState.bills = billsData;
        appState.dashboardData = dashboardData;

        updateDashboard(dashboardData);
        renderClientsTable(appState.clients);
        renderPaymentsTable(appState.payments);
        renderBillsTable(appState.bills);
        loadClientsForContracts();
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showNotification('Erro ao carregar dados. Verifique a conexão com a API.', 'error');
    }
}

// --- FUNÇÕES UTILITÁRIAS E GERAIS ---

// Função para garantir que todos os botões sejam clicáveis
function makeAllButtonsClickable() {
    console.log('Tornando todos os botões clicáveis...');
    document.querySelectorAll('button').forEach(button => {
        button.style.pointerEvents = 'auto !important';
        button.style.cursor = 'pointer !important';
        button.style.zIndex = '1000';
        button.style.position = 'relative';
        
        // Adicionar evento de clique para botões sem onclick
        if (button.onclick === null && button.getAttribute('onclick') === null && !button.classList.contains('nav-btn')) {
            button.addEventListener('click', function(event) {
                console.log('Botão clicado:', button);
                // Se o botão tem um ID, podemos usar isso para identificar a ação
                const buttonId = button.id;
                if (buttonId) {
                    console.log('ID do botão clicado:', buttonId);
                }
            });
        }
        
        // Verificar se é o botão de clientes e adicionar tratamento especial
        if (button.getAttribute('data-tab') === 'clients') {
            console.log('Configurando botão de clientes especificamente');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clique no botão de clientes detectado');
                
                // Forçar a exibição da aba de clientes
                const clientsTab = document.getElementById('clients');
                if (clientsTab) {
                    // Esconder todas as abas primeiro
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                        tab.style.display = 'none';
                        tab.style.visibility = 'hidden';
                        tab.style.opacity = '0';
                    });
                    
                    // Exibir a aba de clientes
                    clientsTab.classList.add('active');
                    clientsTab.style.display = 'block';
                    clientsTab.style.visibility = 'visible';
                    clientsTab.style.opacity = '1';
                    clientsTab.style.zIndex = '10';
                    
                    // Atualizar o estado dos botões de navegação
                    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Forçar a renderização da tabela de clientes
                    renderClientsTable(appState.clients);
                    
                    console.log('Aba de clientes exibida com sucesso via makeAllButtonsClickable');
                } else {
                    console.error('Aba de clientes não encontrada em makeAllButtonsClickable');
                }
            }, true);
        }
    });
}

async function makeApiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') ? response.json() : response.text();
}

function openModal(modalName) {
    const modal = modalElements[modalName];
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalName) {
    const modal = modalElements[modalName];
    if (modal) {
        modal.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    notification.innerHTML = `<div class="notification-content"><i class="fas ${iconClass}"></i><span>${message}</span></div>`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// --- FUNÇÕES DE NAVEGAÇÃO E RECARGA ---

// Função de navegação melhorada para garantir que todos os botões funcionem
function handleNavigation(event) {
    event.preventDefault();
    console.log('Função handleNavigation chamada');

    // Obter o ID do alvo
    const targetTab = event.currentTarget.getAttribute('data-tab');
    console.log('Target Tab:', targetTab);

    if (!targetTab) {
        console.error('Botão sem atributo data-tab');
        return;
    }
    
    // Depuração adicional
    console.log('Verificando se o elemento alvo existe:', document.getElementById(targetTab));
    console.log('Todos os elementos tab-content:', document.querySelectorAll('.tab-content').length);
    
    // Listar todos os elementos tab-content e seus IDs
    document.querySelectorAll('.tab-content').forEach(el => {
        console.log('Tab content ID:', el.id);
    });

    // Remover classe ativa de todos os botões de navegação
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Garantir que todos os botões dentro das seções sejam clicáveis
    document.querySelectorAll('button').forEach(button => {
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        button.style.zIndex = '100';
        button.style.position = 'relative';
    });

    // Adicionar classe ativa ao botão clicado
    event.currentTarget.classList.add('active');

    // Remover classe ativa de todas as abas e escondê-las
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; // Forçar o escondimento via CSS
        content.style.visibility = 'hidden'; // Garantir que não seja visível
        content.style.opacity = '0'; // Garantir que não seja visível
    });

    // Adicionar classe ativa à aba alvo e exibi-la
    const targetContent = document.getElementById(targetTab);
    if (targetContent) {
        console.log(`Exibindo a aba ${targetTab}`);
        targetContent.classList.add('active');
        targetContent.style.display = 'block'; // Forçar a exibição via CSS
        targetContent.style.visibility = 'visible'; // Garantir que seja visível
        targetContent.style.opacity = '1'; // Garantir que seja visível
        targetContent.style.zIndex = '10'; // Garantir que esteja acima de outros elementos
        void targetContent.offsetWidth; // Forçar um reflow
        
        // Se estiver navegando para a aba de clientes, forçar a renderização da tabela
        if (targetTab === 'clients') {
            console.log('Forçando renderização da tabela de clientes');
            renderClientsTable(appState.clients);
        }
    } else {
        console.error(`Elemento alvo #${targetTab} não encontrado`);
    }

    // Se estiver navegando para o dashboard, atualizar os dados e o gráfico
    if (targetTab === 'dashboard') {
        console.log('Navegando para o dashboard, atualizando dados e gráfico');
        updateDashboard(appState.dashboardData); // Passa os dados do dashboard que já foram carregados
        // Reinicializar o gráfico após um atraso maior para garantir que o DOM esteja pronto
        setTimeout(() => {
            console.log('Reinicializando o gráfico após navegação');
            initializeChart();
            updateChart();
        }, 1000);
    }
}

async function reloadAndNotify(message, type = 'success') {
    await loadAllData();
    showNotification(message, type);
}

// --- FUNÇÕES DE DASHBOARD ---

function updateDashboard(data) {
    // Verifica se 'data' é válido antes de tentar acessar suas propriedades
    if (!data) {
        console.warn('Dados do dashboard não disponíveis para atualização.');
        return;
    }

    document.getElementById('faturamento-previsto').textContent = formatCurrency(data.faturamentoPrevisto || 0);
    document.getElementById('faturamento-arrecadado').textContent = formatCurrency(data.faturamentoArrecadado || 0);
    document.getElementById('faturamento-ano').textContent = formatCurrency(data.faturamentoAno || 0);
    document.getElementById('total-clientes').textContent = data.totalClientes || 0;
    document.getElementById('clientes-inadimplentes').textContent = data.clientesInadimplentes || 0;
    document.getElementById('clientes-em-dia').textContent = data.clientesEmDia || 0;

    // Carregar contas a pagar próximas
    loadBillsToPay();

    // Carregar pagamentos recentes
    loadRecentPayments();

    // Atualizar gráfico
    updateChart();
}

// Helper para renderizar listas no dashboard
function renderList(container, data, renderItem, noDataMessage) {
    container.innerHTML = '';
    if (data && data.length > 0) {
        data.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `${container.id.includes('bills') ? 'bill-item' : 'payment-item'}`;
            itemElement.innerHTML = renderItem(item);
            container.appendChild(itemElement);
        });
    } else {
        container.innerHTML = `<div class="no-data">${noDataMessage}</div>`;
    }
}

function initializeChart() {
    console.log('Iniciando inicialização do gráfico...');

    // Verificar se o Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está disponível. Verifique se a biblioteca foi carregada corretamente.');
        // Tentar carregar o Chart.js dinamicamente
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function() {
            console.log('Chart.js carregado dinamicamente');
            setTimeout(() => {
                initializeChartImplementation();
            }, 500);
        };
        document.head.appendChild(script);
        return;
    }

    // Adicionar um pequeno atraso para garantir que o DOM esteja pronto
    setTimeout(() => {
        initializeChartImplementation();
    }, 500);
}

function initializeChartImplementation() {
    console.log('Implementando inicialização do gráfico...');

    // Primeiro, vamos limpar o container do gráfico
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
        console.error('Container do gráfico não encontrado');
        return;
    }

    console.log('Container do gráfico encontrado:', chartContainer);

    // Remover o canvas antigo
    chartContainer.innerHTML = '';

    // Criar um novo canvas
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'faturamentoChart';
    newCanvas.width = 800;
    newCanvas.height = 400;
    newCanvas.style.display = 'block';
    newCanvas.style.width = '100%';
    newCanvas.style.height = '350px';
    newCanvas.style.zIndex = '20';

    // Adicionar o novo canvas ao container
    chartContainer.appendChild(newCanvas);

    console.log('Novo canvas criado e adicionado ao DOM');

    // Forçar um reflow para garantir que o canvas seja renderizado corretamente
    void chartContainer.offsetWidth;

    // Obter o contexto do novo canvas
    const ctx = newCanvas.getContext('2d');
    if (!ctx) {
        console.error('Não foi possível obter o contexto 2D do canvas');
        return;
    }

    console.log('Contexto 2D obtido com sucesso');

    // Destruir o gráfico anterior se existir
    if (appState.faturamentoChart) {
        console.log('Destruindo gráfico anterior...');
        appState.faturamentoChart.destroy();
        appState.faturamentoChart = null;
    }

    try {
        console.log('Criando novo gráfico...');

        // Dados de exemplo para garantir que o gráfico tenha conteúdo
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dadosExemplo = [1000, 1500, 2000, 1800, 2200, 2500, 2300, 2100, 2400, 2600, 2800, 3000];

        // Criar o gráfico com configurações atualizadas
        appState.faturamentoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Faturamento Mensal',
                    data: dadosExemplo,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { callback: (value) => `R$ ${value.toLocaleString('pt-BR')}` } } },
                plugins: { tooltip: { callbacks: { label: (context) => `R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } } }
            }
        });
        console.log('Gráfico inicializado com sucesso');

        // Forçar atualização do gráfico
        appState.faturamentoChart.update();

        // Adicionar um log para verificar se o gráfico foi criado corretamente
        console.log('Gráfico criado:', appState.faturamentoChart);
    } catch (error) {
        console.error('Erro ao inicializar o gráfico:', error);
    }
}

function updateChart() {
    if (!appState.faturamentoChart) return;

    // Obter dados de faturamento mensal da API
    makeApiRequest('/dashboard/monthly-revenue')
        .then(data => {
            const months = data.months || [];
            const values = data.values || [];

            // Formatar labels para exibição
            const labels = months.map(month => {
                const date = new Date(month + '-01');
                return date.toLocaleDateString('pt-BR', { month: 'short' });
            });

            appState.faturamentoChart.data.labels = labels;
            appState.faturamentoChart.data.datasets[0].data = values;
            appState.faturamentoChart.update();

            // Atualizar resumo do gráfico
            updateChartSummary(values, months);
        })
        .catch(error => {
            console.error('Erro ao carregar dados do gráfico:', error);
        });
}

// --- FUNÇÕES DE CLIENTES ---

function renderClientsTable(clients) {
    const tableBody = document.getElementById('clients-table-body');
    tableBody.innerHTML = '';

    const activeClients = clients.filter(c => c.status !== 'inativo');
    if (activeClients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhum cliente cadastrado</td></tr>';
        return;
    }

    activeClients.forEach(client => {
        const row = document.createElement('tr');
        row.className = `status-${client.status}`;
        const modulosDisplay = client.modulos?.length > 0 ? `<span class="module-count">${client.modulos.length} módulo(s)</span>` : '<span class="no-data">-</span>';
        const statusText = client.status === 'em-dia' ? 'Em Dia' : 'Inadimplente';

        row.innerHTML = `
            <td><input type="checkbox" class="client-checkbox" data-id="${client.id}"></td>
            <td>${String(client.id).padStart(3, '0')}</td>
            <td>${client.nome}</td>
            <td>${client.cnpjCpf || '-'}</td>
            <td>${modulosDisplay}</td>
            <td>${formatCurrency(client.honorariosMensais)}</td>
            <td><span class="status-badge status-${client.status}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn details" onclick="showClientDetails('${client.id}')"><i class="fas fa-eye"></i> Ver Detalhes</button>
                    <button class="action-btn edit" onclick="editClient('${client.id}')"><i class="fas fa-edit"></i> Editar</button>
                    <button class="action-btn payment" onclick="openManualPaymentModal('${client.id}')"><i class="fas fa-money-bill-wave"></i> Pagamento</button>
                    <button class="action-btn inactivate" onclick="openInactivateClientModal('${client.id}')"><i class="fas fa-user-slash"></i> Inativar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openClientModal() {
    document.getElementById('client-form').reset();
    document.querySelector('#client-modal .modal-header h3').textContent = 'Novo Cliente';
    appState.editingClientId = null;
    openModal('client');
}

function editClient(clientId) {
    const client = appState.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById('nome').value = client.nome;
    document.getElementById('cnpjCpf').value = client.cnpjCpf || '';
    document.getElementById('enderecoCnpj').value = client.enderecoCnpj || '';
    document.getElementById('tipoTributacao').value = client.tipoTributacao || '';
    document.getElementById('email').value = client.email;
    document.getElementById('telefone').value = client.telefone;
    document.getElementById('honorariosMensais').value = client.honorariosMensais;
    document.getElementById('socios').value = client.socios || '';

    // Limpar checkboxes existentes
    document.querySelectorAll('input[name="modulos"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Marcar módulos do cliente
    if (client.modulos && client.modulos.length > 0) {
        client.modulos.forEach(modulo => {
            const checkbox = document.querySelector(`input[name="modulos"][value="${modulo}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    document.querySelector('#client-modal .modal-header h3').textContent = 'Editar Cliente';
    appState.editingClientId = clientId;
    openModal('client');
}

async function handleClientSubmit(event) {
    event.preventDefault();

    // Coletar módulos selecionados
    const modulosSelecionados = [];
    document.querySelectorAll('input[name="modulos"]:checked').forEach(checkbox => {
        modulosSelecionados.push(checkbox.value);
    });

    const clientData = {
        nome: document.getElementById('nome').value,
        cnpjCpf: document.getElementById('cnpjCpf').value,
        enderecoCnpj: document.getElementById('enderecoCnpj').value,
        tipoTributacao: document.getElementById('tipoTributacao').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        honorariosMensais: parseFloat(document.getElementById('honorariosMensais').value) || 0,
        modulos: modulosSelecionados,
        socios: document.getElementById('socios').value,
        status: 'em-dia'
    };

    try {
        if (appState.editingClientId) {
            await makeApiRequest(`/clients/${appState.editingClientId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
            await reloadAndNotify('Cliente atualizado com sucesso');
        } else {
            await makeApiRequest('/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
            await reloadAndNotify('Cliente cadastrado com sucesso');
        }
        closeModal('client');
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showNotification('Erro ao salvar cliente', 'error');
    }
}

function updateNextClientId() {
    if (appState.clients.length > 0) {
        const ids = appState.clients.map(client => parseInt(client.id));
        appState.nextClientId = Math.max(...ids) + 1;
    } else {
        appState.nextClientId = 1;
    }
}

function openInactivateClientModal(clientId) {
    const client = appState.clients.find(c => c.id === clientId);
    if (!client) return;
    appState.inactivatingClientId = clientId;
    openModal('inactivateClient');
}

async function inactivateClient() {
    if (!appState.inactivatingClientId) return;
    try {
        const motivoInativacao = document.getElementById('motivoInativacao').value;
        if (!motivoInativacao.trim()) {
            showNotification('Informe o motivo da inativação', 'error');
            return;
        }

        await makeApiRequest(`/clients/${appState.inactivatingClientId}/inactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivoInativacao })
        });
        await reloadAndNotify('Cliente inativado com sucesso');
        closeModal('inactivateClient');
    } catch (error) {
        console.error('Erro ao inativar cliente:', error);
        showNotification('Erro ao inativar cliente', 'error');
    }
}

function openInactiveClientsModal() {
    renderInactiveClientsTable();
    openModal('inactiveClients');
}

function renderInactiveClientsTable() {
    const content = document.getElementById('inactive-clients-content');
    if (!content) return;

    const inactiveClients = appState.clients.filter(c => c.status === 'inativo');

    if (inactiveClients.length === 0) {
        content.innerHTML = '<div class="no-data">Nenhum cliente inativo</div>';
        return;
    }

    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome/Razão Social</th>
                    <th>CNPJ/CPF</th>
                    <th>Honorários</th>
                    <th>Motivo Inativação</th>
                    <th>Data Inativação</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    inactiveClients.forEach(client => {
        tableHTML += `
            <tr>
                <td>${String(client.id).padStart(3, '0')}</td>
                <td>${client.nome}</td>
                <td>${client.cnpjCpf || '-'}</td>
                <td>${formatCurrency(client.honorariosMensais)}</td>
                <td>${client.motivoInativacao || '-'}</td>
                <td>${formatDate(client.dataInativacao)}</td>
                <td>
                    <button class="btn btn-primary" onclick="reactivateClient('${client.id}')">
                        <i class="fas fa-user-check"></i> Reativar
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    content.innerHTML = tableHTML;
}

async function reactivateClient(clientId) {
    try {
        const client = appState.clients.find(c => c.id === clientId);
        if (!client) return;
        client.status = 'em-dia';
        await makeApiRequest(`/clients/${clientId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(client) });
        await reloadAndNotify('Cliente reativado com sucesso');
        renderInactiveClientsTable();
    } catch (error) {
        console.error('Erro ao reativar cliente:', error);
        showNotification('Erro ao reativar cliente', 'error');
    }
}

// --- FUNÇÕES DE PAGAMENTOS ---

function renderPaymentsTable(payments) {
    const tableBody = document.getElementById('payments-table-body');
    tableBody.innerHTML = '';

    if (payments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhum pagamento registrado</td></tr>';
        return;
    }

    payments.sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro));
    payments.forEach(payment => {
        const client = appState.clients.find(c => c.id === payment.clientId);
        const clientName = client?.nome || 'Cliente não encontrado';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${clientName}</td>
            <td>${formatCurrency(payment.valor)}</td>
            <td>${formatDate(payment.dataPagamento)}</td>
            <td>${formatDate(payment.dataRegistro)}</td>
            <td>${payment.observacoes || '-'}</td>
            <td><button class="action-btn delete" onclick="confirmDeletePayment('${payment.id}')"><i class="fas fa-trash"></i> Excluir</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function openPaymentModal() {
    document.getElementById('payment-form').reset();

    const clientSelect = document.getElementById('clientId');
    clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
    const activeClients = appState.clients.filter(client => client.status !== 'inativo');
    activeClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.nome;
        clientSelect.appendChild(option);
    });

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dataPagamento').value = today;

    openModal('payment');
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    const paymentData = {
        clientId: document.getElementById('clientId').value,
        valor: parseFloat(document.getElementById('valor').value) || 0,
        dataPagamento: document.getElementById('dataPagamento').value,
        observacoes: document.getElementById('observacoes').value
    };

    if (!paymentData.clientId || paymentData.valor <= 0) {
        showNotification('Preencha os campos obrigatórios', 'error');
        return;
    }

    try {
        await makeApiRequest('/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentData) });
        await reloadAndNotify('Pagamento registrado com sucesso');
        closeModal('payment');
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        showNotification('Erro ao registrar pagamento', 'error');
    }
}

function openManualPaymentModal(clientId) {
    const client = appState.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById('manual-payment-client').value = client.nome;
    document.getElementById('manual-payment-value').value = client.honorariosMensais;
    document.getElementById('manual-payment-date').value = new Date().toISOString().split('T')[0];

    appState.manualPaymentClientId = clientId;
    openModal('manualPayment');
}

async function registerManualPayment() {
    if (!appState.manualPaymentClientId) return;

    const paymentData = {
        clientId: appState.manualPaymentClientId,
        valor: parseFloat(document.getElementById('manual-payment-value').value) || 0,
        dataPagamento: document.getElementById('manual-payment-date').value,
        observacoes: document.getElementById('manual-payment-notes').value
    };

    if (paymentData.valor <= 0) {
        showNotification('Informe um valor válido', 'error');
        return;
    }

    try {
        await makeApiRequest('/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentData) });
        await reloadAndNotify('Pagamento registrado com sucesso');
        closeModal('manualPayment');
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        showNotification('Erro ao registrar pagamento', 'error');
    }
}

function confirmDeletePayment(paymentId) {
    const payment = appState.payments.find(p => p.id === paymentId);
    const client = appState.clients.find(c => c.id === payment.clientId);
    const clientName = client?.nome || 'Cliente não encontrado';

    document.getElementById('confirm-message').textContent = `Tem certeza que deseja excluir o pagamento de ${formatCurrency(payment.valor)} do cliente ${clientName}?`;
    document.getElementById('confirm-action').onclick = () => deletePayment(paymentId);
    openModal('confirm');
}

async function deletePayment(paymentId) {
    try {
        await makeApiRequest(`/payments/${paymentId}`, { method: 'DELETE' });
        await reloadAndNotify('Pagamento excluído com sucesso');
        closeModal('confirm');
    } catch (error) {
        console.error('Erro ao excluir pagamento:', error);
        showNotification('Erro ao excluir pagamento', 'error');
    }
}

// --- FUNÇÕES DE CONTAS A PAGAR ---

function renderBillsTable(bills) {
    const tableBody = document.getElementById('bills-table');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (bills.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhuma conta a pagar cadastrada</td></tr>';
        return;
    }

    bills.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
    bills.forEach(bill => {
        const isPaid = bill.status === 'pago';
        const isOverdue = !isPaid && new Date(bill.dataVencimento) < new Date();
        const statusClass = isPaid ? 'pago' : isOverdue ? 'vencido' : 'pendente';
        const statusText = isPaid ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente';

        const row = document.createElement('tr');
        row.className = isPaid ? 'status-pago' : (isOverdue ? 'status-vencido' : '');

        row.innerHTML = `
            <td>${bill.descricao}</td>
            <td>${formatCurrency(bill.valor)}</td>
            <td>${formatDate(bill.dataVencimento)}</td>
            <td>${bill.categoria}</td>
            <td>${bill.recorrente ? 'Sim' : 'Não'}</td>
            <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    ${!isPaid ? `<button class="action-btn payment" onclick="markBillAsPaid('${bill.id}')"><i class="fas fa-check"></i> Pagar</button>` : ''}
                    <button class="action-btn edit" onclick="editBill('${bill.id}')"><i class="fas fa-edit"></i> Editar</button>
                    <button class="action-btn delete" onclick="confirmDeleteBill('${bill.id}')"><i class="fas fa-trash"></i> Excluir</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openBillModal() {
    document.getElementById('bill-form').reset();
    document.querySelector('#bill-modal .modal-header h3').textContent = 'Nova Conta a Pagar';
    appState.editingBillId = null;
    openModal('bill');
}

function editBill(billId) {
    const bill = appState.bills.find(b => b.id === billId);
    if (!bill) return;

    document.getElementById('billDescription').value = bill.descricao;
    document.getElementById('billValue').value = bill.valor;
    document.getElementById('billDueDate').value = bill.dataVencimento.split('T')[0];
    document.getElementById('billCategory').value = bill.categoria;
    document.getElementById('billRecurrent').value = bill.recorrente ? 'true' : 'false';
    document.getElementById('billNotes').value = bill.observacoes || '';

    document.querySelector('#bill-modal .modal-header h3').textContent = 'Editar Conta a Pagar';
    appState.editingBillId = billId;
    openModal('bill');
}

async function handleBillSubmit(event) {
    event.preventDefault();
    const billData = {
        descricao: document.getElementById('billDescription').value,
        valor: parseFloat(document.getElementById('billValue').value) || 0,
        dataVencimento: document.getElementById('billDueDate').value,
        categoria: document.getElementById('billCategory').value,
        status: 'pendente',
        observacoes: document.getElementById('billNotes').value
    };

    if (!billData.descricao || billData.valor <= 0 || !billData.categoria) {
        showNotification('Preencha os campos obrigatórios', 'error');
        return;
    }

    try {
        if (appState.editingBillId) {
            await makeApiRequest(`/bills/${appState.editingBillId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(billData) });
            await reloadAndNotify('Conta atualizada com sucesso');
        } else {
            await makeApiRequest('/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(billData) });
            await reloadAndNotify('Conta cadastrada com sucesso');
        }
        closeModal('bill');
    } catch (error) {
        console.error('Erro ao salvar conta:', error);
        showNotification('Erro ao salvar conta', 'error');
    }
}

async function markBillAsPaid(billId) {
    const bill = appState.bills.find(b => b.id === billId);
    if (!bill) return;
    try {
        bill.dataPagamento = new Date().toISOString().split('T')[0];
        await makeApiRequest(`/bills/${billId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bill) });
        await reloadAndNotify('Conta marcada como paga');
    } catch (error) {
        console.error('Erro ao marcar conta como paga:', error);
        showNotification('Erro ao marcar conta como paga', 'error');
    }
}

function confirmDeleteBill(billId) {
    const bill = appState.bills.find(b => b.id === billId);
    if (!bill) return;
    document.getElementById('confirm-message').textContent = `Tem certeza que deseja excluir a conta ${bill.descricao} no valor de ${formatCurrency(bill.valor)}?`;
    document.getElementById('confirm-action').onclick = () => deleteBill(billId);
    openModal('confirm');
}

async function deleteBill(billId) {
    try {
        await makeApiRequest(`/bills/${billId}`, { method: 'DELETE' });
        await reloadAndNotify('Conta excluída com sucesso');
        closeModal('confirm');
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        showNotification('Erro ao excluir conta', 'error');
    }
}

// --- FUNÇÕES DE DETALHES E RELATÓRIOS ---

function showClientsList(status) {
    // Filtrar clientes pelo status (em-dia ou inadimplente)
    const filteredClients = appState.clients.filter(client => client.status === status && client.status !== 'inativo');

    // Preparar o conteúdo do modal
    const modalTitle = status === 'em-dia' ? 'Clientes em Dia' : 'Clientes Inadimplentes';
    document.querySelector('#clients-list-modal .modal-header h3').textContent = modalTitle;

    // Criar a tabela de clientes
    const tableContainer = document.getElementById('clients-list-content');

    let tableHTML = `
        <table class="data-table clients-list-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome/Razão Social</th>
                    <th>CNPJ/CPF</th>
                    <th>Tipo Tributação</th>
                    <th>Módulos</th>
                    <th>Honorários</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (filteredClients.length === 0) {
        tableHTML += `<tr><td colspan="7" class="no-data">Nenhum cliente ${status === 'em-dia' ? 'em dia' : 'inadimplente'} encontrado</td></tr>`;
    } else {
        filteredClients.forEach(client => {
            // Formatar os módulos para exibição
            const modulos = client.modulos && client.modulos.length > 0
                ? client.modulos.map(m => `<span class="module-badge">${m}</span>`).join(' ')
                : '-';

            tableHTML += `
                <tr>
                    <td>${String(client.id).padStart(3, '0')}</td>
                    <td>${client.nome}</td>
                    <td>${client.cnpjCpf || '-'}</td>
                    <td>${client.tipoTributacao || '-'}</td>
                    <td>${modulos}</td>
                    <td>${formatCurrency(client.honorariosMensais)}</td>
                    <td>
                        <button class="action-btn details" onclick="showClientDetails('${client.id}')"><i class="fas fa-eye"></i> Detalhes</button>
                    </td>
                </tr>
            `;
        });
    }

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
    openModal('clientsList');
}

function closeClientsListModal() {
    closeModal('clientsList');
}

function showClientDetails(clientId) {
    const client = appState.clients.find(c => c.id === clientId);
    if (!client) return;

    const dataCadastro = new Date(client.dataCadastro);
    const hoje = new Date();
    const diferencaMeses = (hoje.getFullYear() - dataCadastro.getFullYear()) * 12 + hoje.getMonth() - dataCadastro.getMonth();
    const tempoCliente = diferencaMeses <= 0 ? 'Novo cliente' : diferencaMeses === 1 ? '1 mês' : diferencaMeses < 12 ? `${diferencaMeses} meses` : diferencaMeses === 12 ? '1 ano' : `${Math.floor(diferencaMeses / 12)} anos e ${diferencaMeses % 12} meses`;

    const modulosHTML = client.modulos?.length > 0 ? client.modulos.map(m => `<span class="module-badge">${m}</span>`).join('') : '<span class="no-data">Nenhum módulo contratado</span>';
    const historicoHTML = client.historicoHonorarios?.length > 0 ? [...client.historicoHonorarios].reverse().slice(0, 3).map(h => {
        const tipoTexto = h.tipo === 'cadastro' ? 'Cadastro inicial' : 'Alteração';
        const valorAnteriorTexto = h.valorAnterior ? `<span class="valor-anterior">${formatCurrency(h.valorAnterior)} → </span>` : '';
        return `<div class="historico-item"><div class="historico-data">${formatDate(h.dataAlteracao)}</div><div class="historico-tipo">${tipoTexto}</div><div class="historico-valor">${valorAnteriorTexto}${formatCurrency(h.valor)}</div></div>`;
    }).join('') : '<span class="no-data">Sem alterações de honorários</span>';

    const content = document.querySelector('#client-details-modal .client-details-content');
    content.innerHTML = `
        <div class="client-details-header">
            <div class="client-avatar"><i class="fas fa-user"></i></div>
            <div class="client-header-info">
                <h3>${client.nome}</h3>
                <div class="client-header-meta">
                    <span class="client-id-badge">ID: ${String(client.id).padStart(3, '0')}</span>
                    <span class="client-since">Cliente desde ${formatDate(client.dataCadastro)} (${tempoCliente})</span>
                </div>
            </div>
        </div>

        <div class="client-details-tabs">
            <button class="tab-btn active" onclick="switchClientDetailsTab('info', this)">Informações</button>
            <button class="tab-btn" onclick="switchClientDetailsTab('financeiro', this)">Financeiro</button>
            <button class="tab-btn" onclick="switchClientDetailsTab('modulos', this)">Módulos</button>
        </div>

        <div id="tab-info" class="client-details-tab-content active">
            <h4>Informações Básicas</h4>
            <div class="client-details-grid">
                <div class="client-detail-item">
                    <span class="detail-label">CNPJ/CPF:</span>
                    <span class="detail-value">${client.cnpjCpf || '-'}</span>
                </div>
                <div class="client-detail-item">
                    <span class="detail-label">Endereço:</span>
                    <span class="detail-value">${client.enderecoCnpj || '-'}</span>
                </div>
                <div class="client-detail-item">
                    <span class="detail-label">Tipo Tributação:</span>
                    <span class="detail-value">${client.tipoTributacao || '-'}</span>
                </div>
                <div class="client-detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${client.email || '-'}</span>
                </div>
                <div class="client-detail-item">
                    <span class="detail-label">Telefone:</span>
                    <span class="detail-value">${client.telefone || '-'}</span>
                </div>
                <div class="client-detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value"><span class="status-badge status-${client.status}">${client.status === 'em-dia' ? 'Em Dia' : client.status === 'inadimplente' ? 'Inadimplente' : 'Inativo'}</span></span>
                </div>
            </div>
            <div class="client-details-section">
                <h4>Sócios</h4>
                <p>${client.socios || '<span class="no-data">Nenhum sócio cadastrado</span>'}</p>
            </div>
        </div>

        <div id="tab-financeiro" class="client-details-tab-content">
            <h4>Resumo Financeiro</h4>
            <div class="financial-summary">
                <div class="financial-item">
                    <span class="financial-label">Honorários Mensais:</span>
                    <span class="financial-value">${formatCurrency(client.honorariosMensais)}</span>
                </div>
                <div class="financial-item">
                    <span class="financial-label">Status de Pagamento:</span>
                    <span class="financial-value"><span class="status-badge status-${client.status}">${client.status === 'em-dia' ? 'Em Dia' : client.status === 'inadimplente' ? 'Inadimplente' : 'Inativo'}</span></span>
                </div>
            </div>
            <div class="client-details-section">
                <h4>Mini Histórico de Honorários</h4>
                <div class="honorarios-mini-history">${historicoHTML}</div>
            </div>
        </div>

        <div id="tab-modulos" class="client-details-tab-content">
            <h4>Módulos Contratados</h4>
            <div class="client-modules-detail">${modulosHTML}</div>
        </div>

        <div class="client-details-actions">
            <button class="btn btn-primary" onclick="editClient('${client.id}')"><i class="fas fa-edit"></i> Editar Cliente</button>
            <button class="btn btn-secondary" onclick="openManualPaymentModal('${client.id}')"><i class="fas fa-money-bill-wave"></i> Registrar Pagamento</button>
        </div>
    `;

    openModal('clientDetails');
}

function switchClientDetailsTab(tabId, button) {
    document.querySelectorAll('.client-details-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.client-details-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    button.classList.add('active');
}

// Funções de Relatórios e Contratos
function generateReport() { showNotification('Funcionalidade em desenvolvimento', 'info'); }
function generateContract() { showNotification('Funcionalidade em desenvolvimento', 'info'); }
function viewContracts() { showNotification('Funcionalidade em desenvolvimento', 'info'); }

function loadClientsForContracts() {
    const clientSelect = document.getElementById('contract-client');
    if (!clientSelect) return;
    clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
    appState.clients.filter(c => c.status !== 'inativo').forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.nome;
        clientSelect.appendChild(option);
    });
}

// Funções auxiliares para dashboard
function loadBillsToPay() {
    const billsContainer = document.getElementById('bills-to-pay-list');
    if (!billsContainer) return;

    // Filtrar contas próximas do vencimento (próximos 7 dias)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBills = appState.bills.filter(bill => {
        if (bill.status === 'pago') return false;
        const dueDate = new Date(bill.dataVencimento);
        return dueDate >= today && dueDate <= nextWeek;
    });

    renderList(billsContainer, upcomingBills, (bill) => `
        <div class="bill-info">
            <div class="bill-title">${bill.descricao}</div>
            <div class="bill-date">${formatDate(bill.dataVencimento)}</div>
        </div>
        <div class="bill-amount">${formatCurrency(bill.valor)}</div>
    `, 'Nenhuma conta a pagar para os próximos 7 dias');
}

function loadRecentPayments() {
    const paymentsContainer = document.getElementById('recent-payments-list');
    if (!paymentsContainer) return;

    // Obter pagamentos dos últimos 7 dias
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentPayments = appState.payments.filter(payment => {
        const paymentDate = new Date(payment.dataPagamento);
        return paymentDate >= lastWeek;
    }).slice(0, 5); // Limitar a 5 pagamentos

    renderList(paymentsContainer, recentPayments, (payment) => {
        const client = appState.clients.find(c => c.id === payment.clientId);
        const clientName = client ? client.nome : 'Cliente não encontrado';
        return `
            <div class="payment-info">
                <div class="payment-title">${clientName}</div>
                <div class="payment-date">${formatDate(payment.dataPagamento)}</div>
            </div>
            <div class="payment-amount">${formatCurrency(payment.valor)}</div>
        `;
    }, 'Nenhum pagamento recente');
}

function updateChartSummary(values, months) {
    if (values.length === 0) return;

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);

    const maxMonth = months[maxIndex] ? new Date(months[maxIndex] + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '-';
    const minMonth = months[minIndex] ? new Date(months[minIndex] + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '-';

    document.getElementById('maiorFaturamento').textContent = formatCurrency(maxValue);
    document.getElementById('mesMaiorFaturamento').textContent = maxMonth;
    document.getElementById('menorFaturamento').textContent = formatCurrency(minValue);
    document.getElementById('mesMenorFaturamento').textContent = minMonth;
    document.getElementById('mediaFaturamento').textContent = formatCurrency(avgValue);
}

// Funções de dashboard
async function refreshDashboard() {
    try {
        const dashboardData = await makeApiRequest('/dashboard');
        updateDashboard(dashboardData);
        showNotification('Dashboard atualizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        showNotification('Erro ao atualizar dashboard', 'error');
    }
}

async function runAutomaticBilling() {
    try {
        await makeApiRequest('/run-automatic-billing', { method: 'POST' });
        showNotification('Cobranças automáticas executadas com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao executar cobranças automáticas:', error);
        showNotification('Erro ao executar cobranças automáticas', 'error');
    }
}

// Outras funções globais
function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', options);
}