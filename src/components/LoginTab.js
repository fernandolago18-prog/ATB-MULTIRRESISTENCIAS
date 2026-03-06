// ============================================================================
// ATB-SMS: Login Tab
// Supabase Authentication (Email/Password)
// ============================================================================

import { supabase } from '../data/supabaseClient.js';
import { ICONS } from '../icons.js';
import { showToast } from './Toast.js';

export class LoginTab {
  constructor(container, onLoginSuccess) {
    this.container = container;
    this.onLoginSuccess = onLoginSuccess;
    this.mode = 'login'; // 'login' | 'signup'
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
              <input type="email" id="login-email" class="form-input" placeholder="ejemplo@sms.es" required />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg" id="btn-submit-auth" style="margin-top: var(--space-md);">
              ${this.mode === 'login' ? 'Entrar' : 'Registrarse'}
            </button>
          </form>

          <div class="auth-toggle">
            ${this.mode === 'login' 
              ? '¿No tienes cuenta? <a href="#" id="toggle-signup">Crear cuenta</a>' 
              : '¿Ya tienes cuenta? <a href="#" id="toggle-login">Acceder</a>'}
          </div>
          
          <div class="alert alert-info mt-lg" style="font-size: 0.75rem; text-align: center;">
            <span class="alert-icon">${ICONS.info}</span>
            <div>Acceso restringido para personal del SMS (Servicio Murciano de Salud).</div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const form = document.getElementById('login-form');
    const toggleSignup = document.getElementById('toggle-signup');
    const toggleLogin = document.getElementById('toggle-login');

    if (toggleSignup) {
      toggleSignup.addEventListener('click', (e) => {
        e.preventDefault();
        this.mode = 'signup';
        this.render();
      });
    }

    if (toggleLogin) {
      toggleLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.mode = 'login';
        this.render();
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.loading) return;

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('btn-submit-auth');

      this.loading = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Procesando...`;

      try {
        if (this.mode === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          showToast('Bienvenido de nuevo', 'success');
          if (this.onLoginSuccess) this.onLoginSuccess(data.user);
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;
          showToast('Registro completado. Revisa tu email.', 'info');
          this.mode = 'login';
          this.render();
        }
      } catch (err) {
        showToast(err.message || 'Error en la autenticación', 'error');
      } finally {
        this.loading = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = this.mode === 'login' ? 'Entrar' : 'Registrarse';
        }
      }
    });
  }
}
