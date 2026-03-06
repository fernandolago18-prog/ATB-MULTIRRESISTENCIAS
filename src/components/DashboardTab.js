// ============================================================================
// ATB-SMS: Dashboard Tab (Professional Edition)
// High-fidelity visualizations using Chart.js
// ============================================================================

import { getStats, getRecords } from '../data/database.js';
import { ICONS } from '../icons.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const CHART_OPTIONS = [
  { id: 'monthly-total', label: `Consultas por Mes`, icon: ICONS.calendar },
  { id: 'by-organism', label: `Distribución por Microorganismo`, icon: ICONS.bug },
  { id: 'by-drug', label: `Uso de Fármacos`, icon: ICONS.pill },
  { id: 'by-resistance', label: `Mecanismo de Resistencia`, icon: ICONS.dna },
  { id: 'by-site', label: `Localización de Infección`, icon: ICONS.mapPin }
];

export class DashboardTab {
  constructor(container) {
    this.container = container;
    this.stats = null;
    this.allRecords = [];
    this.leftChartId = 'monthly-total';
    this.rightChartId = 'by-organism';
    this.charts = {
      left: null,
      right: null
    };
  }

  mount() {
    this.render();
  }

  async refresh() {
    this.stats = await getStats();
    this.allRecords = await getRecords();
    this.renderContent();
  }

  render() {
    this.container.innerHTML = `
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:var(--space-md); margin-bottom: var(--space-xl);">
        <div>
          <h2>${ICONS.barChart} Dashboard de Gestión</h2>
          <p class="text-sm text-muted">Análisis avanzado de uso y cumplimiento BIFIMED</p>
        </div>
        <div class="flex gap-md">
          <button class="btn btn-secondary" id="btn-refresh-dashboard">${ICONS.refresh} Actualizar</button>
        </div>
      </div>
      <div id="dashboard-content">
        <p class="text-muted text-center" style="padding:var(--space-2xl);">Cargando estadísticas...</p>
      </div>
    `;

    document.getElementById('btn-refresh-dashboard').addEventListener('click', () => this.refresh());
    this.refresh();
  }

  renderContent() {
    const content = document.getElementById('dashboard-content');
    if (!this.stats) {
      content.innerHTML = '<p class="text-muted text-center" style="padding:var(--space-2xl);">No hay datos disponibles.</p>';
      return;
    }

    const { total, approved, rejected, recent } = this.stats;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    content.innerHTML = `
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Consultas</div>
          <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-label">Aprobadas (CUMPLE)</div>
          <div class="stat-value">${approved}</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-label">Rechazadas (NO CUMPLE)</div>
          <div class="stat-value">${rejected}</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-label">Tasa de Aprobación</div>
          <div class="stat-value">${approvalRate}%</div>
        </div>
      </div>

      <!-- Professional Chart Panels -->
      <div class="chart-panels">
        <div class="chart-panel">
          <div class="chart-panel-header">
            <select class="chart-selector" id="chart-selector-left">
              ${CHART_OPTIONS.map(opt => `<option value="${opt.id}" ${opt.id === this.leftChartId ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>
          </div>
          <div class="chart-panel-body">
            <canvas id="canvas-left"></canvas>
          </div>
        </div>
        <div class="chart-panel">
          <div class="chart-panel-header">
            <select class="chart-selector" id="chart-selector-right">
              ${CHART_OPTIONS.map(opt => `<option value="${opt.id}" ${opt.id === this.rightChartId ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>
          </div>
          <div class="chart-panel-body">
            <canvas id="canvas-right"></canvas>
          </div>
        </div>
      </div>

      <!-- Advanced Data Exploitation Section -->
      <div class="section-divider">Análisis de Datos</div>
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-icon">${ICONS.activity}</div>
          <div>
            <div class="card-title">Explorador de Registros</div>
            <div class="card-subtitle">Filtra y analiza tendencias por múltiples dimensiones</div>
          </div>
        </div>
        <div id="data-explorer">
           <!-- Filters and interactive table here -->
        </div>
      </div>
    `;

    // Bind chart selectors
    document.getElementById('chart-selector-left').addEventListener('change', (e) => {
      this.leftChartId = e.target.value;
      this.initChart('left', this.leftChartId);
    });

    document.getElementById('chart-selector-right').addEventListener('change', (e) => {
      this.rightChartId = e.target.value;
      this.initChart('right', this.rightChartId);
    });

    // Initial chart render
    setTimeout(() => {
      this.initChart('left', this.leftChartId);
      this.initChart('right', this.rightChartId);
    }, 0);
  }

  initChart(side, chartId) {
    const canvas = document.getElementById(`canvas-${side}`);
    if (!canvas) return;

    // Destroy existing chart instance
    if (this.charts[side]) {
      this.charts[side].destroy();
    }

    const ctx = canvas.getContext('2d');
    const chartConfig = this.getChartConfig(chartId);

    this.charts[side] = new Chart(ctx, chartConfig);
  }

  getChartConfig(chartId) {
    let type = 'bar';
    let data = { labels: [], datasets: [] };
    let options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    };

    switch (chartId) {
      case 'monthly-total':
        const monthly = this.getMonthlyData();
        data = {
          labels: Object.keys(monthly).map(m => this.formatMonth(m)),
          datasets: [{
            label: 'Consultas',
            data: Object.values(monthly),
            backgroundColor: '#3370ff',
            borderRadius: 6
          }]
        };
        break;

      case 'by-organism':
        const orgData = this.stats.byOrganism;
        data = {
          labels: Object.keys(orgData),
          datasets: [{
            data: Object.values(orgData),
            backgroundColor: ['#3370ff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderRadius: 6
          }]
        };
        type = 'doughnut';
        options.plugins.legend = { display: true, position: 'bottom' };
        options.scales = { y: { display: false }, x: { display: false } };
        break;

      case 'by-drug':
        const drugData = this.stats.byDrug;
        data = {
          labels: Object.keys(drugData),
          datasets: [{
            label: 'Uso',
            data: Object.values(drugData),
            backgroundColor: '#16a34a',
            borderRadius: 6
          }]
        };
        break;

      case 'by-resistance':
        const resData = this.stats.byResistance;
        data = {
          labels: Object.keys(resData),
          datasets: [{
            label: 'Casos',
            data: Object.values(resData),
            backgroundColor: '#f59e0b',
            borderRadius: 6
          }]
        };
        break;
      
      case 'by-site':
        const siteData = {};
        this.allRecords.forEach(r => {
          const key = r.siteName || 'Desconocido';
          siteData[key] = (siteData[key] || 0) + 1;
        });
        data = {
          labels: Object.keys(siteData),
          datasets: [{
            label: 'Infecciones',
            data: Object.values(siteData),
            backgroundColor: '#8b5cf6',
            borderRadius: 6
          }]
        };
        break;
    }

    return { type, data, options };
  }

  getMonthlyData() {
    const monthly = {};
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      monthly[key] = 0;
    }

    this.allRecords.forEach(r => {
      const month = r.date ? r.date.substring(0, 7) : null;
      if (month && monthly.hasOwnProperty(month)) {
        monthly[month]++;
      }
    });
    return monthly;
  }

  formatMonth(yyyymm) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [year, month] = yyyymm.split('-');
    return `${months[parseInt(month) - 1]}`;
  }
}
