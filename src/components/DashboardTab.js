// ============================================================================
// ATB-SMS: Dashboard Tab
// Dual-panel chart dashboard with selectable visualizations
// ============================================================================

import { getStats, getRecords } from '../data/database.js';
import { ICONS } from '../icons.js';

const CHART_OPTIONS = [
  { id: 'monthly-total', label: `${ICONS.calendar} Consultas por Mes` },
  { id: 'monthly-approved', label: `${ICONS.checkCircle} Aprobadas por Mes` },
  { id: 'monthly-rejected', label: `${ICONS.xCircle} Rechazadas por Mes` },
  { id: 'by-organism', label: `${ICONS.bug} Distribución por Microorganismo` },
  { id: 'by-drug', label: `${ICONS.pill} Uso de Fármacos` },
  { id: 'by-resistance', label: `${ICONS.dna} Mecanismo de Resistencia` }
];

const CHART_COLORS = [
  '#3370ff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
];

export class DashboardTab {
  constructor(container) {
    this.container = container;
    this.stats = null;
    this.allRecords = [];
    this.leftChart = 'monthly-total';
    this.rightChart = 'by-organism';
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
          <p class="text-sm text-muted">Resumen de uso y estadísticas de la plataforma</p>
        </div>
        <button class="btn btn-secondary" id="btn-refresh-dashboard">${ICONS.refresh} Actualizar</button>
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

    // Build chart selector options
    const buildOptions = (selectedId) => CHART_OPTIONS.map(opt =>
      `<option value="${opt.id}" ${opt.id === selectedId ? 'selected' : ''}>${opt.label}</option>`
    ).join('');

    content.innerHTML = `
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total Consultas</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-value">${approved}</div>
          <div class="stat-label">Aprobadas (CUMPLE)</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-value">${rejected}</div>
          <div class="stat-label">Rechazadas (NO CUMPLE)</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-value">${approvalRate}%</div>
          <div class="stat-label">Tasa de Aprobación</div>
        </div>
      </div>

      <!-- Dual Chart Panels -->
      <div class="chart-panels">
        <div class="chart-panel">
          <div class="chart-panel-header">
            <select class="chart-selector" id="chart-selector-left">
              ${buildOptions(this.leftChart)}
            </select>
          </div>
          <div class="chart-panel-body" id="chart-panel-left"></div>
        </div>
        <div class="chart-panel">
          <div class="chart-panel-header">
            <select class="chart-selector" id="chart-selector-right">
              ${buildOptions(this.rightChart)}
            </select>
          </div>
          <div class="chart-panel-body" id="chart-panel-right"></div>
        </div>
      </div>

      <!-- Recent records -->
      <div class="card" style="margin-top:var(--space-xl);">
        <div class="card-header">
          <div class="card-icon">${ICONS.clock}</div>
          <div>
            <div class="card-title">Últimas Consultas</div>
            <div class="card-subtitle">${(recent || []).length} registros más recientes</div>
          </div>
        </div>
        <div id="recent-records"></div>
      </div>
    `;

    // Bind chart selectors
    document.getElementById('chart-selector-left').addEventListener('change', (e) => {
      this.leftChart = e.target.value;
      this.renderChart('chart-panel-left', this.leftChart);
    });

    document.getElementById('chart-selector-right').addEventListener('change', (e) => {
      this.rightChart = e.target.value;
      this.renderChart('chart-panel-right', this.rightChart);
    });

    // Render initial charts
    this.renderChart('chart-panel-left', this.leftChart);
    this.renderChart('chart-panel-right', this.rightChart);
    this.renderRecentRecords(recent);
  }

  // ---- Chart rendering engine ----
  renderChart(containerId, chartId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let data = {};
    let title = '';

    switch (chartId) {
      case 'monthly-total':
        data = this.getMonthlyData('all');
        title = 'Total de consultas por mes';
        break;
      case 'monthly-approved':
        data = this.getMonthlyData('CUMPLE');
        title = 'Consultas aprobadas por mes';
        break;
      case 'monthly-rejected':
        data = this.getMonthlyData('NO_CUMPLE');
        title = 'Consultas rechazadas por mes';
        break;
      case 'by-organism':
        data = this.stats.byOrganism;
        title = 'Distribución por microorganismo';
        break;
      case 'by-drug':
        data = this.stats.byDrug;
        title = 'Uso de fármacos';
        break;
      case 'by-resistance':
        data = this.stats.byResistance;
        title = 'Distribución por mecanismo de resistencia';
        break;
    }

    const entries = Object.entries(data).sort((a, b) => {
      // Sort monthly charts chronologically, rest by count descending
      if (chartId.startsWith('monthly')) return a[0].localeCompare(b[0]);
      return b[1] - a[1];
    });

    if (entries.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:var(--space-2xl); color:var(--slate-400);">
          <div style="font-size:2rem; margin-bottom:var(--space-sm);">${ICONS.inbox}</div>
          <p>Sin datos disponibles</p>
        </div>`;
      return;
    }

    const maxVal = Math.max(...entries.map(e => e[1]));
    const isMonthly = chartId.startsWith('monthly');

    container.innerHTML = `
      <div class="chart-bars-container">
        ${entries.map(([label, count], i) => {
      const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      const displayLabel = isMonthly ? this.formatMonth(label) : label;

      return `
            <div class="chart-bar-row">
              <div class="chart-bar-name" title="${label}">${displayLabel}</div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width:${Math.max(pct, 2)}%; background:${color};"></div>
              </div>
              <div class="chart-bar-count">${count}</div>
            </div>`;
    }).join('')}
      </div>
    `;
  }

  getMonthlyData(filter) {
    const monthly = {};
    this.allRecords.forEach(r => {
      if (filter !== 'all' && r.result !== filter) return;
      const month = r.date ? r.date.substring(0, 7) : 'N/A';
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return monthly;
  }

  formatMonth(yyyymm) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [year, month] = yyyymm.split('-');
    return `${months[parseInt(month) - 1] || month} ${year}`;
  }

  renderRecentRecords(records) {
    const container = document.getElementById('recent-records');
    if (!container) return;

    if (!records || records.length === 0) {
      container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:var(--space-lg);">Sin registros recientes</p>';
      return;
    }

    container.innerHTML = `
      <table class="registry-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Fármaco</th>
            <th>Microorganismo</th>
            <th>Resistencia</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => {
      const date = r.date ? new Date(r.date).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : 'N/A';
      const badge = r.result === 'CUMPLE'
        ? '<span class="sir-badge sir-S">✓</span>'
        : '<span class="sir-badge sir-R">✗</span>';
      return `
              <tr>
                <td style="font-size:0.8rem; color:var(--slate-400);">${date}</td>
                <td><strong>${r.drugName || 'N/A'}</strong></td>
                <td>${r.organismName || 'N/A'}</td>
                <td>${r.resistanceName || 'N/A'}</td>
                <td>${badge}</td>
              </tr>
            `;
    }).join('')}
        </tbody>
      </table>
    `;
  }
}
