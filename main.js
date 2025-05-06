// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBdiPWlc0Vui6N4Xgh-nJxPCm1a9mMnyiI",
  authDomain: "portifolio-new-c3114.firebaseapp.com",
  projectId: "portifolio-new-c3114",
  storageBucket: "portifolio-new-c3114.firebasestorage.app",
  messagingSenderId: "239306135723",
  appId: "1:239306135723:web:8678d27ed29fff0260bfee"
};
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Auth
const auth = getAuth(app);

// Dados simulados (mock) iniciais
const portfolio = {
  balance: 480363,
  balanceChange: 2421,
  profit: 955090,
  profitChange: 2721,
  invested: 379242,
  investedChange: 2286,
  roi: 56.69,
  roiChange: -0.9,
  tokens: [
    {
      name: 'USDC',
      icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
      price: 1.000,
      priceChange: -0.01,
      amount: 14270,
      share: 72.95,
      value: 14270,
      valueChange: 14270,
      stake: false
    },
    {
      name: 'HYPE',
      icon: 'https://cryptologos.cc/logos/hype-logo.png',
      price: 20.27,
      priceChange: 0.0,
      amount: 125.9,
      share: 13.01,
      value: 2550,
      valueChange: 2550,
      stake: true
    },
    {
      name: 'SENA',
      icon: 'https://cryptologos.cc/logos/senate-sena-logo.png',
      price: 0.273,
      priceChange: -4.88,
      amount: 4100,
      share: 5.73,
      value: 1120,
      valueChange: 1120,
      stake: false
    },
    {
      name: 'SOL',
      icon: 'https://cryptologos.cc/logos/solana-sol-logo.png',
      price: 146.64,
      priceChange: 0.76,
      amount: 4.72,
      share: 3.54,
      value: 691.68,
      valueChange: 691.68,
      stake: true
    },
    {
      name: 'DAI',
      icon: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
      price: 0.999,
      priceChange: 0.14,
      amount: -0.00172,
      share: -0.01,
      value: -0.00172,
      valueChange: -0.00172,
      stake: false
    }
  ]
};

