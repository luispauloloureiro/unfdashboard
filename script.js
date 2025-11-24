// Global variables for charts
let playerChart = null;
let eventChart = null;
let refreshInterval = null;

// Google Spreadsheet ID and API key
const SPREADSHEET_ID = '1syWgN3zKEb8CDbeitotYNCG1NIILsJR1zzO5i4WjyVo';
const SHEET_NAME = 'MATRIZ'; // Using sheet name instead of GID for better reliability
const DATA_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Load data from Google Spreadsheet and process
  loadData();
  
  // Set up auto-refresh every 30 minutes (1800000 milliseconds)
  setupAutoRefresh();
  
  // Set up event listeners for filters
  document.getElementById('date-filter').addEventListener('change', filterData);
  document.getElementById('player-filter').addEventListener('change', filterData);
  document.getElementById('event-filter').addEventListener('change', filterData);
  document.getElementById('server-filter').addEventListener('change', filterData);
  
  // Set up refresh button
  document.getElementById('refresh-btn').addEventListener('click', function() {
    const refreshIcon = document.querySelector('.refresh-icon');
    refreshIcon.style.animation = 'spin 0.5s linear';
    loadData();
    setTimeout(() => {
      refreshIcon.style.animation = 'spin 2s linear infinite';
    }, 500);
  });
  
  // Add hover effects to chart action buttons
  const chartActionButtons = document.querySelectorAll('.chart-action-btn');
  chartActionButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from siblings
      this.parentElement.querySelectorAll('.chart-action-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      // Add active class to clicked button
      this.classList.add('active');
    });
  });
  
  // Add hover effects to table control buttons
  const tableControlButtons = document.querySelectorAll('.table-control-btn');
  tableControlButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from siblings
      this.parentElement.querySelectorAll('.table-control-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      // Add active class to clicked button
      this.classList.add('active');
    });
  });
});

// Set up auto-refresh every 30 minutes
function setupAutoRefresh() {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // Set new interval (30 minutes = 1800000 milliseconds)
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing dashboard data...');
    loadData();
  }, 1800000);
  
  console.log('Auto-refresh scheduled every 30 minutes');
}

