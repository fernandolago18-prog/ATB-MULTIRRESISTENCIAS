// ============================================================================
// ATB-SMS: Consulta Tab
// Main clinical decision flow with cascading forms
// ============================================================================

import {
  DRUGS, ORGANISMS, RESISTANCE_MECHANISMS, INFECTION_SITES,
  KPC_CONTEXT_OPTIONS, ANTIBIOGRAM_ANTIBIOTICS,
  getRecommendation, getOrganismsForDrug, getResistanceForOrganism,
  getSitesForDrug, getRenalAdjustedDose, evaluateFunding,
  getDrugsForOrganismResistance
} from '../data/clinicalData.js';
import { ICONS } from '../icons.js';
import { saveRecord, generatePatientId, isNHC, getGeminiApiKey, saveGeminiApiKey } from '../data/database.js';
import { showToast } from './Toast.js';

export class ConsultaTab {
  constructor(container, onSaveCallback) {
    this.container = container;
    this.onSave = onSaveCallback;
    this.state = {
      entryMode: null,       // 'drug' | 'organism'
      selectedDrug: null,
      selectedOrganism: null,
      selectedResistance: null,
      selectedSite: null,
      kpcContext: null,
      antibiogramData: [],
      antibiogramMode: 'manual', // 'manual' | 'image'
      showRenal: false,
      clCr: null,
      creatinine: null,
      age: null,
      sex: null,
      eGFR: null,
      result: null,
      geminiApiKey: ''
    };
  }

  async mount() {
    // Load API key from Supabase asynchronously
    try {
      const key = await getGeminiApiKey();
      if (key) this.state.geminiApiKey = key;
    } catch (e) {
      console.warn('Could not load Gemini API key:', e.message);
    }
    
    // Attempt to recover state from previous session
    if (this.loadState()) {
      if (this.state.result) {
        this.renderCascadeForm();
        this.renderAntibiogramSection();
        this.renderResult();
      } else if (this.state.selectedSite) {
        this.renderCascadeForm();
        this.renderAntibiogramSection();
      } else if (this.state.entryMode) {
        this.renderCascadeForm();
      } else {
        this.renderEntryScreen();
      }
    } else {
      this.renderEntryScreen();
    }
  }