let selectedCurrency = 'USD';
let usdBrlRate = 5.0;
async function fetchUsdBrlRate() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=brl');
    const data = await res.json();
    if (data.usd && data.usd.brl) usdBrlRate = data.usd.brl;
  } catch {}
}
document.getElementById('currency').addEventListener('change', async function() {
  selectedCurrency = this.value;
  if (selectedCurrency === 'BRL') await fetchUsdBrlRate();
  saveCurrency();
  updateAll();
});
function formatCurrency(value) {
  if (selectedCurrency === 'BRL') {
    return 'R$ ' + (value * usdBrlRate).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  } else {
    return '$' + value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
}

// Atualiza cards do dashboard
function updateDashboard() {
  document.getElementById('balance').textContent = formatCurrency(portfolio.balance);
  document.getElementById('balanceChange').textContent = `+${portfolio.balanceChange}% vs ano anterior`;
  document.getElementById('profit').textContent = formatCurrency(portfolio.profit);
  document.getElementById('profitChange').textContent = `+${portfolio.profitChange}% vs ano anterior`;
  document.getElementById('invested').textContent = formatCurrency(portfolio.invested);
  document.getElementById('investedChange').textContent = `+${portfolio.investedChange}% vs ano anterior`;
  document.getElementById('roi').textContent = `${portfolio.roi}%`;
  document.getElementById('roiChange').textContent = `${portfolio.roiChange > 0 ? '+' : ''}${portfolio.roiChange}% vs ano anterior`;
  if (portfolio.roiChange < 0) {
    document.getElementById('roiChange').classList.add('negative');
  }
}

// Atualiza tabela de tokens
function updateTokenTable() {
  const tbody = document.getElementById('tokenTableBody');
  tbody.innerHTML = '';
  // Calcular participação automaticamente
  const totalValue = portfolio.tokens.reduce((sum, t) => sum + (t.value > 0 ? t.value : 0), 0);
  portfolio.tokens.forEach(token => {
    token.share = totalValue > 0 ? (token.value > 0 ? (token.value / totalValue) * 100 : 0) : 0;
  });
  portfolio.tokens.forEach((token, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${token.icon}" alt="" style="width:22px;vertical-align:middle;margin-right:6px;border-radius:50%;">${token.name}
        ${token.stake ? '<span class="stake">Stake</span>' : ''}
      </td>
      <td>${formatCurrency(token.price)} <span style="color:${token.priceChange < 0 ? '#f87171' : '#4ade80'};font-size:0.95em;">${token.priceChange > 0 ? '↑' : '↓'}${Math.abs(token.priceChange)}%</span></td>
      <td>${token.amount > 1000 ? token.amount.toLocaleString(undefined, {maximumFractionDigits:2}) : token.amount}</td>
      <td>${token.share > 0 ? token.share.toFixed(2) : '0.00'}% <span class="progress-bar"><span class="progress${token.share < 0 ? ' negative' : ''}" style="width:${Math.abs(token.share)}%"></span></span></td>
      <td style="color:${token.value >= 0 ? '#4ade80' : '#f87171'};">${formatCurrency(token.value)}</td>
      <td><button onclick="removeToken(${idx})" style="background:#f87171;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;font-weight:600;">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Função para remover token
window.removeToken = function(idx) {
  portfolio.tokens.splice(idx, 1);
  addHistorySnapshot();
  updateAll();
}

// Gráficos
let pieChartInstance = null;
function renderCharts() {
  // Pie Chart
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  // Gerar cores únicas para cada token
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }
  const pieColors = portfolio.tokens.map(t => stringToColor(t.name + t.symbol));
  if (pieChartInstance) pieChartInstance.destroy();
  pieChartInstance = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: portfolio.tokens.map(t => t.name),
      datasets: [{
        data: portfolio.tokens.map(t => {
          let v = t.value > 0 ? t.value : 0;
          return selectedCurrency === 'BRL' ? v * usdBrlRate : v;
        }),
        backgroundColor: pieColors,
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#fff' } }
      }
    }
  });
  // Bar Chart
  const barCtx = document.getElementById('barChart').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: portfolio.tokens.map(t => t.name),
      datasets: [{
        label: 'Investido',
        data: portfolio.tokens.map(t => {
          let v = t.value > 0 ? t.value : 0;
          return selectedCurrency === 'BRL' ? v * usdBrlRate : v;
        }),
        backgroundColor: '#60a5fa',
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#fff' } },
        y: { ticks: { color: '#fff' } }
      }
    }
  });
}

// Filtro de período
let selectedPeriodDays = 365;
document.getElementById('period').addEventListener('change', function() {
  selectedPeriodDays = parseInt(this.value);
  renderHistoryChart();
});

// --- Adicionar Token ---
const addTokenBtn = document.getElementById('addTokenBtn');
const modalAddToken = document.getElementById('modalAddToken');
const addTokenForm = document.getElementById('addTokenForm');
const cancelAddToken = document.getElementById('cancelAddToken');
const closeAddToken = document.getElementById('closeAddToken');

addTokenBtn.onclick = async () => {
  modalAddToken.style.display = 'flex';
  if (coingeckoCoins.length === 0) {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
    coingeckoCoins = await res.json();
  }
};
cancelAddToken.onclick = () => {
  modalAddToken.style.display = 'none';
  addTokenForm.reset();
};
closeAddToken.onclick = () => {
  modalAddToken.style.display = 'none';
  addTokenForm.reset();
};
addTokenForm.onsubmit = function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(addTokenForm));
  const token = {
    name: data.name,
    icon: data.icon || 'https://cryptologos.cc/logos/generic-crypto-coin.png',
    price: parseFloat(data.price),
    priceChange: parseFloat(data.priceChange) || 0,
    amount: parseFloat(data.amount),
    value: parseFloat((parseFloat(data.price) * parseFloat(data.amount)).toFixed(2)),
    valueChange: parseFloat((parseFloat(data.price) * parseFloat(data.amount)).toFixed(2)),
    stake: !!data.stake,
    symbol: data.symbol || ''
  };
  portfolio.tokens.push(token);
  addHistorySnapshot();
  updateAll();
  modalAddToken.style.display = 'none';
  addTokenForm.reset();
};

