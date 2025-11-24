// =======================================================================
// VARIÁVEIS DE CONFIGURAÇÃO (Confirmadas pela sua URL)
// =======================================================================

// ID da Planilha: 1syWgN3zKEb8CDbeitotYNCG1NIILsJR1zzO5i4WjyVo
const SHEET_ID = '1syWgN3zKEb8CDbeitotYNCG1NIILsJR1zzO5i4WjyVo';
// ID da aba MATRIZ: 0
const GID = '0'; 

// URL para exportar a aba MATRIZ como CSV (Fonte de dados em tempo real)
const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;


// =======================================================================
// FUNÇÃO PRINCIPAL DE CARREGAMENTO DE DADOS (Nova versão)
// =======================================================================

async function loadData() {
    try {
        console.log(`Buscando dados em: ${DATA_URL}`);

        // Faz a requisição direta para o Google Sheets
        const response = await fetch(DATA_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar dados do Google Sheets. Status: ${response.status}`);
        }

        const csvText = await response.text();

        // Converte o texto CSV em um array de objetos JSON que o dashboard entende
        const records = csvToArray(csvText);

        // Chama a sua função de processamento com TODOS os dados atualizados
        processData(records);
        
        // Exemplo: Atualiza a informação de última atualização (se houver o elemento)
        const refreshElement = document.getElementById('last-refresh');
        if (refreshElement) {
            const now = new Date();
            refreshElement.textContent = `Atualizado: ${now.toLocaleTimeString('pt-BR')}`;
        }
        
    } catch (error) {
        console.error("Falha ao carregar e processar dados:", error);
        document.getElementById('dashboard-title').innerText = 'ERRO: Falha ao carregar dados. Planilha Restrita?';
    }
}

// =======================================================================
// FUNÇÃO UTILITÁRIA CSV TO ARRAY
// =======================================================================

// Esta função converte o formato CSV (texto) em um formato que seu JavaScript usa.
function csvToArray(csv) {
    const rows = csv.split('\n').filter(row => row.trim() !== '');
    if (rows.length === 0) return [];

    const headers = rows[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(value => value.trim().replace(/"/g, ''));
        const rowObject = {};
        
        for (let j = 0; j < headers.length && j < values.length; j++) {
            rowObject[headers[j]] = values[j];
        }
        data.push(rowObject);
    }
    return data;
}

// =======================================================================
// INICIALIZAÇÃO
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    // MANTENHA AQUI O RESTANTE DO SEU CÓDIGO ORIGINAL (FILTROS, CHART.JS, etc.)
    // ...
});

// ********** COLOQUE O RESTO DO SEU CÓDIGO ORIGINAL (processData, filterData, etc.) AQUI ABAIXO **********
// ...