  saveState() {
    try {
      sessionStorage.setItem('atb_consulta_state', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  loadState() {
    try {
      const saved = sessionStorage.getItem('atb_consulta_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
        return true;
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
    return false;
  }

  clearState() {
    sessionStorage.removeItem('atb_consulta_state');
  }

  // ======================================================================
  // ENTRY SCREEN
  // ======================================================================
  renderEntryScreen() {
    this.state = {
      ...this.state,
      entryMode: null,
      selectedDrug: null,
      selectedOrganism: null,
      selectedResistance: null,
      selectedSite: null,
      kpcContext: null,
      result: null,
      showRenal: false,
      clCr: null,
      antibiogramData: [] // Limpiar antibiograma al volver o nueva consulta
    };

    this.container.innerHTML = `
      <div class="entry-screen">
        <div class="entry-title">
          <h1>${ICONS.stethoscope} Nueva Consulta</h1>
          <p>Selecciona cómo quieres empezar la evaluación antimicrobiana</p>
        </div>
        <div class="entry-cards">
          <div class="card card-interactive entry-card" id="entry-by-drug">
            <span class="entry-card-icon">${ICONS.pill}</span>
            <h2>Por Fármaco</h2>
            <p>Tengo un fármaco y quiero validar si está indicado</p>
          </div>
          <div class="card card-interactive entry-card" id="entry-by-organism">
            <span class="entry-card-icon">${ICONS.bug}</span>
            <h2>Por Microorganismo</h2>
            <p>Tengo un aislamiento y busco el fármaco recomendado</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('entry-by-drug').addEventListener('click', () => {
      this.state.entryMode = 'drug';
      this.saveState();
      this.renderCascadeForm();
    });
    document.getElementById('entry-by-organism').addEventListener('click', () => {
      this.state.entryMode = 'organism';
      this.saveState();
      this.renderCascadeForm();
    });
  }

  // ======================================================================
  // CASCADE FORM
  // ======================================================================
  renderCascadeForm() {
    const isDrugFirst = this.state.entryMode === 'drug';

    this.container.innerHTML = `
      <div style="margin-bottom: var(--space-lg); display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-secondary btn-sm" id="btn-back-entry">← Volver</button>
        <div class="stepper" id="consulta-stepper">
          <div class="step active" data-step="1">1</div>
          <div class="step-line"></div>
          <div class="step" data-step="2">2</div>
          <div class="step-line"></div>
          <div class="step" data-step="3">3</div>
          <div class="step-line"></div>
          <div class="step" data-step="4">4</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-icon">${isDrugFirst ? ICONS.pill : ICONS.bug}</div>
          <div>
            <div class="card-title">${isDrugFirst ? 'Evaluación por Fármaco' : 'Evaluación por Microorganismo'}</div>
            <div class="card-subtitle">Completa los campos progresivamente para obtener el resultado</div>
          </div>
        </div>
        <div id="cascade-form"></div>
      </div>
      <div id="antibiogram-section"></div>
      <div id="result-section"></div>
    `;

    document.getElementById('btn-back-entry').addEventListener('click', () => this.renderEntryScreen());

    if (isDrugFirst) {
      this.renderDrugFirst();
    } else {
      this.renderOrganismFirst();
    }
  }

  updateStepper(currentStep) {
    const steps = document.querySelectorAll('.stepper .step');
    steps.forEach(s => {
      const stepNum = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (stepNum < currentStep) s.classList.add('completed');
      if (stepNum === currentStep) s.classList.add('active');
    });
  }

  // ---- Path A: Drug → Organism → Resistance → Site ----
  renderDrugFirst() {
    const form = document.getElementById('cascade-form');
    const drugOptions = Object.values(DRUGS).map(d =>
      `<option value="${d.id}">${d.abbr} — ${d.name}</option>`
    ).join('');

    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">1. Seleccionar Fármaco</label>
        <select class="form-select" id="select-drug">
          <option value="">— Selecciona un fármaco —</option>
          ${drugOptions}
        </select>
      </div>
      <div id="cascade-step-2"></div>
      <div id="cascade-step-3"></div>
      <div id="cascade-step-4"></div>
    `;

    document.getElementById('select-drug').addEventListener('change', (e) => {
      this.state.selectedDrug = e.target.value || null;
      this.state.selectedOrganism = null;
      this.state.selectedResistance = null;
      this.state.selectedSite = null;
      this.state.kpcContext = null;
      document.getElementById('cascade-step-2').innerHTML = '';
      document.getElementById('cascade-step-3').innerHTML = '';
      document.getElementById('cascade-step-4').innerHTML = '';
      document.getElementById('result-section').innerHTML = '';

      if (this.state.selectedDrug) {
        this.updateStepper(2);
        const drug = DRUGS[this.state.selectedDrug];
        const orgs = getOrganismsForDrug(this.state.selectedDrug);
        const orgOptions = orgs.map(o =>
          `<option value="${o.id}">${o.icon} ${o.name}</option>`
        ).join('');

        document.getElementById('cascade-step-2').innerHTML = `
          <div class="form-group">
            <label class="form-label">2. Microorganismo aislado</label>
            <select class="form-select" id="select-organism">
              <option value="">— Selecciona el microorganismo —</option>
              ${orgOptions}
            </select>
            <div class="form-hint">${drug.mechanism}</div>
          </div>
        `;

        document.getElementById('select-organism').addEventListener('change', (e) => {
          this.state.selectedOrganism = e.target.value || null;
          this.state.selectedResistance = null;
          this.state.selectedSite = null;
          this.state.kpcContext = null;
          document.getElementById('cascade-step-3').innerHTML = '';
          document.getElementById('cascade-step-4').innerHTML = '';
          document.getElementById('result-section').innerHTML = '';

          if (this.state.selectedOrganism) {
            this.updateStepper(3);
            this.renderResistanceStep('cascade-step-3', 3);
          }
        });
      }
    });
  }

  // ---- Path B: Organism → Resistance → Site ----
  renderOrganismFirst() {
    const form = document.getElementById('cascade-form');
    const orgOptions = Object.values(ORGANISMS).map(o =>
      `<option value="${o.id}">${o.icon} ${o.name}</option>`
    ).join('');

    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">1. Microorganismo aislado</label>
        <select class="form-select" id="select-organism">
          <option value="">— Selecciona el microorganismo —</option>
          ${orgOptions}
        </select>
      </div>
      <div id="cascade-step-2"></div>
      <div id="cascade-step-3"></div>
      <div id="cascade-step-4"></div>
    `;

    document.getElementById('select-organism').addEventListener('change', (e) => {
      this.state.selectedOrganism = e.target.value || null;
      this.state.selectedResistance = null;
      this.state.selectedSite = null;
      this.state.selectedDrug = null;
      this.state.kpcContext = null;
      document.getElementById('cascade-step-2').innerHTML = '';
      document.getElementById('cascade-step-3').innerHTML = '';
      document.getElementById('cascade-step-4').innerHTML = '';
      document.getElementById('result-section').innerHTML = '';

      if (this.state.selectedOrganism) {
        this.updateStepper(2);
        this.renderResistanceStep('cascade-step-2', 2);
      }
    });
  }

  // ---- Resistance mechanism step ----
  renderResistanceStep(containerId, stepNum) {
    const org = ORGANISMS[this.state.selectedOrganism];
    if (!org) return;

    const resistances = getResistanceForOrganism(this.state.selectedOrganism);
    const resOptions = resistances.map(r =>
      `<option value="${r.id}">${r.name}</option>`
    ).join('');

    document.getElementById(containerId).innerHTML = `
      <div class="form-group">
        <label class="form-label">${stepNum}. Mecanismo de resistencia</label>
        <select class="form-select" id="select-resistance">
          <option value="">— Selecciona el mecanismo —</option>
          ${resOptions}
        </select>
      </div>
    `;

    document.getElementById('select-resistance').addEventListener('change', (e) => {
      this.state.selectedResistance = e.target.value || null;
      this.state.kpcContext = null;
      this.state.selectedSite = null;

      const nextContainer = `cascade-step-${stepNum + 1}`;
      const nextEl = document.getElementById(nextContainer);
      if (nextEl) nextEl.innerHTML = '';
      document.getElementById('result-section').innerHTML = '';

      if (this.state.selectedResistance) {
        this.updateStepper(stepNum + 1);
        // KPC needs context
        if (this.state.selectedResistance === 'KPC' && this.state.selectedOrganism === 'Enterobacterales') {
          this.renderKPCContext(nextContainer, stepNum + 1);
        } else {
          this.renderSiteStep(nextContainer, stepNum + 1);
        }
      }
    });
  }

  // ---- KPC context question ----
  renderKPCContext(containerId, stepNum) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const contextOptions = KPC_CONTEXT_OPTIONS.map(opt =>
      `<label class="card card-interactive" style="display:block; padding: var(--space-md); margin-bottom: var(--space-sm); cursor:pointer;">
        <input type="radio" name="kpc-context" value="${opt.id}" style="margin-right: var(--space-sm);">
        ${opt.label}
      </label>`
    ).join('');

    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">${stepNum}. Contexto clínico del paciente (KPC)</label>
        ${contextOptions}
      </div>
      <div id="cascade-step-${stepNum + 1}"></div>
    `;

    container.querySelectorAll('input[name="kpc-context"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.kpcContext = e.target.value;
        this.updateStepper(stepNum + 1);
        document.getElementById(`cascade-step-${stepNum + 1}`).innerHTML = '';
        document.getElementById('result-section').innerHTML = '';
        this.renderSiteStep(`cascade-step-${stepNum + 1}`, stepNum + 1);
      });
    });
  }

  // ---- Infection site step ----
  renderSiteStep(containerId, stepNum) {
    let container = document.getElementById(containerId);

    // If container doesn't exist, create it
    if (!container) {
      const parent = document.getElementById('cascade-form');
      const div = document.createElement('div');
      div.id = containerId;
      parent.appendChild(div);
      container = div;
    }

    const siteOptions = Object.values(INFECTION_SITES).map(s =>
      `<option value="${s.id}">${s.abbr} — ${s.name}</option>`
    ).join('');

    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">${stepNum}. Localización de la infección</label>
        <select class="form-select" id="select-site">
          <option value="">— Selecciona la localización —</option>
          ${siteOptions}
        </select>
      </div>
    `;

    document.getElementById('select-site').addEventListener('change', (e) => {
      this.state.selectedSite = e.target.value || null;
      if (this.state.selectedSite) {
        this.renderAntibiogramSection();
      }
    });
  }

  // ======================================================================
  // ANTIBIOGRAM MODULE
  // ======================================================================
  renderAntibiogramSection() {
    const section = document.getElementById('antibiogram-section');

    section.innerHTML = `
      <div class="card mt-xl">
        <div class="card-header">
          <div class="card-icon">${ICONS.activity}</div>
          <div>
            <div class="card-title">Antibiograma</div>
            <div class="card-subtitle">Introduce los datos del antibiograma para la evaluación</div>
          </div>
        </div>

        <div class="form-grid-2 mb-lg">
          <button class="btn ${this.state.antibiogramMode === 'manual' ? 'btn-primary' : 'btn-secondary'}" id="btn-antibiogram-manual">
            ${ICONS.settings} Entrada manual
          </button>
          <button class="btn ${this.state.antibiogramMode === 'image' ? 'btn-primary' : 'btn-secondary'}" id="btn-antibiogram-image">
            ${ICONS.camera} Subir imagen
          </button>
        </div>

        <div id="antibiogram-content"></div>

        <div class="mt-lg" style="text-align: right;">
          <button class="btn btn-primary btn-lg" id="btn-evaluate">
            ${ICONS.search} Evaluar Criterios
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-antibiogram-manual').addEventListener('click', () => {
      this.state.antibiogramMode = 'manual';
      this.renderAntibiogramSection();
    });

    document.getElementById('btn-antibiogram-image').addEventListener('click', () => {
      this.state.antibiogramMode = 'image';
      this.renderAntibiogramSection();
    });

    if (this.state.antibiogramMode === 'manual') {
      this.renderManualAntibiogram();
    } else {
      this.renderImageAntibiogram();
    }

    document.getElementById('btn-evaluate').addEventListener('click', () => this.evaluate());
  }