// --- CoinGecko API para preço em tempo real ---
const tokenSymbolInput = document.getElementById('tokenSymbolInput');
const tokenPriceInput = document.getElementById('tokenPriceInput');
let coingeckoCoins = [];
tokenSymbolInput.onblur = async function() {
  const symbol = tokenSymbolInput.value.trim().toLowerCase();
  if (!symbol || coingeckoCoins.length === 0) return;
  const coin = coingeckoCoins.find(c => c.symbol === symbol);
  if (coin) {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd`);
    const data = await res.json();
    if (data[coin.id] && data[coin.id].usd) {
      tokenPriceInput.value = data[coin.id].usd;
    }
  }
};
document.getElementById('updatePricesBtn').onclick = async function() {
  if (coingeckoCoins.length === 0) {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
    coingeckoCoins = await res.json();
  }
  for (const token of portfolio.tokens) {
    if (!token.symbol) continue;
    const coin = coingeckoCoins.find(c => c.symbol === token.symbol.toLowerCase());
    if (coin) {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd`);
      const data = await res.json();
      if (data[coin.id] && data[coin.id].usd) {
        token.price = data[coin.id].usd;
        token.value = parseFloat((token.price * token.amount).toFixed(2));
      }
    }
  }
  addHistorySnapshot();
  updateAll();
  alert('Preços atualizados!');
};

