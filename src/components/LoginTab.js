// ============================================================================
// ATB-SMS: Login Tab (Strict Mode)
// Supabase Authentication (Only pre-registered users)
// ============================================================================

import { supabase } from '../data/supabaseClient.js';
import { ICONS } from '../icons.js';
import { showToast } from './Toast.js';

export class LoginTab {
  constructor(container, onLoginSuccess) {
    this.container = container;
    this.onLoginSuccess = onLoginSuccess;
    this.loading = false;
  }

  mount() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-header">
            <div class="app-logo-icon" style="width: 48px; height: 48px; font-size: 1.5rem; margin-bottom: var(--space-md);">${ICONS.shieldCheck}</div>
            <h2>Acceso al Sistema</h2>
            <p class="text-sm text-muted">Portal de Soporte a la Decisión Antimicrobiana</p>
          </div>

          <form id="login-form">
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input type="email" id="login-email" class="form-input" placeholder="usuario@sms.es" required />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg" id="btn-submit-auth" style="margin-top: var(--space-md);">
              Entrar
            </button>
          </form>

          <div class="alert alert-info mt-lg" style="font-size: 0.75rem; text-align: center; border: none; background: var(--slate-50);">
            <span class="alert-icon">${ICONS.info}</span>
            <div>
              <strong>Acceso Restringido</strong><br>
              Solo personal autorizado del SMS. Si no tiene acceso, contacte con el equipo PROA.
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.loading) return;

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('btn-submit-auth');

      this.loading = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Validando...`;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            throw new Error('Credenciales incorrectas o usuario no autorizado.');
          }
          throw error;
        }
        
        showToast('Acceso concedido', 'success');
        if (this.onLoginSuccess) this.onLoginSuccess(data.user);
      } catch (err) {
        showToast(err.message || 'Error en la autenticación', 'error');
      } finally {
        this.loading = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Entrar';
        }
      }
    });
  }
}
