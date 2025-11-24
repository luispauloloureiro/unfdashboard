// Global variables for charts
let playerChart = null;
let eventChart = null;
let refreshInterval = null;
let currentData = []; // Store the current data for filtering
let currentPeriod = 'total'; // Default period
let currentPage = 1; // Current page for pagination
let rowsPerPage = 50; // Number of rows per page
let currentRankingPeriod = 'total'; // Default period for ranking
let searchFilters = {
  player: '',
  event: '',
  server: ''
};

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
  
  // Set up search input event listeners
  document.getElementById('player-search').addEventListener('input', handleSearch);
  document.getElementById('event-search').addEventListener('input', handleSearch);
  document.getElementById('server-search').addEventListener('input', handleSearch);
  
  // Add event listeners for period buttons in detailed registration
  const detailedPeriodButtons = document.querySelectorAll('.detailed-container .period-btn');
  detailedPeriodButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all period buttons in detailed registration
      detailedPeriodButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      // Update the current period
      currentPeriod = this.getAttribute('data-period');
      
      // Reset to first page when changing periods
      currentPage = 1;
      
      // Update the table display
      if (currentData.length > 0) {
        populateDataTables(currentData);
      }
    });
  });
  
  // Add event listeners for period buttons in ranking
  const rankingPeriodButtons = document.querySelectorAll('.ranking-container .period-btn');
  rankingPeriodButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all period buttons in ranking
      rankingPeriodButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      // Update the current ranking period
      currentRankingPeriod = this.getAttribute('data-period');
      
      // Update the ranking table display
      if (currentData.length > 0) {
        populateRankingTable(currentData);
      }
    });
  });
});

