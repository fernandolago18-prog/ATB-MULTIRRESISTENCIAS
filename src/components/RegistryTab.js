// ============================================================================
// ATB-SMS: Registry Tab (Professional Edition)
// Advanced record management and clinical history
// ============================================================================

import { getRecords, deleteRecord, generatePatientId, isNHC } from '../data/database.js';
import { showToast } from './Toast.js';
import { ICONS } from '../icons.js';
import * as XLSX from 'xlsx';

export class RegistryTab {
  constructor(container) {
    this.container = container;
    this.records = [];
    this.filter = '';
  }

  mount() {
    this.render();
  }

  async refresh() {
    this.records = await getRecords();
    this.renderTable();
  }

  render() {
    this.container.innerHTML = `
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h2>${ICONS.clipboard} Registro de Intervenciones</h2>
          <p class="text-sm text-muted">Historial completo de evaluaciones y cumplimiento BIFIMED</p>
        </div>
        <div class="flex gap-md">
          <div class="form-group" style="margin-bottom:0;">
            <input type="text" class="form-input" id="registry-search" placeholder="Buscar por fármaco, paciente..." style="width:280px;" />
          </div>
          <button class="btn btn-secondary" id="btn-export">${ICONS.download} Exportar</button>
          <button class="btn btn-primary" id="btn-show-id-gen">${ICONS.id} Generar ID</button>
        </div>
      </div>

      <!-- Records Table -->
      <div class="card" style="padding:0; overflow:hidden;">
        <div id="registry-table-container">
          <p class="text-muted text-center" style="padding:var(--space-3xl);">Cargando registros...</p>
        </div>
      </div>
      
      <div id="registry-footer" class="mt-md flex justify-between items-center">
        <div class="text-sm text-muted" id="record-count"></div>
        <div class="text-xs text-muted">Protección de datos activada (Seudonimización)</div>
      </div>
    `;

    this.bindEvents();
    this.refresh();
  }

  bindEvents() {
    document.getElementById('registry-search').addEventListener('input', (e) => {
      this.filter = e.target.value.toLowerCase();
      this.renderTable();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      this.showExportModal();
    });

    document.getElementById('btn-show-id-gen').addEventListener('click', () => {
      this.showIdGeneratorModal();
    });
  }

  showIdGeneratorModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${ICONS.id} Generador de ID Seudonimizado</h3>
        <p class="text-sm text-muted mb-lg">Cumple con la normativa RGPD evitando el uso de NHC directamente.</p>
        
        <div class="form-group">
          <label class="form-label">Iniciales del paciente</label>
          <input type="text" class="form-input" id="input-initials" placeholder="ABC" maxlength="3" style="text-transform:uppercase;" />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de nacimiento</label>
          <input type="date" class="form-input" id="input-birthdate" />
        </div>

        <div id="nhc-warning" class="hidden alert alert-danger mb-md">
          <span class="alert-icon">${ICONS.alertTriangle}</span>
          <div><strong>¡ATENCIÓN!</strong> Has introducido un número (NHC). Usa las iniciales.</div>
        </div>

        <div class="form-group">
          <label class="form-label">ID GENERADO</label>
          <div class="flex gap-sm">
            <input type="text" class="form-input font-mono" id="output-patient-id" readonly placeholder="ABC-XXXX-XXXX" style="background:var(--slate-100); color:var(--primary-700); font-weight:700;" />
            <button class="btn btn-secondary" id="btn-copy-id" title="Copiar">${ICONS.clipboard}</button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-modal-close">Cerrar</button>
          <button class="btn btn-primary" id="btn-generate-now">Generar ID</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const initialsInput = document.getElementById('input-initials');
    const birthInput = document.getElementById('input-birthdate');
    const outputInput = document.getElementById('output-patient-id');
    const warning = document.getElementById('nhc-warning');

    const generate = () => {
      const initials = initialsInput.value;
      const birth = birthInput.value;
      if (isNHC(initials)) {
        warning.classList.remove('hidden');
        outputInput.value = '';
        return;
      }
      warning.classList.add('hidden');
      if (initials && birth) {
        outputInput.value = generatePatientId(initials, birth);
      }
    };

    document.getElementById('btn-generate-now').addEventListener('click', generate);
    document.getElementById('btn-modal-close').addEventListener('click', () => overlay.remove());
    document.getElementById('btn-copy-id').addEventListener('click', () => {
      if (outputInput.value) {
        navigator.clipboard.writeText(outputInput.value);
        showToast('ID copiado al portapapeles', 'info');
      }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  showExportModal() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${ICONS.download} Exportar a Excel</h3>
        <p class="text-sm text-muted mb-lg">Configura el rango de fechas para la exportación de datos.</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-md);">
          <div class="form-group">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="export-date-from" value="${thirtyDaysAgo}" />
          </div>
          <div class="form-group">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="export-date-to" value="${today}" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-export-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-export-confirm">Descargar Excel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-export-cancel').addEventListener('click', () => overlay.remove());
    document.getElementById('btn-export-confirm').addEventListener('click', async () => {
      const from = document.getElementById('export-date-from').value;
      const to = document.getElementById('export-date-to').value;
      const records = await getRecords({ dateFrom: from ? from + 'T00:00:00' : null, dateTo: to ? to + 'T23:59:59' : null });
      this.exportToExcel(records, `${from}_${to}`);
      overlay.remove();
    });
  }

