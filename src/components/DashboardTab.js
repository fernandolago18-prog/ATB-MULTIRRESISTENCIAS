// ============================================================================
// ATB-SMS: Dashboard Tab
// Usage statistics and visualizations
// ============================================================================

import { getStats } from '../data/database.js';

const BAR_COLORS = ['primary', 'success', 'warning', 'danger', 'info', 'primary', 'success', 'warning'];

export class DashboardTab {
    constructor(container) {
        this.container = container;
        this.stats = null;
    }

    mount() {
        this.render();
    }

    async refresh() {
        this.stats = await getStats();
        this.renderStats();
    }

    render() {
        this.container.innerHTML = `
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:var(--space-md); margin-bottom: var(--space-xl);">
        <div>
          <h2>📊 Dashboard de Gestión</h2>
          <p class="text-sm text-muted">Resumen de uso y estadísticas de la plataforma</p>
        </div>
        <button class="btn btn-secondary" id="btn-refresh-dashboard">🔄 Actualizar</button>
      </div>

      <div id="dashboard-content">
        <p class="text-muted text-center" style="padding:var(--space-2xl);">Cargando estadísticas...</p>
      </div>
    `;

        document.getElementById('btn-refresh-dashboard').addEventListener('click', () => this.refresh());
        this.refresh();
    }

    renderStats() {
        const content = document.getElementById('dashboard-content');
        if (!this.stats) {
            content.innerHTML = '<p class="text-muted text-center" style="padding:var(--space-2xl);">No hay datos disponibles.</p>';
            return;
        }

        const { total, approved, rejected, byDrug, byOrganism, byResistance, byMonth, recent } = this.stats;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        content.innerHTML = `
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total Consultas</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">${approved}</div>
          <div class="stat-label">Aprobadas (CUMPLE)</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">${rejected}</div>
          <div class="stat-label">Rechazadas (NO CUMPLE)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${approvalRate}%</div>
          <div class="stat-label">Tasa de Aprobación</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-xl);">
        <div class="chart-container" id="chart-by-drug">
          <div class="chart-title">📊 Uso por Fármaco</div>
          <div id="chart-drug-bars"></div>
        </div>
        <div class="chart-container" id="chart-by-organism">
          <div class="chart-title">🦠 Distribución por Microorganismo</div>
          <div id="chart-organism-bars"></div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-xl); margin-top:var(--space-xl);">
        <div class="chart-container" id="chart-by-resistance">
          <div class="chart-title">🧬 Distribución por Mecanismo de Resistencia</div>
          <div id="chart-resistance-bars"></div>
        </div>
        <div class="chart-container" id="chart-by-month">
          <div class="chart-title">📅 Evolución Mensual</div>
          <div id="chart-month-bars"></div>
        </div>
      </div>

      <!-- Recent records -->
      <div class="chart-container" style="margin-top:var(--space-xl);">
        <div class="chart-title">🕒 Últimas Consultas</div>
        <div id="recent-records"></div>
      </div>
    `;

        // Render bar charts
        this.renderBarChart('chart-drug-bars', byDrug, total);
        this.renderBarChart('chart-organism-bars', byOrganism, total);
        this.renderBarChart('chart-resistance-bars', byResistance, total);
        this.renderBarChart('chart-month-bars', byMonth, total);
        this.renderRecentRecords(recent);
    }

    renderBarChart(containerId, data, total) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
            container.innerHTML = '<p class="text-muted text-sm">Sin datos</p>';
            return;
        }

        const maxVal = Math.max(...entries.map(e => e[1]));

        container.innerHTML = entries.map(([label, count], i) => {
            const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
            const color = BAR_COLORS[i % BAR_COLORS.length];

            return `
        <div class="chart-bar-group">
          <div class="chart-bar-label">
            <span>${label}</span>
            <span class="font-mono">${count}</span>
          </div>
          <div class="chart-bar">
            <div class="chart-bar-fill ${color}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
        }).join('');
    }

    renderRecentRecords(records) {
        const container = document.getElementById('recent-records');
        if (!container) return;

        if (!records || records.length === 0) {
            container.innerHTML = '<p class="text-muted text-sm">Sin registros recientes</p>';
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
                <td style="font-size:0.8rem; color:var(--text-muted);">${date}</td>
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