// Handle search input changes
function handleSearch(event) {
  const searchId = event.target.id;
  const searchValue = event.target.value.toLowerCase();
  
  // Update the search filters
  if (searchId === 'player-search') {
    searchFilters.player = searchValue;
  } else if (searchId === 'event-search') {
    searchFilters.event = searchValue;
  } else if (searchId === 'server-search') {
    searchFilters.server = searchValue;
  }
  
  // Reset to first page when search changes
  currentPage = 1;
  
  // Update the detailed table display
  if (currentData.length > 0) {
    populateDetailedTable(currentData);
  }
}

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
    console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);

    // Faz a requisição direta para o Google Sheets
    const response = await fetch(DATA_URL);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados do Google Sheets. Status: ${response.status}`);
    }

    const csvText = await response.text();
    console.log('CSV text length:', csvText.length);
    
    // Log first 500 characters for debugging
    console.log('First 500 chars of CSV:', csvText.substring(0, 500));

    // Verifica se o conteúdo parece ser uma planilha restrita
    if (csvText.includes(' precisa de permissão') || 
        csvText.includes('restricted') || 
        csvText.includes('Sign in') ||
        csvText.includes('Não foi possível abrir') ||
        (csvText.includes('<html') && csvText.includes('accounts.google.com'))) {
      throw new Error('Planilha restrita - é necessário configurar permissões públicas');
    }
    
    // Check if we got actual data or just headers
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    console.log('Total rows in CSV:', rows.length);
    if (rows.length <= 1) {
      console.warn('CSV contains only headers or is empty');
    }

    // Converte o texto CSV em um array de objetos JSON que o dashboard entende
    const records = csvToArray(csvText);
    console.log('Records parsed:', records.length);
    
    // Check if we have actual data
    if (records.length === 0) {
      console.warn('No valid records found after parsing');
    }
    
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
    console.log("Falling back to sample data");
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
  console.log(`Processing data with ${data.length} records`);
  
  // Store the current data for filtering
  currentData = [...data];
  
  // Log first few records for debugging
  if (data.length > 0) {
    console.log('First 3 records:', data.slice(0, 3));
  }
  
  // Calculate KPIs
  calculateKPIs(data);
  
  // Populate filters
  populateFilters(data);
  
  // Create charts
  createCharts(data);
  
  // Populate data tables
  populateDataTables(data);
  
  // Log the number of records being processed
  console.log(`Processing ${data.length} records`);
}

// Calculate and display KPIs
function calculateKPIs(data) {
  console.log(`Calculating KPIs with ${data.length} records`);
  
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
  
  console.log(`KPIs calculated - Total: ${data.length}, Unique Players: ${uniquePlayers}, Most Frequent Event: ${mostFrequentEvent}`);
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

// Populate data tables
function populateDataTables(data) {
  console.log(`Populating data tables with ${data.length} records for period: ${currentPeriod}`);
  
  // Populate detailed registration table
  populateDetailedTable(data);
  
  // Populate ranking table
  populateRankingTable(data);
}

function populateDetailedTable(data) {
  const tbody = document.querySelector('#detailedTable tbody');
  tbody.innerHTML = ''; // Clear existing data
  
  // Filter data based on the current period
  let filteredData = filterDataByPeriod(data, currentPeriod);
  
  // Apply search filters
  if (searchFilters.player) {
    filteredData = filteredData.filter(item => 
      item.player && item.player.toLowerCase().includes(searchFilters.player)
    );
  }
  
  if (searchFilters.event) {
    filteredData = filteredData.filter(item => 
      item.evento && item.evento.toLowerCase().includes(searchFilters.event)
    );
  }
  
  if (searchFilters.server) {
    filteredData = filteredData.filter(item => 
      item.servidor && item.servidor.toLowerCase().includes(searchFilters.server)
    );
  }
  
  // Sort by date and time (newest first)
  filteredData.sort((a, b) => {
    const dateA = parseDate(a.data);
    const dateB = parseDate(b.data);
    if (dateA && dateB) {
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // Sort by date (newest first)
      }
      // If dates are equal, sort by time (newest first)
      return b.hora.localeCompare(a.hora);
    }
    return 0;
  });
  
  // Calculate pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);
  const pageData = filteredData.slice(startIndex, endIndex);
  
  // Display detailed records
  pageData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.data || ''}</td>
      <td>${item.hora || ''}</td>
      <td>${item.servidor || ''}</td>
      <td>${item.player || ''}</td>
      <td>${item.evento || ''}</td>
      <td>${item.print ? `<a href="${item.print}" target="_blank">Link</a>` : ''}</td>
      <td>${item.observacao || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  
  // Add pagination controls
  if (totalPages > 1) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="7" style="text-align: center;">
        <div class="pagination-controls">
          <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Anterior</button>
          <span>Página ${currentPage} de ${totalPages}</span>
          <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Próxima</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
    
    // Add event listeners to pagination buttons
    const paginationButtons = tbody.querySelectorAll('.pagination-btn');
    paginationButtons.forEach(button => {
      button.addEventListener('click', function() {
        const newPage = parseInt(this.getAttribute('data-page'));
        if (newPage && newPage !== currentPage) {
          currentPage = newPage;
          populateDetailedTable(currentData);
        }
      });
    });
  }
  
  console.log(`Detailed table populated with ${pageData.length} records (page ${currentPage} of ${totalPages})`);
}

function populateRankingTable(data) {
  const tbody = document.querySelector('#rankingTable tbody');
  tbody.innerHTML = ''; // Clear existing data
  
  // Filter data based on the current ranking period
  const filteredData = filterDataByPeriod(data, currentRankingPeriod);
  
  // Count participations per player
  const playerCounts = {};
  // Count unique events per player
  const playerEvents = {};
  
  filteredData.forEach(item => {
    const player = item.player || '';
    const event = item.evento || '';
    
    if (player) {
      // Count participations
      playerCounts[player] = (playerCounts[player] || 0) + 1;
      
      // Count unique events
      if (!playerEvents[player]) {
        playerEvents[player] = new Set();
      }
      if (event) {
        playerEvents[player].add(event);
      }
    }
  });
  
  // Sort players by participation count (descending)
  const sortedPlayers = Object.entries(playerCounts)
    .sort(([,a], [,b]) => b - a);
  
  // Display sorted data (top 50)
  const displayData = sortedPlayers.slice(0, 50); // Limit to top 50 for performance
  
  displayData.forEach(([player, count], index) => {
    const uniqueEventsCount = playerEvents[player] ? playerEvents[player].size : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${player}</td>
      <td>${count}</td>
      <td>${uniqueEventsCount}</td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log(`Ranking table populated with ${displayData.length} players for period: ${currentRankingPeriod}`);
}

// Filter data by time period
function filterDataByPeriod(data, period) {
  const now = new Date();
  
  switch (period) {
    case 'annual':
      // Filter for current year
      const currentYear = now.getFullYear();
      return data.filter(item => {
        const itemDate = parseDate(item.data);
        return itemDate && itemDate.getFullYear() === currentYear;
      });
      
    case 'monthly':
      // Filter for current month
      const currentMonth = now.getMonth();
      const currentYearMonth = now.getFullYear();
      return data.filter(item => {
        const itemDate = parseDate(item.data);
        return itemDate && 
               itemDate.getMonth() === currentMonth && 
               itemDate.getFullYear() === currentYearMonth;
      });
      
    case 'weekly':
      // Filter for current week (Sunday 00:00 to Saturday 23:59)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek); // Start from Sunday
      weekStart.setHours(0, 0, 0, 0); // Set to 00:00:00
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End on Saturday
      weekEnd.setHours(23, 59, 59, 999); // Set to 23:59:59
      
      return data.filter(item => {
        const itemDate = parseDate(item.data);
        const itemDateTime = itemDate ? new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()) : null;
        return itemDateTime && itemDateTime >= weekStart && itemDateTime <= weekEnd;
      });
      
    case 'daily':
      // Filter for today (00:00 to 23:59)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return data.filter(item => {
        const itemDate = parseDate(item.data);
        const itemDateTime = itemDate ? new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()) : null;
        return itemDateTime && itemDateTime >= today && itemDateTime < tomorrow;
      });
      
    case 'total':
    default:
      // No filtering for total
      return data;
  }
}

// Parse date string (dd/mm/yyyy format)
function parseDate(dateString) {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return new Date(year, month, day);
}

// Filter data based on selected filters
function filterData() {
  // Get selected filter values
  const dateFilter = document.getElementById('date-filter').value;
  const playerFilter = document.getElementById('player-filter').value;
  const eventFilter = document.getElementById('event-filter').value;
  const serverFilter = document.getElementById('server-filter').value;
  
  console.log('Filtering data with:', { dateFilter, playerFilter, eventFilter, serverFilter });
  
  // Start with all current data
  let filteredData = [...currentData];
  
  // Apply date filter
  if (dateFilter !== 'all') {
    filteredData = filteredData.filter(item => item.data === dateFilter);
  }
  
  // Apply player filter
  if (playerFilter !== 'all') {
    filteredData = filteredData.filter(item => item.player === playerFilter);
  }
  
  // Apply event filter
  if (eventFilter !== 'all') {
    filteredData = filteredData.filter(item => item.evento === eventFilter);
  }
  
  // Apply server filter
  if (serverFilter !== 'all') {
    filteredData = filteredData.filter(item => item.servidor === serverFilter);
  }
  
  // Apply period filter
  filteredData = filterDataByPeriod(filteredData, currentPeriod);
  
  console.log(`Filtered data count: ${filteredData.length}`);
  
  // Reset to first page when filters change
  currentPage = 1;
  
  // Update all dashboard elements with filtered data
  calculateKPIs(filteredData);
  createCharts(filteredData);
  populateDataTables(filteredData);
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