  exportToExcel(records, suffix) {
    if (records.length === 0) {
      showToast('No hay datos en este rango', 'error');
      return;
    }
    const rows = records.map(r => ({
      'Fecha': new Date(r.date).toLocaleString(),
      'Resultado': r.result,
      'Fármaco': r.drugFullName,
      'Microorganismo': r.organismName,
      'Resistencia': r.resistanceName,
      'Localización': r.siteName,
      'Paciente ID': r.patientId,
      'Dosis': r.dose,
      'Ajuste Renal': r.renalAdjusted ? 'Sí' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    XLSX.writeFile(wb, `ATB_SMS_Report_${suffix}.xlsx`);
    showToast('Exportación completada', 'success');
  }

  renderTable() {
    const container = document.getElementById('registry-table-container');
    const countEl = document.getElementById('record-count');

    let filtered = this.records;
    if (this.filter) {
      filtered = filtered.filter(r => 
        r.drugName.toLowerCase().includes(this.filter) ||
        r.drugFullName.toLowerCase().includes(this.filter) ||
        r.organismName.toLowerCase().includes(this.filter) ||
        (r.patientId || '').toLowerCase().includes(this.filter)
      );
    }

    countEl.textContent = `${filtered.length} registro(s) encontrado(s)`;

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-muted text-center" style="padding:var(--space-3xl);">No se encontraron registros.</p>`;
      return;
    }

    const rows = filtered.map(r => `
      <tr class="registry-row" data-id="${r.id}">
        <td>
          <div class="text-xs text-muted">${new Date(r.date).toLocaleDateString()}</div>
          <div style="font-size:0.7rem;">${new Date(r.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        </td>
        <td>
          <div style="font-weight:700; color:var(--slate-900);">${r.drugName}</div>
          <div class="text-xs text-muted">${r.drugFullName}</div>
        </td>
        <td>
          <div style="font-weight:500;">${r.organismName}</div>
          <div class="text-xs text-muted">${r.resistanceName}</div>
        </td>
        <td>
          <span class="sir-badge ${r.result === 'CUMPLE' ? 'sir-S' : 'sir-R'}" style="width:auto; padding:0 8px; height:24px; font-size:0.7rem;">
            ${r.result}
          </span>
        </td>
        <td>
          <div class="font-mono text-xs">${(r.patientId || 'N/A').substring(0, 12)}...</div>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-icon btn-secondary btn-view-details" data-id="${r.id}" title="Ver detalles">${ICONS.fileText}</button>
          <button class="btn btn-icon btn-secondary btn-delete-record" data-id="${r.id}" title="Eliminar">${ICONS.trash}</button>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <table class="registry-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Fármaco</th>
            <th>Microorganismo</th>
            <th>Resultado</th>
            <th>Paciente</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    container.querySelectorAll('.btn-delete-record').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.target.closest('button').dataset.id;
        if (confirm('¿Seguro que deseas eliminar este registro permanentemente?')) {
          await deleteRecord(id);
          showToast('Registro eliminado', 'success');
          this.refresh();
        }
      });
    });

    container.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.target.closest('button').dataset.id;
          const record = this.records.find(r => r.id == id);
          if (record) this.showDetailsModal(record);
        });
    });
  }

  showDetailsModal(r) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 650px;">
        <div class="flex justify-between items-start mb-lg">
          <div>
            <h3>${ICONS.fileText} Detalle de Intervención</h3>
            <p class="text-sm text-muted">ID Registro: ${r.id} | ${new Date(r.date).toLocaleString()}</p>
          </div>
          <span class="sir-badge ${r.result === 'CUMPLE' ? 'sir-S' : 'sir-R'}" style="width:auto; padding:0 12px; height:28px;">
            ${r.result}
          </span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-lg); margin-bottom:var(--space-xl);">
          <div class="dosing-item">
            <div class="dosing-item-label">Fármaco</div>
            <div class="dosing-item-value" style="font-size:1rem;">${r.drugFullName}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Microorganismo</div>
            <div class="dosing-item-value" style="font-size:1rem;">${r.organismName}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Resistencia</div>
            <div class="dosing-item-value" style="font-size:1rem;">${r.resistanceName}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Localización</div>
            <div class="dosing-item-value" style="font-size:1rem;">${r.siteName}</div>
          </div>
        </div>

        <div class="section-divider">Criterios Evaluados</div>
        <ul class="result-criteria" style="margin-bottom:var(--space-xl);">
          ${(r.criteria || []).map(c => `<li>${c}</li>`).join('')}
        </ul>

        <div class="section-divider">Justificación Clínica</div>
        <div style="background:var(--slate-50); padding:var(--space-md); border-radius:var(--radius-md); font-size:0.9rem; color:var(--slate-700); border-left:4px solid var(--primary-300);">
          ${r.rationale || 'No hay justificación adicional.'}
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" id="btn-modal-close">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }
}