// --- Persistência LocalStorage ---
function savePortfolio() {
  localStorage.setItem('portfolioData', JSON.stringify(portfolio));
  localStorage.setItem('portfolioHistory', JSON.stringify(portfolioHistory));
}
function loadPortfolio() {
  const data = localStorage.getItem('portfolioData');
  if (data) {
    Object.assign(portfolio, JSON.parse(data));
  }
  const hist = localStorage.getItem('portfolioHistory');
  if (hist) {
    portfolioHistory.splice(0, portfolioHistory.length, ...JSON.parse(hist));
  }
}
// --- Histórico de Evolução ---
const portfolioHistory = [];
function addHistorySnapshot() {
  const total = portfolio.tokens.reduce((sum, t) => sum + (t.value > 0 ? t.value : 0), 0);
  const now = new Date();
  portfolioHistory.push({ date: now.toISOString(), value: total });
  // Limitar histórico a 100 pontos
  if (portfolioHistory.length > 100) portfolioHistory.shift();
  savePortfolio();
}
// --- Atualizar e renderizar gráfico de histórico ---
let historyChartInstance = null;
function renderHistoryChart() {
  const ctx = document.getElementById('historyChart').getContext('2d');
  if (historyChartInstance) historyChartInstance.destroy();
  // Filtrar histórico pelo período selecionado
  const now = new Date();
  const filteredHistory = portfolioHistory.filter(h => {
    const d = new Date(h.date);
    return (now - d) / (1000 * 60 * 60 * 24) <= selectedPeriodDays;
  });
  historyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredHistory.map(h => new Date(h.date).toLocaleString()),
      datasets: [{
        label: 'Valor Total',
        data: filteredHistory.map(h => selectedCurrency === 'BRL' ? h.value * usdBrlRate : h.value),
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.1)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#fff' } } },
      scales: {
        x: { ticks: { color: '#fff', maxTicksLimit: 6 } },
        y: { ticks: { color: '#fff' } }
      }
    }
  });
}
function updateAll() {
  updateDashboard();
  updateTokenTable();
  renderCharts();
  renderHistoryChart();
  savePortfolio();
}
// Salvar e carregar moeda selecionada
function saveCurrency() {
  localStorage.setItem('portfolioCurrency', selectedCurrency);
}
function loadCurrency() {
  const c = localStorage.getItem('portfolioCurrency');
  if (c) selectedCurrency = c;
  document.getElementById('currency').value = selectedCurrency;
}
// --- Multi-usuário Firebase Auth ---
let currentUser = null;
const userInfo = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
function updateUserUI() {
  if (currentUser) {
    userInfo.textContent = `Olá, ${currentUser.email}`;
    logoutBtn.style.display = '';
  } else {
    userInfo.textContent = '';
    logoutBtn.style.display = 'none';
  }
}
logoutBtn.onclick = async () => {
  try {
    await signOut(auth);
  } catch (e) { alert('Erro ao sair: ' + e.message); }
};
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateUserUI();
});
// --- Firebase Cloud Save/Load ---
document.getElementById('saveCloudBtn').onclick = async function() {
  if (!currentUser) return alert('Faça login para salvar seu portfólio!');
  try {
    const docRef = doc(firestore, 'portfolios', currentUser.uid);
    await setDoc(docRef, {
      portfolio: portfolio,
      portfolioHistory: portfolioHistory,
      currency: selectedCurrency
    });
    alert('Portfólio salvo na nuvem!');
  } catch (e) {
    alert('Erro ao salvar na nuvem: ' + e.message);
  }
};
document.getElementById('loadCloudBtn').onclick = async function() {
  if (!currentUser) return alert('Faça login para carregar seu portfólio!');
  try {
    const docRef = doc(firestore, 'portfolios', currentUser.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      Object.assign(portfolio, data.portfolio);
      portfolioHistory.splice(0, portfolioHistory.length, ...(data.portfolioHistory || []));
      selectedCurrency = data.currency || 'USD';
      document.getElementById('currency').value = selectedCurrency;
      saveCurrency();
      updateAll();
      alert('Portfólio carregado da nuvem!');
    } else {
      alert('Nenhum portfólio salvo na nuvem ainda.');
    }
  } catch (e) {
    alert('Erro ao carregar da nuvem: ' + e.message);
  }
};
// --- Login/Cadastro E-mail ---
const emailLoginBtn = document.getElementById('emailLoginBtn');
const modalEmailLogin = document.getElementById('modalEmailLogin');
const emailLoginForm = document.getElementById('emailLoginForm');
const closeEmailLogin = document.getElementById('closeEmailLogin');
const cancelEmailLogin = document.getElementById('cancelEmailLogin');
const doEmailLogin = document.getElementById('doEmailLogin');
const doEmailSignup = document.getElementById('doEmailSignup');
let emailLoginMode = 'login';
emailLoginBtn.onclick = () => {
  modalEmailLogin.style.display = 'flex';
  emailLoginMode = 'login';
};
closeEmailLogin.onclick = cancelEmailLogin.onclick = () => {
  modalEmailLogin.style.display = 'none';
  emailLoginForm.reset();
};
doEmailSignup.onclick = (e) => {
  e.preventDefault();
  emailLoginMode = 'signup';
  emailLoginForm.requestSubmit();
};
doEmailLogin.onclick = (e) => {
  e.preventDefault();
  emailLoginMode = 'login';
  emailLoginForm.requestSubmit();
};
emailLoginForm.onsubmit = async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(emailLoginForm));
  try {
    if (emailLoginMode === 'signup') {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      alert('Conta criada! Você já está logado.');
    } else {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    }
    modalEmailLogin.style.display = 'none';
    emailLoginForm.reset();
  } catch (err) {
    alert('Erro: ' + (err.message || err));
  }
};
// Inicialização
loadPortfolio();
loadCurrency();
fetchUsdBrlRate().then(() => {
  updateAll();
  renderHistoryChart();
  if (portfolio.tokens.length > 0) addHistorySnapshot();
}); 