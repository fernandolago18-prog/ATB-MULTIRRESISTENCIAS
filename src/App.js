// ============================================================================
// ATB-SMS: Main Application Shell
// Tab navigation, Authentication and Component orchestration
// ============================================================================

import { ConsultaTab } from './components/ConsultaTab.js';
import { RegistryTab } from './components/RegistryTab.js';
import { DashboardTab } from './components/DashboardTab.js';
import { LoginTab } from './components/LoginTab.js';
import { showToast } from './components/Toast.js';
import { ICONS } from './icons.js';
import { supabase } from './data/supabaseClient.js';

export class App {
  constructor(container) {
    this.container = container;
    this.currentTab = 'consulta';
    this.tabs = {};
    this.user = null;
    this.isInitialized = false;
  }

  async mount() {
    try {
      // Check initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      this.user = session?.user || null;

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        const newUser = session?.user || null;
        
        // Only re-render if auth status actually changed (login/logout)
        if (this.isInitialized && !!this.user !== !!newUser) {
          this.user = newUser;
          this.renderRoot();
        } else {
          this.user = newUser;
        }
      });

      this.renderRoot();
      this.isInitialized = true;
    } catch (err) {
      console.error('App mount failure:', err);
      this.container.innerHTML = `<div style="padding:2rem; color:red">Error de conexión con Supabase. Verifica tu conexión a internet o la configuración del cliente.</div>`;
    }
  }

  renderRoot() {
    try {
      if (!this.user) {
        this.renderLogin();
      } else {
        this.renderMain();
      }
    } catch (err) {
      console.error('RenderRoot failure:', err);
      this.container.innerHTML = `<div style="padding:2rem; color:red">Error al renderizar la aplicación: ${err.message}</div>`;
    }
  }

  renderLogin() {
    this.container.innerHTML = `<div id="auth-container"></div>`;
    const loginTab = new LoginTab(
      document.getElementById('auth-container'),
      (user) => {
        this.user = user;
        this.renderMain();
      }
    );
    loginTab.mount();
  }

  renderMain() {
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
          
          <div class="user-profile">
            <div class="user-info">
              <div class="user-email">${this.user.email}</div>
            </div>
            <button class="btn btn-icon btn-secondary" id="btn-logout" title="Cerrar sesión">
              ${ICONS.logout}
            </button>
          </div>
        </div>
      </header>
      
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

      <main class="main-content">
        <div id="tab-consulta" class="tab-content active"></div>
        <div id="tab-registro" class="tab-content"></div>
        <div id="tab-dashboard" class="tab-content"></div>
      </main>
    `;

    this.initTabs();
    this.bindEvents();
    this.switchTab(this.currentTab);
  }

  initTabs() {
    try {
      this.tabs.consulta = new ConsultaTab(
        document.getElementById('tab-consulta'),
        (record) => {
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
    } catch (err) {
      console.error('Tabs init failure:', err);
    }
  }

  bindEvents() {
    const nav = document.getElementById('nav-tabs');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const tab = e.target.closest('.nav-tab');
        if (tab) {
          this.switchTab(tab.dataset.tab);
        }
      });
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showToast('Sesión cerrada', 'info');
      });
    }
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
    try {
      if (tabName === 'registro' && this.tabs.registro) {
        this.tabs.registro.refresh();
      }
      if (tabName === 'dashboard' && this.tabs.dashboard) {
        this.tabs.dashboard.refresh();
      }
    } catch (err) {
      console.error('Tab refresh failure:', err);
    }
  }
}
