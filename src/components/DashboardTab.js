// ============================================================================
// ATB-SMS: Dashboard Tab (Professional Edition)
// High-fidelity visualizations using Chart.js + Data Explorer
// ============================================================================

import { getStats, getRecords } from '../data/database.js';
import { ICONS } from '../icons.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const CHART_OPTIONS = [
  { id: 'monthly-total', label: `Consultas por Mes`, icon: ICONS.calendar },
  { id: 'by-organism', label: `Distribución por Microorganismo`, icon: ICONS.bug },
  { id: 'by-drug', label: `Uso de Fármacos`, icon: ICONS.pill },
  { id: 'by-unit', label: `Uso por Unidad/Servicio`, icon: ICONS.mapPin },
  { id: 'by-resistance', label: `Mecanismo de Resistencia`, icon: ICONS.dna },
  { id: 'by-site', label: `Localización de Infección`, icon: ICONS.mapPin }
];

const PROFESSIONAL_PALETTE = [
  '#3370ff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#10b981', '#f97316', '#6366f1',
  '#14b8a6', '#f43f5e', '#84cc16', '#a855f7', '#0ea5e9'
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
    this.explorerFilter = 'all';
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
          <p class="text-sm text-muted">Análisis avanzado de uso y cumplimiento BIFIMED / SMS</p>
        </div>
        <div class="flex gap-md">
          <button class="btn btn-secondary" id="btn-refresh-dashboard">${ICONS.refresh} Actualizar Datos</button>
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

    const { total, approved, rejected } = this.stats;
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

      <!-- Chart Panels -->
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

      <!-- Advanced Data Explorer & Trends -->
      <div class="section-divider">Explorador de Tendencias y Patrones</div>
      
      <div id="trends-summary" class="mb-lg"></div>

      <div class="card mb-xl">
        <div class="card-header" style="border-bottom: 1px solid var(--slate-100);">
          <div class="flex justify-between items-center" style="width:100%;">
            <div class="flex items-center gap-md">
              <div class="card-icon" style="background:var(--primary-100); color:var(--primary-600);">${ICONS.search}</div>
              <div>
                <div class="card-title">Análisis Dimensional</div>
                <div class="card-subtitle">Cruza datos para identificar patrones de resistencia</div>
              </div>
            </div>
            <select class="form-select" id="explorer-org-filter" style="width:100%; max-width:250px;">
              <option value="all">Todos los microorganismos</option>
              ${Object.keys(this.stats.byOrganism).map(o => `<option value="${o}" ${this.explorerFilter === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body" id="explorer-results" style="padding:var(--space-lg);">
           <!-- Trend analysis will be rendered here -->
        </div>
      </div>
    `;

    // Bind events
    document.getElementById('chart-selector-left').addEventListener('change', (e) => {
      this.leftChartId = e.target.value;
      this.initChart('left', this.leftChartId);
    });

    document.getElementById('chart-selector-right').addEventListener('change', (e) => {
      this.rightChartId = e.target.value;
      this.initChart('right', this.rightChartId);
    });

    document.getElementById('explorer-org-filter').addEventListener('change', (e) => {
      this.explorerFilter = e.target.value;
      this.renderTrendAnalysis();
    });

    // Initial renders
    setTimeout(() => {
      this.initChart('left', this.leftChartId);
      this.initChart('right', this.rightChartId);
      this.renderTrendAnalysis();
    }, 0);
  }

  initChart(side, chartId) {
    const canvas = document.getElementById(`canvas-${side}`);
    if (!canvas) return;
    if (this.charts[side]) this.charts[side].destroy();

    const ctx = canvas.getContext('2d');
    const config = this.getChartConfig(chartId);
    this.charts[side] = new Chart(ctx, config);
  }

  getChartConfig(chartId) {
    let type = 'bar';
    let data = { labels: [], datasets: [] };
    let options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
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
            backgroundColor: Object.keys(monthly).map((_, i) => PROFESSIONAL_PALETTE[i % PROFESSIONAL_PALETTE.length]),
            borderRadius: 6,
            barThickness: 40
          }]
        };
        break;

      case 'by-organism':
        const orgData = this.stats.byOrganism;
        data = {
          labels: Object.keys(orgData),
          datasets: [{
            data: Object.values(orgData),
            backgroundColor: PROFESSIONAL_PALETTE,
            borderWidth: 0,
            hoverOffset: 15
          }]
        };
        type = 'doughnut';
        options.plugins.legend = { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20 } };
        options.scales = { y: { display: false }, x: { display: false } };
        break;

      case 'by-drug':
        const drugData = this.stats.byDrug;
        data = {
          labels: Object.keys(drugData),
          datasets: [{
            label: 'Uso de fármaco',
            data: Object.values(drugData),
            backgroundColor: Object.keys(drugData).map((_, i) => PROFESSIONAL_PALETTE[(i + 2) % PROFESSIONAL_PALETTE.length]),
            borderRadius: 6,
            barThickness: 30
          }]
        };
        options.indexAxis = 'y';
        break;

      case 'by-resistance':
        const resData = this.stats.byResistance;
        data = {
          labels: Object.keys(resData),
          datasets: [{
            label: 'Mecanismos detectados',
            data: Object.values(resData),
            backgroundColor: Object.keys(resData).map((_, i) => PROFESSIONAL_PALETTE[(i + 4) % PROFESSIONAL_PALETTE.length]),
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
            label: 'Localización',
            data: Object.values(siteData),
            backgroundColor: Object.keys(siteData).map((_, i) => PROFESSIONAL_PALETTE[(i + 6) % PROFESSIONAL_PALETTE.length]),
            borderRadius: 6
          }]
        };
        break;

      case 'by-unit':
        const unitData = {};
        this.allRecords.forEach(r => {
          const key = r.unit || 'N/A';
          unitData[key] = (unitData[key] || 0) + 1;
        });
        data = {
          labels: Object.keys(unitData),
          datasets: [{
            label: 'Consultas por Unidad',
            data: Object.values(unitData),
            backgroundColor: Object.keys(unitData).map((_, i) => PROFESSIONAL_PALETTE[(i + 8) % PROFESSIONAL_PALETTE.length]),
            borderRadius: 6,
            barThickness: 30
          }]
        };
        options.indexAxis = 'y';
        break;
    }

    return { type, data, options };
  }

  getMonthlyData() {
    const monthly = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      monthly[key] = 0;
    }
    this.allRecords.forEach(r => {
      const month = r.date ? r.date.substring(0, 7) : null;
      if (month && monthly.hasOwnProperty(month)) monthly[month]++;
    });
    return monthly;
  }

  formatMonth(yyyymm) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [year, month] = yyyymm.split('-');
    return `${months[parseInt(month) - 1]} ${year.substring(2)}`;
  }

  // ======================================================================
  // TREND ANALYSIS ENGINE
  // ======================================================================
  renderTrendAnalysis() {
    const container = document.getElementById('explorer-results');
    const summary = document.getElementById('trends-summary');
    if (!container) return;

    let filtered = this.allRecords;
    if (this.explorerFilter !== 'all') {
      filtered = filtered.filter(r => r.organismName === this.explorerFilter);
    }

    // 1. Calculate Insights (Automatic Pattern Detection)
    const insights = this.calculateInsights();
    summary.innerHTML = insights.map(ins => `
      <div class="alert ${ins.type === 'warning' ? 'alert-warning' : 'alert-info'}" style="margin-bottom:var(--space-sm); display:flex; align-items:center; gap:var(--space-md);">
        <div style="font-size:1.5rem;">${ins.type === 'warning' ? ICONS.alertTriangle : ICONS.activity}</div>
        <div style="flex:1;">
          <strong>${ins.title}:</strong> ${ins.message}
        </div>
      </div>
    `).join('');

    // 2. Data Table for the filtered dimension
    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-center text-muted" style="padding:var(--space-xl);">No hay datos suficientes para analizar este microorganismo.</p>`;
      return;
    }

    const drugUsage = {};
    const resDistribution = {};
    filtered.forEach(r => {
      drugUsage[r.drugName] = (drugUsage[r.drugName] || 0) + 1;
      resDistribution[r.resistanceName] = (resDistribution[r.resistanceName] || 0) + 1;
    });

    const topDrug = Object.entries(drugUsage).sort((a, b) => b[1] - a[1])[0];
    const topRes = Object.entries(resDistribution).sort((a, b) => b[1] - a[1])[0];

    container.innerHTML = `
      <div class="responsive-grid">
        <div>
          <h4 style="margin-bottom:var(--space-md); color:var(--slate-700); border-left:3px solid var(--primary); padding-left:var(--space-sm);">Perfil de Tratamiento</h4>
          <p class="text-sm mb-md">Tratamientos más frecuentes para <strong>${this.explorerFilter === 'all' ? 'todos' : this.explorerFilter}</strong>:</p>
          <ul class="result-criteria">
            ${Object.entries(drugUsage).map(([drug, count]) => `
              <li style="display:flex; justify-content:space-between; align-items:center;">
                <span>${drug}</span>
                <span class="badge badge-secondary">${count} casos</span>
              </li>
            `).join('')}
          </ul>
        </div>
        <div>
          <h4 style="margin-bottom:var(--space-md); color:var(--slate-700); border-left:3px solid var(--warning); padding-left:var(--space-sm);">Distribución de Resistencias</h4>
          <p class="text-sm mb-md">Mecanismos predominantes identificados:</p>
          <ul class="result-criteria">
            ${Object.entries(resDistribution).map(([res, count]) => `
              <li style="display:flex; justify-content:space-between; align-items:center;">
                <span>${res}</span>
                <span class="badge badge-primary" style="background:var(--slate-100); color:var(--slate-700); border:1px solid var(--slate-200);">${Math.round((count/filtered.length)*100)}%</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
      
      <div class="mt-xl p-md" style="background:var(--primary-50); border-radius:var(--radius-md); border:1px dashed var(--primary-200);">
        <div class="text-xs text-primary-700 font-bold mb-xs">PATRÓN DETECTADO</div>
        <div class="text-sm">
          En los registros de <strong>${this.explorerFilter === 'all' ? 'la base de datos' : this.explorerFilter}</strong>, 
          el mecanismo <strong>${topRes ? topRes[0] : 'N/A'}</strong> es el más prevalente, 
          siendo <strong>${topDrug ? topDrug[0] : 'N/A'}</strong> el fármaco de elección más evaluado.
        </div>
      </div>
    `;
  }

  calculateInsights() {
    const insights = [];
    if (this.allRecords.length < 5) return insights;

    // Pattern 1: Approval Rate Trend
    const now = new Date();
    const thisMonthKey = now.toISOString().substring(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = lastMonth.toISOString().substring(0, 7);

    const thisMonthRecs = this.allRecords.filter(r => r.date.startsWith(thisMonthKey));
    const lastMonthRecs = this.allRecords.filter(r => r.date.startsWith(lastMonthKey));

    if (thisMonthRecs.length > 0 && lastMonthRecs.length > 0) {
      const thisRate = (thisMonthRecs.filter(r => r.result === 'CUMPLE').length / thisMonthRecs.length) * 100;
      const lastRate = (lastMonthRecs.filter(r => r.result === 'CUMPLE').length / lastMonthRecs.length) * 100;
      
      if (thisRate < lastRate - 15) {
        insights.push({
          title: 'Descenso en Cumplimiento',
          message: `La tasa de aprobación ha caído un ${Math.round(lastRate - thisRate)}% respecto al mes anterior. Revisar adecuación a protocolos SMS.`,
          type: 'warning'
        });
      }
    }

    // Pattern 2: Emergence of Resistance (MBL)
    const mblCount = this.allRecords.filter(r => r.resistanceId === 'MBL').length;
    if (mblCount > 0) {
      const recentMbl = this.allRecords.filter(r => r.resistanceId === 'MBL' && (new Date() - new Date(r.date) < 30 * 24 * 60 * 60 * 1000)).length;
      if (recentMbl > 2) {
        insights.push({
          title: 'Alerta Microbiológica',
          message: `Se han detectado ${recentMbl} casos de Metalobetalactamasas (MBL) en los últimos 30 días. Extremar precauciones de control de infección.`,
          type: 'warning'
        });
      }
    }

    // Pattern 3: Top Pathogen
    const orgCounts = {};
    this.allRecords.forEach(r => orgCounts[r.organismName] = (orgCounts[r.organismName] || 0) + 1);
    const topOrg = Object.entries(orgCounts).sort((a, b) => b[1] - a[1])[0];
    if (topOrg) {
      insights.push({
        title: 'Prevalencia',
        message: `<strong>${topOrg[0]}</strong> es el microorganismo con mayor volumen de consultas (${topOrg[1]} registros).`,
        type: 'info'
      });
    }

    return insights;
  }
}
