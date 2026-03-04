// ============================================================================
// ATB-SMS: Main Application Shell
// Tab navigation and component orchestration
// ============================================================================

import { ConsultaTab } from './components/ConsultaTab.js';
import { RegistryTab } from './components/RegistryTab.js';
import { DashboardTab } from './components/DashboardTab.js';
import { showToast } from './components/Toast.js';
import { ICONS } from './icons.js';

export class App {
  constructor(container) {
    this.container = container;
    this.currentTab = 'consulta';
    this.tabs = {};
  }

  mount() {
    this.render();
    this.initTabs();
    this.bindEvents();
    this.switchTab('consulta');
  }

  render() {
    this.container.innerHTML = `
      <header class="app-header">
        <div class="app-header-inner">
          <div class="app-logo">
            <div class="app-logo-icon">${ICONS.pill}</div>
            <div>
              <div class="app-logo-text">ATB-SMS</div>
              <div class="app-logo-subtitle">Soporte Decisión Antimicrobiana</div>
            </div>
          </div>
          <nav class="nav-tabs" id="nav-tabs">
            <button class="nav-tab active" data-tab="consulta">
              <span class="nav-tab-icon">${ICONS.stethoscope}</span>
              Consulta
            </button>
            <button class="nav-tab" data-tab="registro">
              <span class="nav-tab-icon">${ICONS.clipboard}</span>
              Registro
            </button>
            <button class="nav-tab" data-tab="dashboard">
              <span class="nav-tab-icon">${ICONS.barChart}</span>
              Dashboard
            </button>
          </nav>
        </div>
      </header>
      <main class="main-content">
        <div id="tab-consulta" class="tab-content active"></div>
        <div id="tab-registro" class="tab-content"></div>
        <div id="tab-dashboard" class="tab-content"></div>
      </main>
    `;
  }

  initTabs() {
    this.tabs.consulta = new ConsultaTab(
      document.getElementById('tab-consulta'),
      (record) => {
        // Callback when a record is saved from the consulta tab
        if (this.tabs.registro) this.tabs.registro.refresh();
        if (this.tabs.dashboard) this.tabs.dashboard.refresh();
        showToast('Registro guardado correctamente', 'success');
      }
    );
    this.tabs.consulta.mount();

    this.tabs.registro = new RegistryTab(document.getElementById('tab-registro'));
    this.tabs.registro.mount();

    this.tabs.dashboard = new DashboardTab(document.getElementById('tab-dashboard'));
    this.tabs.dashboard.mount();
  }

  bindEvents() {
    document.getElementById('nav-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab');
      if (tab) {
        this.switchTab(tab.dataset.tab);
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.nav-tab[data-tab="${tabName}"]`)?.classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');

    // Refresh data on switch
    if (tabName === 'registro' && this.tabs.registro) {
      this.tabs.registro.refresh();
    }
    if (tabName === 'dashboard' && this.tabs.dashboard) {
      this.tabs.dashboard.refresh();
    }
  }
}