// Load data from Google Spreadsheet
async function loadData() {
  try {
    console.log(`Buscando dados da aba "${SHEET_NAME}" em: ${DATA_URL}`);

    // Faz a requisição direta para o Google Sheets
    const response = await fetch(DATA_URL);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados do Google Sheets. Status: ${response.status}`);
    }

    const csvText = await response.text();
    console.log('CSV text length:', csvText.length);

    // Verifica se o conteúdo parece ser uma planilha restrita
    if (csvText.includes(' precisa de permissão') || 
        csvText.includes('restricted') || 
        csvText.includes('Sign in') ||
        csvText.includes('Não foi possível abrir') ||
        (csvText.includes('<html') && csvText.includes('accounts.google.com'))) {
      throw new Error('Planilha restrita - é necessário configurar permissões públicas');
    }

    // Converte o texto CSV em um array de objetos JSON que o dashboard entende
    const records = csvToArray(csvText);
    console.log('Records parsed:', records.length);
    
    // Process data and populate dashboard
    processData(records);
    
    // Update last refresh time
    updateLastRefreshTime();
    
  } catch (error) {
    console.error("Falha ao carregar e processar dados:", error);
    
    // Show error in the last refresh element
    const refreshElement = document.getElementById('last-refresh');
    if (refreshElement) {
      refreshElement.innerHTML = `
        <span style="color: #ff6b35;">
          ERRO: Falha ao carregar dados. A planilha está restrita.<br>
          Para corrigir: Abra a planilha no Google Sheets > Compartilhar > Publicar na web
        </span>
      `;
    }
    
    // Fallback to sample data if loading fails
    processData(sampleData);
  }
}

// Convert CSV data to our format
function csvToArray(csv) {
  const rows = csv.split('\n').filter(row => row.trim() !== '');
  if (rows.length === 0) return [];

  // Parse headers with proper CSV handling
  const headers = parseCSVLine(rows[0]);
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const values = parseCSVLine(rows[i]);
    const rowObject = {};
    
    for (let j = 0; j < headers.length && j < values.length; j++) {
      // Normalize header names to lowercase for consistency
      const normalizedHeader = headers[j].toLowerCase().trim();
      rowObject[normalizedHeader] = values[j];
    }
    
    // Only include rows that have some data (not completely empty)
    const hasData = Object.values(rowObject).some(value => value && value.trim() !== '');
    if (hasData) {
      data.push(rowObject);
    }
  }
  
  console.log(`CSV parsing completed. Total rows: ${rows.length}, Valid data rows: ${data.length}`);
  return data;
}

// Function to properly parse CSV lines (handling quoted values)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Sample data as fallback
const sampleData = [
  { servidor: "EU22", usuario: "romario2816", player: "-[150] UNF Kursliov", evento: "Guerra de castelo", print: "https://example.com/image1.png", data: "23/11/2025", hora: "17:46", observacao: "" },
  { servidor: "EU22", usuario: "romario2816", player: "-[150] UNF Kursliov", evento: "Stand", print: "https://example.com/image2.png", data: "19/11/2025", hora: "14:08", observacao: "" },
  { servidor: "EU22", usuario: "romario2816", player: "-[150] UNF Kursliov", evento: "Wb", print: "https://example.com/image3.png", data: "19/11/2025", hora: "15:07", observacao: "" },
  { servidor: "EU22", usuario: "romario2816", player: "-[150] UNF Kursliov", evento: "Stand", print: "https://example.com/image4.png", data: "19/11/2025", hora: "16:06", observacao: "" },
  { servidor: "EU22", usuario: "romario2816", player: "-[150] UNF Kursliov", evento: "Wb", print: "https://example.com/image5.png", data: "19/11/2025", hora: "17:10", observacao: "" }
];

// Process data and populate all dashboard elements
function processData(data) {
  // Calculate KPIs
  calculateKPIs(data);
  
  // Populate filters
  populateFilters(data);
  
  // Create charts
  createCharts(data);
  
  // Populate data table
  populateDataTable(data);
  
  // Log the number of records being processed
  console.log(`Processing ${data.length} records`);
}

// Calculate and display KPIs
function calculateKPIs(data) {
  // Total records
  document.getElementById('total-registros').textContent = data.length;
  
  // Total unique players
  const uniquePlayers = [...new Set(data.map(item => item.player || ''))].filter(p => p !== '').length;
  document.getElementById('total-jogadores').textContent = uniquePlayers;
  
  // Most frequent event
  const eventCounts = {};
  data.forEach(item => {
    const event = item.evento || '';
    if (event) {
      eventCounts[event] = (eventCounts[event] || 0) + 1;
    }
  });
  
  const mostFrequentEvent = Object.keys(eventCounts).reduce((a, b) => 
    eventCounts[a] > eventCounts[b] ? a : b, '-'
  );
  
  document.getElementById('evento-frequente').textContent = mostFrequentEvent || '-';
}

// Populate filter dropdowns
function populateFilters(data) {
  console.log(`Populating filters with ${data.length} records`);
  
  // Get unique values for each filter
  const uniqueDates = [...new Set(data.map(item => item.data || ''))].filter(d => d !== '');
  const uniquePlayers = [...new Set(data.map(item => item.player || ''))].filter(p => p !== '');
  const uniqueEvents = [...new Set(data.map(item => item.evento || ''))].filter(e => e !== '');
  const uniqueServers = [...new Set(data.map(item => item.servidor || ''))].filter(s => s !== '');
  
  console.log(`Filter values - Dates: ${uniqueDates.length}, Players: ${uniquePlayers.length}, Events: ${uniqueEvents.length}, Servers: ${uniqueServers.length}`);
  
  // Populate date filter
  const dateFilter = document.getElementById('date-filter');
  // Clear existing options except the first one
  dateFilter.innerHTML = '<option value="all">Todas as Datas</option>';
  uniqueDates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    dateFilter.appendChild(option);
  });
  
  // Populate player filter
  const playerFilter = document.getElementById('player-filter');
  // Clear existing options except the first one
  playerFilter.innerHTML = '<option value="all">Todos os Jogadores</option>';
  uniquePlayers.forEach(player => {
    const option = document.createElement('option');
    option.value = player;
    option.textContent = player;
    playerFilter.appendChild(option);
  });
  
  // Populate event filter
  const eventFilter = document.getElementById('event-filter');
  // Clear existing options except the first one
  eventFilter.innerHTML = '<option value="all">Todos os Eventos</option>';
  uniqueEvents.forEach(event => {
    const option = document.createElement('option');
    option.value = event;
    option.textContent = event;
    eventFilter.appendChild(option);
  });
  
  // Populate server filter
  const serverFilter = document.getElementById('server-filter');
  // Clear existing options except the first one
  serverFilter.innerHTML = '<option value="all">Todos os Servidores</option>';
  uniqueServers.forEach(server => {
    const option = document.createElement('option');
    option.value = server;
    option.textContent = server;
    serverFilter.appendChild(option);
  });
}

// Create charts using Chart.js
function createCharts(data) {
  // Player participation (bar chart)
  const playerCounts = {};
  data.forEach(item => {
    const player = item.player || '';
    if (player) {
      playerCounts[player] = (playerCounts[player] || 0) + 1;
    }
  });
  
  // Sort players by count and take top 10
  const sortedPlayers = Object.entries(playerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  const playerLabels = sortedPlayers.map(([player]) => player);
  const playerData = sortedPlayers.map(([,count]) => count);
  
  const playerCtx = document.getElementById('playerChart').getContext('2d');
  if (playerChart) playerChart.destroy(); // Destroy existing chart if it exists
  
  playerChart = new Chart(playerCtx, {
    type: 'bar',
    data: {
      labels: playerLabels,
      datasets: [{
        label: 'Participações',
        data: playerData,
        backgroundColor: '#ff6b35',
        borderColor: '#f7931e',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#252525',
          titleColor: '#f7931e',
          bodyColor: '#ffffff',
          borderColor: '#333333',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#33334d'
          },
          ticks: {
            color: '#b3b3b3'
          }
        },
        x: {
          grid: {
            color: '#33334d'
          },
          ticks: {
            color: '#b3b3b3',
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
  
  // Event frequency (doughnut chart)
  const eventCounts = {};
  data.forEach(item => {
    const event = item.evento || '';
    if (event) {
      eventCounts[event] = (eventCounts[event] || 0) + 1;
    }
  });
  
  const sortedEvents = Object.entries(eventCounts)
    .sort(([,a], [,b]) => b - a);
  
  const eventLabels = sortedEvents.map(([event]) => event);
  const eventData = sortedEvents.map(([,count]) => count);
  
  const eventCtx = document.getElementById('eventChart').getContext('2d');
  if (eventChart) eventChart.destroy(); // Destroy existing chart if it exists
  
  eventChart = new Chart(eventCtx, {
    type: 'doughnut',
    data: {
      labels: eventLabels,
      datasets: [{
        data: eventData,
        backgroundColor: [
          '#ff6b35', '#f7931e', '#ffd23f', '#ff4500', '#ff8c00',
          '#ffa500', '#ff6347', '#ff4500', '#ff7f50', '#ff6b35'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#b3b3b3',
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#252525',
          titleColor: '#f7931e',
          bodyColor: '#ffffff',
          borderColor: '#333333',
          borderWidth: 1
        }
      },
      cutout: '60%'
    }
  });
}

// Populate data table
function populateDataTable(data) {
  console.log(`Populating data table with ${data.length} records`);
  
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = ''; // Clear existing data
  
  // Limit to first 1000 records for performance if there are too many
  const displayData = data.length > 1000 ? data.slice(0, 1000) : data;
  const skippedCount = data.length - displayData.length;
  
  displayData.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.servidor || ''}</td>
      <td>${row.usuario || ''}</td>
      <td>${row.player || ''}</td>
      <td>${row.evento || ''}</td>
      <td>${row.data || ''}</td>
      <td>${row.hora || ''}</td>
      <td>${row.observacao || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  
  if (skippedCount > 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" style="text-align: center; font-style: italic;">... and ${skippedCount} more records</td>`;
    tbody.appendChild(tr);
  }
  
  console.log(`Data table populated with ${displayData.length} records`);
}

// Filter data based on selected filters
function filterData() {
  // Load data again to ensure we're working with fresh data
  loadData();
}

// Update the last refresh time display
function updateLastRefreshTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR');
  const dateString = now.toLocaleDateString('pt-BR');
  
  // If there's an element to show the last refresh time, update it
  const refreshElement = document.getElementById('last-refresh');
  if (refreshElement) {
    refreshElement.textContent = `Última atualização: ${dateString} às ${timeString}`;
  }
  
  console.log(`Dashboard updated at: ${dateString} ${timeString}`);
}