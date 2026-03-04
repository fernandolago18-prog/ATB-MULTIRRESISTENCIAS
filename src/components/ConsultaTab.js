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
    this.renderEntryScreen();
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
      clCr: null
    };

    this.container.innerHTML = `
      <div class="entry-screen">
        <div class="entry-title">
          <h1>🔬 Nueva Consulta</h1>
          <p>Selecciona cómo quieres empezar la evaluación antimicrobiana</p>
        </div>
        <div class="entry-cards">
          <div class="card card-interactive entry-card" id="entry-by-drug">
            <span class="entry-card-icon">💊</span>
            <h2>Por Fármaco</h2>
            <p>Tengo un fármaco y quiero validar si está indicado</p>
          </div>
          <div class="card card-interactive entry-card" id="entry-by-organism">
            <span class="entry-card-icon">🦠</span>
            <h2>Por Microorganismo</h2>
            <p>Tengo un aislamiento y busco el fármaco recomendado</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('entry-by-drug').addEventListener('click', () => {
      this.state.entryMode = 'drug';
      this.renderCascadeForm();
    });
    document.getElementById('entry-by-organism').addEventListener('click', () => {
      this.state.entryMode = 'organism';
      this.renderCascadeForm();
    });
  }

  // ======================================================================
  // CASCADE FORM
  // ======================================================================
  renderCascadeForm() {
    const isDrugFirst = this.state.entryMode === 'drug';

    this.container.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <button class="btn btn-secondary btn-sm" id="btn-back-entry">← Volver</button>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-icon">${isDrugFirst ? '💊' : '🦠'}</div>
          <div>
            <div class="card-title">${isDrugFirst ? 'Evaluación por Fármaco' : 'Evaluación por Microorganismo'}</div>
            <div class="card-subtitle">Completa los campos progresivamente</div>
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
          <div class="card-icon">📊</div>
          <div>
            <div class="card-title">Antibiograma</div>
            <div class="card-subtitle">Introduce los datos del antibiograma para la evaluación</div>
          </div>
        </div>

        <div class="flex gap-md mb-lg">
          <button class="btn ${this.state.antibiogramMode === 'manual' ? 'btn-primary' : 'btn-secondary'}" id="btn-antibiogram-manual">
            ✏️ Entrada manual
          </button>
          <button class="btn ${this.state.antibiogramMode === 'image' ? 'btn-primary' : 'btn-secondary'}" id="btn-antibiogram-image">
            📷 Subir imagen
          </button>
        </div>

        <div id="antibiogram-content"></div>

        <div class="mt-lg" style="text-align: right;">
          <button class="btn btn-primary btn-lg" id="btn-evaluate">
            🔍 Evaluar Criterios
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
        <div class="upload-zone-icon">📷</div>
        <div class="upload-zone-text">Arrastra una imagen del antibiograma aquí o haz clic para seleccionar</div>
        <div class="upload-zone-hint">Formatos: JPG, PNG, WEBP — Se procesará con Gemini AI</div>
        <input type="file" id="antibiogram-file" accept="image/*" style="display:none" />
      </div>
      <div id="upload-preview-area"></div>
      <div id="gemini-status"></div>
      ${!this.state.geminiApiKey ? `
        <div class="alert alert-warning mt-md">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>API Key necesaria.</strong> Configura tu clave de Gemini para procesar imágenes.
            <button class="btn btn-sm btn-secondary mt-md" id="btn-set-api-key">🔑 Configurar API Key</button>
          </div>
        </div>
      ` : ''}
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.state.geminiApiKey}`,
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
      const funding = evaluateFunding(selectedOrganism, selectedResistance, this.state.selectedDrug, hasAntibiogram);
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
        const funding = evaluateFunding(selectedOrganism, selectedResistance, recommendations[0].drugId, hasAntibiogram);

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

    let drugInfo = '';
    if (result.drug) {
      drugInfo = `
        <div class="dosing-card">
          <h3 style="margin-bottom: var(--space-md);">💊 ${result.drug.abbr} — ${result.drug.name}</h3>
          ${result.recommendation ? `<p style="color:var(--text-secondary); margin-bottom:var(--space-md);">${result.recommendation.rationale}</p>` : ''}
          
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
    if (result.allRecommendations.length > 1) {
      const alts = result.allRecommendations
        .filter(r => r.drugId !== result.drug?.id)
        .map(r => {
          const d = DRUGS[r.drugId];
          return `<li style="padding: var(--space-xs) 0; color: var(--text-secondary);">
            <strong>${d.abbr}</strong> — ${r.rationale} ${r.priority === 1 ? '(1ª línea)' : '(alternativa)'}
          </li>`;
        }).join('');

      if (alts) {
        alternatives = `
          <div class="section-divider">Alternativas terapéuticas</div>
          <ul class="result-criteria">${alts}</ul>
        `;
      }
    }

    // Funding criteria display
    const criteriaItems = [
      ...result.funding.criteria.map(c => `<li style="color:var(--success-text);">${c}</li>`),
      ...result.funding.missing.map(m => `<li style="color:var(--danger-text);">${m}</li>`)
    ].join('');

    section.innerHTML = `
      <div class="result-card ${meetsCls}">
        <div class="result-badge ${meetsCls}">
          <span style="font-size:2rem;">${meetsIcon}</span>
          ${meetsText}
        </div>

        <div class="section-divider">Criterios de Financiación (BIFIMED)</div>
        <ul class="result-criteria">${criteriaItems}</ul>

        ${drugInfo}
        ${alternatives}

        <!-- Save section -->
        <div class="section-divider">Guardar registro</div>
        <div class="flex gap-md items-center" style="flex-wrap:wrap;">
          <button class="btn btn-success" id="btn-save-record">📋 Guardar en Registro</button>
          <button class="btn btn-secondary" id="btn-new-consulta">🔄 Nueva Consulta</button>
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
        <div class="form-group" style="margin-bottom:var(--space-md);">
          <label class="form-label">Aclaramiento de Creatinina (mL/min)</label>
          <input type="number" class="form-input" id="input-clcr" 
            placeholder="Introduce ClCr" min="0" max="250" 
            value="${this.state.clCr || ''}"
            style="max-width:200px;" />
        </div>
        <div id="renal-dose-result"></div>
      </div>
    `;

    document.getElementById('input-clcr').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.state.clCr = isNaN(val) ? null : val;
      this.updateRenalDose();
    });

    if (this.state.clCr) this.updateRenalDose();
  }

  updateRenalDose() {
    const container = document.getElementById('renal-dose-result');
    if (!container || !this.state.result?.drug || this.state.clCr === null) {
      if (container) container.innerHTML = '';
      return;
    }

    const adjusted = getRenalAdjustedDose(this.state.result.drug.id, this.state.clCr);
    if (!adjusted) return;

    container.innerHTML = `
      <div class="renal-adjusted-dose">
        <div class="dosing-item-label">Ajuste renal — ${adjusted.tier}</div>
        <div class="dosing-item-value" style="margin-top:var(--space-xs);">${adjusted.dose}</div>
        ${adjusted.infusion ? `<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:var(--space-xs);">Infusión: ${adjusted.infusion}</div>` : ''}
        ${adjusted.notes ? `<div style="font-size:0.85rem; color:var(--warning-text); margin-top:var(--space-xs);">⚠️ ${adjusted.notes}</div>` : ''}
      </div>
    `;
  }

  // ======================================================================
  // SAVE RECORD
  // ======================================================================
  async saveCurrentRecord() {
    const { result, selectedOrganism, selectedResistance, selectedSite, kpcContext, antibiogramData } = this.state;
    if (!result) return;

    const organism = ORGANISMS[selectedOrganism];
    const resistance = RESISTANCE_MECHANISMS[selectedResistance];
    const site = INFECTION_SITES[selectedSite];

    const record = {
      date: new Date().toISOString(),
      result: result.meets ? 'CUMPLE' : 'NO_CUMPLE',
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
      renalAdjusted: this.state.showRenal,
      clCr: this.state.clCr,
      antibiogram: antibiogramData.filter(r => r.antibiotic && r.sir),
      criteria: [...(result.funding?.criteria || []), ...(result.funding?.missing || [])],
      rationale: result.recommendation?.rationale || ''
    };

    try {
      // Non-blocking save
      saveRecord(record).then(() => {
        if (this.onSave) this.onSave(record);
      }).catch(err => {
        console.error('Save error:', err);
        showToast('Error al guardar', 'error');
      });

      showToast('Registro guardado correctamente', 'success');
    } catch (err) {
      showToast('Error al guardar', 'error');
    }
  }
}