  renderManualAntibiogram() {
    const content = document.getElementById('antibiogram-content');
    const rows = (this.state.antibiogramData.length > 0
      ? this.state.antibiogramData
      : ANTIBIOGRAM_ANTIBIOTICS.slice(0, 8).map(name => ({ antibiotic: name, mic: '', sir: '' }))
    );

    this.state.antibiogramData = rows;

    const tableRows = rows.map((row, i) => `
      <tr>
        <td>
          <input type="text" value="${row.antibiotic}" data-index="${i}" data-field="antibiotic" 
            class="antibiogram-field" placeholder="Antibiótico" />
        </td>
        <td>
          <input type="text" value="${row.mic}" data-index="${i}" data-field="mic" 
            class="antibiogram-field" placeholder="CMI (mg/L)" style="width:100px" />
        </td>
        <td>
          <select data-index="${i}" data-field="sir" class="antibiogram-field">
            <option value="">—</option>
            <option value="S" ${row.sir === 'S' ? 'selected' : ''}>S</option>
            <option value="I" ${row.sir === 'I' ? 'selected' : ''}>I</option>
            <option value="R" ${row.sir === 'R' ? 'selected' : ''}>R</option>
          </select>
        </td>
        <td>
          <button class="btn btn-icon btn-secondary btn-remove-row" data-index="${i}" title="Eliminar">✕</button>
        </td>
      </tr>
    `).join('');

    content.innerHTML = `
      <div class="table-responsive">
        <table class="antibiogram-table">
          <thead>
            <tr>
              <th>Antibiótico</th>
              <th>CMI (mg/L)</th>
              <th>Categoría</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="antibiogram-tbody">
            ${tableRows}
          </tbody>
        </table>
      </div>
      <button class="btn btn-secondary btn-sm mt-md" id="btn-add-row">+ Añadir fila</button>
    `;

    // Bind field changes
    content.querySelectorAll('.antibiogram-field').forEach(field => {
      field.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const f = e.target.dataset.field;
        this.state.antibiogramData[idx][f] = e.target.value;
      });
      field.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const f = e.target.dataset.field;
        this.state.antibiogramData[idx][f] = e.target.value;
      });
    });

    // Remove row
    content.querySelectorAll('.btn-remove-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.closest('button').dataset.index);
        this.state.antibiogramData.splice(idx, 1);
        this.renderManualAntibiogram();
      });
    });

    // Add row
    document.getElementById('btn-add-row').addEventListener('click', () => {
      this.state.antibiogramData.push({ antibiotic: '', mic: '', sir: '' });
      this.renderManualAntibiogram();
    });
  }

  renderImageAntibiogram() {
    const content = document.getElementById('antibiogram-content');

    content.innerHTML = `
      <div class="upload-zone" id="upload-zone">
        <div class="upload-zone-icon">${ICONS.camera}</div>
        <div class="upload-zone-text">Capturar o Subir Antibiograma</div>
        <div class="upload-zone-hint">Haz una foto directamente o sube un pantallazo</div>
        <input type="file" id="antibiogram-file" accept="image/*" style="display:none" />
      </div>
      <div id="upload-preview-area"></div>
      <div id="gemini-status"></div>
      
      <div class="mt-md" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-sm);">
        ${!this.state.geminiApiKey ? `
          <div class="alert alert-warning" style="flex:1; margin-bottom:0;">
            <span class="alert-icon">${ICONS.alertTriangle}</span>
            <div>
              <strong>API Key necesaria.</strong> Configura tu clave de Gemini.
            </div>
          </div>
        ` : `
          <div class="text-sm text-muted">
            ✓ API Key configurada
          </div>
        `}
        <button class="btn btn-sm btn-secondary" id="btn-set-api-key">
          ${ICONS.key} ${this.state.geminiApiKey ? 'Cambiar API Key' : 'Configurar API Key'}
        </button>
      </div>
    `;

    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('antibiogram-file');

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) this.processAntibiogramImage(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.processAntibiogramImage(e.target.files[0]);
    });

    const btnKey = document.getElementById('btn-set-api-key');
    if (btnKey) btnKey.addEventListener('click', () => this.showApiKeyModal());
  }

  showApiKeyModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>🔑 Configurar API Key de Gemini</h3>
        <p class="text-sm text-muted mb-lg">Introduce tu API Key de Google AI Studio para procesar imágenes de antibiogramas.</p>
        <div class="form-group">
          <label class="form-label">API Key</label>
          <input type="password" class="form-input" id="input-api-key" placeholder="AIzaSy..." value="${this.state.geminiApiKey}" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-modal-save">Guardar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-modal-cancel').addEventListener('click', () => overlay.remove());
    document.getElementById('btn-modal-save').addEventListener('click', async () => {
      const key = document.getElementById('input-api-key').value.trim();
      if (key) {
        this.state.geminiApiKey = key;
        // Save to Supabase asynchronously
        saveGeminiApiKey(key).catch(err => console.error('Error saving API key:', err));
        showToast('API Key guardada en Supabase', 'success');
        overlay.remove();
        this.renderAntibiogramSection();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  async processAntibiogramImage(file) {
    if (!this.state.geminiApiKey) {
      this.showApiKeyModal();
      return;
    }

    const preview = document.getElementById('upload-preview-area');
    const status = document.getElementById('gemini-status');

    // Show preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result.split(',')[1];

      preview.innerHTML = `<img src="${e.target.result}" class="upload-preview" alt="Antibiograma" />`;
      status.innerHTML = `
        <div class="alert alert-info mt-md">
          <span class="spinner" style="margin-right: var(--space-sm);"></span>
          Procesando imagen con Gemini AI...
        </div>
      `;

      try {
        const result = await this.callGeminiAPI(base64Data, file.type);
        this.state.antibiogramData = result;
        this.state.antibiogramMode = 'manual';
        this.renderAntibiogramSection();
        showToast('Antibiograma procesado correctamente', 'success');
      } catch (error) {
        status.innerHTML = `
          <div class="alert alert-danger mt-md">
            <span class="alert-icon">❌</span>
            <div>
              <strong>Error al procesar:</strong> ${error.message}
              <br><small>Verifica tu API Key o intenta con otra imagen.</small>
            </div>
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  }

  async callGeminiAPI(base64Image, mimeType) {
    const prompt = `Analiza esta imagen de un antibiograma clínico. Extrae TODOS los antibióticos visibles con sus valores de CMI (Concentración Mínima Inhibitoria) y su categoría de sensibilidad (S=Sensible, I=Intermedio, R=Resistente).

Devuelve EXCLUSIVAMENTE un JSON array con objetos que tengan estos campos:
- "antibiotic": nombre del antibiótico
- "mic": valor de CMI como string (ejemplo: "0.5", "<=0.25", ">=16")
- "sir": categoría ("S", "I", o "R")

Ejemplo de formato de respuesta:
[{"antibiotic":"Amikacina","mic":"4","sir":"S"},{"antibiotic":"Meropenem","mic":">=16","sir":"R"}]

Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin bloques de código.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.state.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No se encontraron datos en la respuesta');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) throw new Error('Formato de respuesta inesperado');

    return parsed.map(item => ({
      antibiotic: item.antibiotic || '',
      mic: String(item.mic || ''),
      sir: (item.sir || '').toUpperCase()
    }));
  }

  // ======================================================================
  // EVALUATION ENGINE
  // ======================================================================
  evaluate() {
    const { selectedOrganism, selectedResistance, selectedSite, kpcContext, entryMode, antibiogramData } = this.state;

    if (!selectedOrganism || !selectedResistance || !selectedSite) {
      showToast('Completa todos los campos antes de evaluar', 'error');
      return;
    }

    const hasAntibiogram = antibiogramData.some(row => row.sir && row.antibiotic);

    // Get recommendation
    const recommendations = getRecommendation(selectedOrganism, selectedResistance, kpcContext, selectedSite);

    if (entryMode === 'drug' && this.state.selectedDrug) {
      // Evaluate specific drug
      const drug = DRUGS[this.state.selectedDrug];
      const funding = evaluateFunding(selectedOrganism, selectedResistance, this.state.selectedDrug, antibiogramData);
      const isRecommended = recommendations.some(r => r.drugId === this.state.selectedDrug);
      const matchedRec = recommendations.find(r => r.drugId === this.state.selectedDrug);

      this.state.result = {
        meets: funding.meets && isRecommended,
        drug: drug,
        funding: funding,
        recommendation: matchedRec,
        allRecommendations: recommendations,
        mode: 'specific'
      };
    } else {
      // Show recommended drugs
      if (recommendations.length > 0) {
        const topDrug = DRUGS[recommendations[0].drugId];
        const funding = evaluateFunding(selectedOrganism, selectedResistance, recommendations[0].drugId, antibiogramData);

        this.state.result = {
          meets: funding.meets,
          drug: topDrug,
          funding: funding,
          recommendation: recommendations[0],
          allRecommendations: recommendations,
          mode: 'recommended'
        };
      } else {
        this.state.result = {
          meets: false,
          drug: null,
          funding: { meets: false, criteria: [], missing: ['No se encontraron recomendaciones para esta combinación'] },
          allRecommendations: [],
          mode: 'none'
        };
      }
    }

    this.renderResult();
  }

  // ======================================================================
  // RESULT DISPLAY
  // ======================================================================
  renderResult() {
    const section = document.getElementById('result-section');
    const { result } = this.state;
    if (!result) return;

    const meetsCls = result.meets ? 'cumple' : 'no-cumple';
    const meetsText = result.meets ? 'CUMPLE CRITERIOS' : 'NO CUMPLE CRITERIOS';
    const meetsIcon = result.meets ? '✓' : '✗';

    // Incongruity Alert
    let incongruityAlert = '';
    if (result.funding?.incongruities && result.funding.incongruities.length > 0) {
      incongruityAlert = `
        <div class="alert alert-danger mb-lg" style="border-left: 5px solid var(--danger-600); background: var(--danger-50); flex-direction: column; align-items: flex-start;">
          <div style="display:flex; align-items:flex-start; gap:var(--space-sm); margin-bottom: var(--space-xs); width: 100%;">
            <span style="font-size:1.5rem; flex-shrink: 0;">${ICONS.alertTriangle}</span>
            <strong style="text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3;">Alerta de Incongruencia Fenotípica:</strong>
          </div>
          <ul style="margin-top:var(--space-xs); margin-left: 1.5rem; padding-left: 1rem; font-size: 0.95rem; line-height: 1.5; color: var(--danger-700);">
            ${result.funding.incongruities.map(inc => `<li>${inc}</li>`).join('')}
          </ul>
          <p style="margin-top:var(--space-sm); margin-left: 1.5rem; font-size: 0.85rem; font-style:italic;">
            Nota: Revisa los datos del antibiograma o el mecanismo de resistencia seleccionado.
          </p>
        </div>
      `;
    }

    // Contraindication or Non-Recommended Alert
    let contraindicationAlert = '';
    const isNotRecommended = !result.meets && !result.funding?.contraindication && !(result.funding?.incongruities?.length > 0);

    // Site Warning Alert
    let siteWarningAlert = '';
    if (result.recommendation?.siteWarning) {
      siteWarningAlert = `
        <div class="alert alert-warning mb-lg">
          <div style="display:flex; align-items:center; gap:var(--space-sm);">
            <span>${ICONS.alertTriangle}</span>
            <strong>AVISO DE INDICACIÓN:</strong>
          </div>
          <p style="margin-top:var(--space-xs); margin-left:1.8rem;">${result.recommendation.siteWarning}</p>
        </div>
      `;
    }

    // Análisis Clínico Explicativo
    let clinicalAnalysisBlock = '';
    if (result.funding?.clinicalAnalysis) {
        clinicalAnalysisBlock = `
          <div class="alert mb-lg" style="border-left: 4px solid var(--primary); background: var(--blue-50);">
            <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom: var(--space-xs);">
              <span style="color:var(--primary)">${ICONS.info}</span>
              <strong style="color:var(--slate-800);">Análisis Clínico (Guía SMS):</strong>
            </div>
            <p style="margin-top:var(--space-xs); font-size: 0.95rem; color: var(--slate-700); line-height: 1.5;">
              ${result.funding.clinicalAnalysis}
            </p>
          </div>
        `;
    }

    let drugInfo = '';
    if (result.drug) {
      drugInfo = `
        <div class="dosing-card">
          <h3 style="margin-bottom: var(--space-md);">${ICONS.pill} ${result.drug.abbr} — ${result.drug.name}</h3>
          
          <div class="dosing-grid">
            ${result.drug.standardDose.loading ? `
              <div class="dosing-item">
                <div class="dosing-item-label">Dosis de carga</div>
                <div class="dosing-item-value">${result.drug.standardDose.loading}</div>
              </div>
            ` : ''}
            <div class="dosing-item">
              <div class="dosing-item-label">Dosis de mantenimiento</div>
              <div class="dosing-item-value">${result.drug.standardDose.maintenance}</div>
            </div>
            <div class="dosing-item">
              <div class="dosing-item-label">Infusión</div>
              <div class="dosing-item-value">${result.drug.standardDose.infusion}</div>
            </div>
            ${result.drug.standardDose.notes ? `
              <div class="dosing-item" style="grid-column: 1/-1;">
                <div class="dosing-item-label">Notas</div>
                <div class="dosing-item-value" style="font-size:0.9rem; color:var(--text-secondary);">${result.drug.standardDose.notes}</div>
              </div>
            ` : ''}
          </div>

          <!-- Renal Adjustment -->
          <div class="renal-section">
            <div class="toggle-wrapper">
              <label class="toggle">
                <input type="checkbox" id="toggle-renal" ${this.state.showRenal ? 'checked' : ''} />
                <div class="toggle-track"></div>
                <div class="toggle-thumb"></div>
              </label>
              <span class="toggle-label">Insuficiencia Renal</span>
            </div>
            <div id="renal-content"></div>
          </div>
        </div>
      `;
    }

    // Alternative recommendations
    let alternatives = '';
    if (result.allRecommendations.length > 0) {
      const filteredAlts = result.allRecommendations.filter(r => r.drugId !== result.drug?.id);
      if (filteredAlts.length > 0) {
        const alts = filteredAlts.map(r => {
          const d = DRUGS[r.drugId];
          return `<li style="padding: var(--space-xs) 0; color: var(--text-secondary);">
            <strong style="color:var(--slate-800);">${d.abbr}</strong> — ${r.rationale} 
            <span class="badge ${r.priority === 1 ? 'badge-success' : 'badge-secondary'}" style="font-size:0.7rem; margin-left:var(--space-xs);">
              ${r.priority === 1 ? 'Elección' : 'Alternativa'}
            </span>
          </li>`;
        }).join('');

        alternatives = `
          <div class="section-divider">Otras opciones recomendadas</div>
          <ul class="result-criteria" style="margin-bottom:var(--space-lg);">${alts}</ul>
        `;
      }
    }

    // Funding criteria display
    const criteriaItems = [
      ...result.funding.criteria.map(c => {
         const isOk = c.includes('✓');
         const isWarn = c.includes('⚠');
         const color = isOk ? 'var(--success-text)' : (isWarn ? 'var(--warning-text)' : 'var(--danger-text)');
         return `<li style="color:${color}; font-weight:500;">${c}</li>`;
      }),
      ...result.funding.missing.map(m => `<li style="color:var(--danger-text); font-weight:500;">${m}</li>`)
    ].join('');

    section.innerHTML = `
      <div class="result-card ${meetsCls}">
        <div class="result-badge ${meetsCls}">
          <span style="font-size:2rem;">${meetsIcon}</span>
          ${meetsText}
        </div>

        ${incongruityAlert}
        ${clinicalAnalysisBlock}
        ${siteWarningAlert}

        <div class="section-divider">Evaluación de Criterios (BIFIMED / SMS)</div>
        <ul class="result-criteria">${criteriaItems}</ul>

        ${drugInfo}
        ${alternatives}

        <!-- Save section -->
        <div class="section-divider">Guardar registro</div>
        <div class="flex gap-md items-center" style="flex-wrap:wrap;">
          <button class="btn btn-success" id="btn-save-record">${ICONS.save} Guardar en Registro</button>
          <button class="btn btn-secondary" id="btn-new-consulta">${ICONS.refresh} Nueva Consulta</button>
        </div>
      </div>
    `;

    // Renal toggle
    const renalToggle = document.getElementById('toggle-renal');
    if (renalToggle) {
      renalToggle.addEventListener('change', (e) => {
        this.state.showRenal = e.target.checked;
        this.renderRenalContent();
      });
      if (this.state.showRenal) this.renderRenalContent();
    }

    // Save button
    document.getElementById('btn-save-record').addEventListener('click', () => this.saveCurrentRecord());
    document.getElementById('btn-new-consulta').addEventListener('click', () => this.renderEntryScreen());

    // Scroll to result
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderRenalContent() {
    const container = document.getElementById('renal-content');
    if (!container) return;

    if (!this.state.showRenal) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="mt-md">
        <div class="form-label" style="margin-bottom:var(--space-sm); font-size:0.85rem; color:var(--text-muted);">Cálculo automático del Filtrado Glomerular (CKD-EPI 2021)</div>
        <div class="form-grid-3" style="margin-bottom:var(--space-md);">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Creatinina sérica (mg/dL)</label>
            <input type="number" class="form-input" id="input-creatinine" 
              placeholder="Ej: 1.2" min="0.1" max="20" step="0.01"
              value="${this.state.creatinine || ''}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Edad (años)</label>
            <input type="number" class="form-input" id="input-age" 
              placeholder="Ej: 65" min="18" max="120"
              value="${this.state.age || ''}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Sexo</label>
            <select class="form-select" id="select-sex">
              <option value="">— Selecciona —</option>
              <option value="M" ${this.state.sex === 'M' ? 'selected' : ''}>Masculino</option>
              <option value="F" ${this.state.sex === 'F' ? 'selected' : ''}>Femenino</option>
            </select>
          </div>
        </div>
        <div id="egfr-result"></div>
        <div id="renal-dose-result"></div>
      </div>
    `;

    // Bind events
    const onInput = () => this.calculateCKDEPI();
    document.getElementById('input-creatinine').addEventListener('input', (e) => {
      this.state.creatinine = parseFloat(e.target.value) || null;
      onInput();
    });
    document.getElementById('input-age').addEventListener('input', (e) => {
      this.state.age = parseInt(e.target.value) || null;
      onInput();
    });
    document.getElementById('select-sex').addEventListener('change', (e) => {
      this.state.sex = e.target.value || null;
      onInput();
    });

    // Restore previous calculation
    if (this.state.creatinine && this.state.age && this.state.sex) {
      this.calculateCKDEPI();
    }
  }

  /**
   * CKD-EPI 2021 (race-free) formula
   * eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^(-1.200) × 0.9938^Age × (1.012 if female)
   * κ = 0.7 (F), 0.9 (M)
   * α = -0.241 (F), -0.302 (M)
   */
  calculateCKDEPI() {
    const { creatinine, age, sex } = this.state;
    const egfrResult = document.getElementById('egfr-result');

    if (!creatinine || !age || !sex || creatinine <= 0) {
      this.state.eGFR = null;
      this.state.clCr = null;
      if (egfrResult) egfrResult.innerHTML = '';
      const doseResult = document.getElementById('renal-dose-result');
      if (doseResult) doseResult.innerHTML = '';
      return;
    }

    const kappa = sex === 'F' ? 0.7 : 0.9;
    const alpha = sex === 'F' ? -0.241 : -0.302;
    const sexMultiplier = sex === 'F' ? 1.012 : 1.0;

    const scrKappa = creatinine / kappa;
    const minTerm = Math.pow(Math.min(scrKappa, 1), alpha);
    const maxTerm = Math.pow(Math.max(scrKappa, 1), -1.200);

    const eGFR = Math.round(142 * minTerm * maxTerm * Math.pow(0.9938, age) * sexMultiplier);

    this.state.eGFR = eGFR;
    this.state.clCr = eGFR; // Use eGFR as the value for dose adjustment

    // Determine category and color
    let category, color, stage;
    if (eGFR >= 90) { category = 'Normal o alto'; color = 'var(--success-text)'; stage = 'G1'; }
    else if (eGFR >= 60) { category = 'Ligeramente disminuido'; color = 'var(--success-text)'; stage = 'G2'; }
    else if (eGFR >= 45) { category = 'Descenso leve-moderado'; color = 'var(--warning-text)'; stage = 'G3a'; }
    else if (eGFR >= 30) { category = 'Descenso moderado-grave'; color = 'var(--warning-text)'; stage = 'G3b'; }
    else if (eGFR >= 15) { category = 'Descenso grave'; color = 'var(--danger-text)'; stage = 'G4'; }
    else { category = 'Fallo renal'; color = 'var(--danger-text)'; stage = 'G5'; }

    if (egfrResult) {
      egfrResult.innerHTML = `
        <div style="display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md); border-radius:var(--radius-md); background:var(--slate-100); margin-bottom:var(--space-md); border: 1px solid var(--slate-200);">
          <div style="text-align:center; min-width:80px;">
            <div style="font-size:2rem; font-weight:800; font-family:var(--font-mono); color:${color};">${eGFR}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">mL/min/1.73m²</div>
          </div>
          <div style="flex:1;">
            <div style="font-weight:600; color:${color};">${stage} — ${category}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">FGe calculado por CKD-EPI 2021 | Cr ${creatinine} mg/dL, ${age} años, ${sex === 'F' ? 'Mujer' : 'Varón'}</div>
          </div>
        </div>
      `;
    }

    this.updateRenalDose();
  }

  updateRenalDose() {
    const container = document.getElementById('renal-dose-result');
    if (!container || !this.state.result?.drug || this.state.clCr === null) {
      if (container) container.innerHTML = '';
      return;
    }

    const drug = this.state.result.drug;
    const adjusted = getRenalAdjustedDose(drug.id, this.state.clCr);
    if (!adjusted) return;

    const needsAdjustment = this.state.clCr < (drug.renalAdjustment?.normal?.threshold || 50);

    container.innerHTML = `
      <div class="renal-adjusted-box ${needsAdjustment ? 'needs-adjustment' : ''}">
        ${needsAdjustment ? `
          <div class="alert alert-danger" style="margin-bottom:var(--space-md); border-left:4px solid var(--danger-text);">
            <div style="font-weight:700; display:flex; align-items:center; gap:var(--space-xs);">
              <span>${ICONS.alertTriangle}</span> AJUSTE DE DOSIS REQUERIDO
            </div>
            <div style="font-size:0.85rem; margin-top:2px;">El filtrado glomerular (${this.state.clCr} mL/min) es inferior al umbral del fármaco.</div>
          </div>
        ` : `
          <div class="alert alert-success" style="margin-bottom:var(--space-md); border-left:4px solid var(--success-text);">
            <div style="font-weight:700;">${ICONS.checkCircle} FUNCIÓN RENAL NORMAL</div>
            <div style="font-size:0.85rem; margin-top:2px;">No se requiere ajuste de dosis para este nivel de filtrado.</div>
          </div>
        `}

        <div class="form-grid-2">
          <div class="pauta-compare">
            <div class="pauta-label">Pauta Estándar</div>
            <div class="pauta-value standard">${drug.standardDose.maintenance}</div>
            <div class="pauta-notes">Filt. >${drug.renalAdjustment?.normal?.threshold || 50} mL/min</div>
          </div>
          <div class="pauta-compare">
            <div class="pauta-label">Pauta Recomendada</div>
            <div class="pauta-value adjusted">${adjusted.dose}</div>
            <div class="pauta-notes">${adjusted.tier}</div>
          </div>
        </div>

        ${adjusted.loading ? `
          <div style="margin-top:var(--space-md); padding-top:var(--space-sm); border-top:1px dashed var(--slate-300);">
            <div class="pauta-label">Dosis de Carga (Ajustada)</div>
            <div style="font-weight:700; color:var(--danger-text);">${adjusted.loading}</div>
          </div>
        ` : ''}

        ${adjusted.notes || adjusted.infusion ? `
          <div class="mt-md pauta-clinical-notes">
            <strong>Notas clínicas:</strong> ${adjusted.infusion ? `Infusión de ${adjusted.infusion}. ` : ''} ${adjusted.notes || ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ======================================================================
  // SAVE & PSEUDONYMIZATION
  // ======================================================================
  showPseudonymizerModal() {
    const { result } = this.state;
    if (!result) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal pseudonym-modal" style="max-width:500px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
          <h3 style="margin:0;">${ICONS.lock} Pseudonimización del Paciente</h3>
          <button class="btn-close" id="btn-modal-close" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
        </div>
        
        <div class="alert alert-warning mb-lg" style="font-size:0.85rem;">
          <strong>AVISO DE SEGURIDAD (GDPR):</strong> No introduzcas el nombre, apellidos, DNI ni NHC del paciente. Genera un identificador pseudonimizado para el registro clínico.
        </div>

        <div class="form-group">
          <label class="form-label">Iniciales (2-3 letras)</label>
          <input type="text" class="form-input" id="ps-initials" placeholder="Ej: FGM" maxlength="3" style="text-transform:uppercase;" />
        </div>

        <div class="form-group">
          <label class="form-label">Fecha de Nacimiento</label>
          <input type="date" class="form-input" id="ps-birthdate" />
        </div>

        <div class="form-group">
          <label class="form-label">Unidad / Servicio (en MAYÚSCULAS)</label>
          <input type="text" class="form-input" id="ps-unit" placeholder="Ej: UCI, MEDICINA INTERNA, URGENCIAS" style="text-transform:uppercase;" />
        </div>

        <div class="pseudonym-result-box" id="ps-result-area" style="display:none;">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:var(--space-xs);">ID PSEUDONIMIZADO GENERADO</div>
          <div id="ps-generated-id" style="font-family:var(--font-mono); font-size:1.25rem; font-weight:800; color:var(--primary); letter-spacing:1px;"></div>
        </div>

        <div class="modal-actions mt-xl">
          <button class="btn btn-secondary" id="btn-ps-generate">${ICONS.refresh} Generar Código</button>
          <button class="btn btn-success" id="btn-ps-confirm" disabled>${ICONS.save} Confirmar y Guardar Registro</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const inputInitials = document.getElementById('ps-initials');
    const inputBirth = document.getElementById('ps-birthdate');
    const btnGenerate = document.getElementById('btn-ps-generate');
    const btnConfirm = document.getElementById('btn-ps-confirm');
    const resultArea = document.getElementById('ps-result-area');
    const resultText = document.getElementById('ps-generated-id');

    let generatedId = null;

    const onGenerate = () => {
      const initials = inputInitials.value.trim();
      const birthdate = inputBirth.value;
      const unit = document.getElementById('ps-unit').value.trim().toUpperCase();

      if (!initials || !birthdate || !unit) {
        showToast('Introduce iniciales, fecha y unidad', 'error');
        return;
      }

      generatedId = generatePatientId(initials, birthdate);
      this.state.currentUnit = unit; // Temporary store unit
      resultText.innerText = generatedId;
      resultArea.style.display = 'block';
      btnConfirm.disabled = false;
      showToast('Código generado correctamente', 'success');
    };

    btnGenerate.addEventListener('click', onGenerate);

    btnConfirm.addEventListener('click', async () => {
      if (!generatedId) return;
      
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = `<span class="spinner" style="width:16px; height:16px;"></span> Guardando...`;

      try {
        await this.performFinalSave(generatedId);
        overlay.remove();
        this.renderEntryScreen(); // Reset after save
      } catch (err) {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = `${ICONS.save} Confirmar y Guardar Registro`;
      }
    });

    document.getElementById('btn-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  async performFinalSave(patientId) {
    const { result, selectedOrganism, selectedResistance, selectedSite, kpcContext, antibiogramData, clCr, eGFR, creatinine, age, sex, showRenal } = this.state;
    
    // Get current authenticated user
    const { data: { user } } = await import('../data/supabaseClient.js').then(m => m.supabase.auth.getUser());
    const userEmail = user?.email || 'Usuario anónimo';

    const organism = ORGANISMS[selectedOrganism];
    const resistance = RESISTANCE_MECHANISMS[selectedResistance];
    const site = INFECTION_SITES[selectedSite];

    const record = {
      date: new Date().toISOString(),
      result: result.meets ? 'CUMPLE' : 'NO_CUMPLE',
      patientId: patientId,
      unit: this.state.currentUnit || 'N/A',
      createdBy: userEmail, // New audit field
      drugId: result.drug?.id || null,
      drugName: result.drug?.abbr || 'N/A',
      drugFullName: result.drug?.name || 'N/A',
      organismId: selectedOrganism,
      organismName: organism?.name || 'N/A',
      resistanceId: selectedResistance,
      resistanceName: resistance?.name || 'N/A',
      siteId: selectedSite,
      siteName: site?.name || 'N/A',
      kpcContext: kpcContext,
      dose: result.drug?.standardDose?.maintenance || 'N/A',
      renalAdjusted: showRenal,
      clCr: clCr,
      eGFR: eGFR,
      creatinine: creatinine,
      patientAge: age,
      patientSex: sex,
      antibiogram: antibiogramData.filter(r => r.antibiotic && r.sir),
      criteria: [...(result.funding?.criteria || []), ...(result.funding?.missing || [])],
      rationale: result.recommendation?.rationale || ''
    };

    try {
      await saveRecord(record);
      if (this.onSave) this.onSave(record);
      showToast('Registro guardado y pseudonimizado correctamente', 'success');
    } catch (err) {
      console.error('Final save error:', err);
      showToast('Error al guardar en el servidor', 'error');
      throw err;
    }
  }

  async saveCurrentRecord() {
    this.showPseudonymizerModal();
  }
}
