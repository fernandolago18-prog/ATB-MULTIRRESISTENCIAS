// ============================================================================
// ATB-SMS: Registry Tab (Professional Edition)
// Advanced record management and clinical history
// ============================================================================

import { getRecords, deleteRecord } from '../data/database.js';
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
          <p class="text-sm text-muted">Historial completo de evaluaciones y cumplimiento BIFIMED / SMS</p>
        </div>
        <div class="flex gap-md" style="flex-wrap:wrap; width:100%; max-width:450px;">
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:200px;">
            <input type="text" class="form-input" id="registry-search" placeholder="Buscar por fármaco, paciente..." style="width:100%;" />
          </div>
          <button class="btn btn-secondary" id="btn-export" style="flex-shrink:0;">${ICONS.download} Exportar a Excel</button>
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
        <div class="text-xs text-muted">${ICONS.lock} Protección de datos activa (GDPR - Pseudonimización)</div>
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
  }

  showExportModal() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <h3>${ICONS.download} Exportar Datos</h3>
        <p class="text-sm text-muted mb-lg">Rango de fechas para la exportación completa de registros.</p>
        <div class="form-grid-2">
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
      const records = await getRecords({ 
        dateFrom: from ? from + 'T00:00:00' : null, 
        dateTo: to ? to + 'T23:59:59' : null 
      });
      this.exportToExcel(records, `${from}_${to}`);
      overlay.remove();
    });
  }

  exportToExcel(records, suffix) {
    if (records.length === 0) {
      showToast('No hay datos en este rango', 'error');
      return;
    }
    
    // EXPORT ALL DATA COLUMNS
    const rows = records.map(r => ({
      'Fecha/Hora': new Date(r.date).toLocaleString(),
      'Usuario (Facultativo)': r.createdBy || 'N/A',
      'Paciente ID': r.patientId,
      'Unidad/Servicio': r.unit || 'N/A',
      'Resultado': r.result,
      'Fármaco (Abbr)': r.drugName,
      'Fármaco (Completo)': r.drugFullName,
      'Microorganismo': r.organismName,
      'Resistencia': r.resistanceName,
      'Localización': r.siteName,
      'Contexto KPC': r.kpcContext || 'N/A',
      'Pauta Prescrita': r.dose,
      'Ajuste Renal': r.renalAdjusted ? 'SÍ' : 'NO',
      'Creatinina (mg/dL)': r.creatinine || 'N/A',
      'eGFR/ClCr (mL/min)': r.clCr || 'N/A',
      'Edad Paciente': r.patientAge || 'N/A',
      'Sexo Paciente': r.patientSex || 'N/A',
      'Criterios Evaluados': (r.criteria || []).join('; '),
      'Justificación Clínica': r.rationale || 'N/A',
      'Antibiograma (Resumen)': (r.antibiogram || []).map(a => `${a.antibiotic}:${a.sir}`).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial ATB-SMS');
    XLSX.writeFile(wb, `Registro_Intervenciones_ATB_${suffix}.xlsx`);
    showToast('Archivo Excel generado con éxito', 'success');
  }

  renderTable() {
    const container = document.getElementById('registry-table-container');
    const countEl = document.getElementById('record-count');

    let filtered = this.records;
    if (this.filter) {
      filtered = filtered.filter(r => 
        (r.drugName || '').toLowerCase().includes(this.filter) ||
        (r.drugFullName || '').toLowerCase().includes(this.filter) ||
        (r.organismName || '').toLowerCase().includes(this.filter) ||
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
        <td data-label="Fecha">
          <div class="text-xs text-muted">${new Date(r.date).toLocaleDateString()}</div>
          <div style="font-size:0.7rem;">${new Date(r.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        </td>
        <td data-label="Fármaco">
          <div style="font-weight:700; color:var(--slate-900);">${r.drugName}</div>
          <div class="text-xs text-muted">${r.drugFullName}</div>
        </td>
        <td data-label="Microorganismo">
          <div style="font-weight:500;">${r.organismName}</div>
          <div class="text-xs text-muted">${r.resistanceName}</div>
        </td>
        <td data-label="Resultado">
          <span class="sir-badge ${r.result === 'CUMPLE' ? 'sir-S' : 'sir-R'}" style="width:auto; padding:0 8px; height:24px; font-size:0.7rem;">
            ${r.result}
          </span>
        </td>
        <td data-label="Paciente">
          <div class="font-mono text-xs" title="${r.patientId}">${(r.patientId || 'N/A').substring(0, 15)}...</div>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-icon btn-secondary btn-view-details" data-id="${r.id}" title="Ver todos los detalles">${ICONS.fileText}</button>
          <button class="btn btn-icon btn-secondary btn-delete-record" data-id="${r.id}" title="Eliminar">${ICONS.trash}</button>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="registry-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Fármaco</th>
              <th>Microorganismo</th>
              <th>Resultado</th>
              <th>Paciente (ID)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
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
    
    // Create Antibiogram Table
    let antibiogramHtml = '<p class="text-muted text-xs">No se registró antibiograma en esta consulta.</p>';
    if (r.antibiogram && r.antibiogram.length > 0) {
      antibiogramHtml = `
        <table class="antibiogram-table mini">
          <thead><tr><th>ATB</th><th>CMI</th><th>S/I/R</th></tr></thead>
          <tbody>
            ${r.antibiogram.map(a => `<tr><td>${a.antibiotic}</td><td>${a.mic || '-'}</td><td><strong>${a.sir}</strong></td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    overlay.innerHTML = `
      <div class="modal" style="max-width: 800px; width:95%; max-height:90vh; overflow-y:auto;">
        <div class="flex justify-between items-start mb-lg">
          <div>
            <h3>${ICONS.fileText} Detalle Completo de Consulta</h3>
            <div class="font-mono text-sm" style="background:var(--slate-100); padding:4px 8px; border-radius:4px; margin-top:4px;">
              PACIENTE: ${r.patientId || 'N/A'}
            </div>
          </div>
          <button class="btn btn-icon" id="btn-modal-close-top">✕</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-md); margin-bottom:var(--space-xl);">
          <div class="dosing-item">
            <div class="dosing-item-label">Fecha y Hora</div>
            <div class="dosing-item-value">${new Date(r.date).toLocaleString()}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Resultado Evaluación</div>
            <div class="dosing-item-value">
              <span class="badge ${r.result === 'CUMPLE' ? 'badge-success' : 'badge-danger'}">${r.result}</span>
            </div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Microorganismo</div>
            <div class="dosing-item-value">${r.organismName}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Resistencia</div>
            <div class="dosing-item-value">${r.resistanceName}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Facultativo</div>
            <div class="dosing-item-value" style="font-size:0.8rem;">${r.createdBy || 'N/A'}</div>
          </div>
          <div class="dosing-item">
            <div class="dosing-item-label">Unidad / Servicio</div>
            <div class="dosing-item-value" style="color:var(--primary-700); font-weight:700;">${r.unit || 'N/A'}</div>
          </div>
        </div>

        <div class="section-divider">Datos del Fármaco y Pauta</div>
        <div class="dosing-card" style="margin-bottom:var(--space-lg); border-color:var(--primary-200);">
          <div style="font-weight:700; color:var(--primary-700); font-size:1.1rem; margin-bottom:var(--space-xs);">${r.drugFullName} (${r.drugName})</div>
          <div class="form-grid-2">
            <div>
              <div class="dosing-item-label">Dosis Prescrita</div>
              <div class="dosing-item-value" style="color:var(--success-text);">${r.dose}</div>
            </div>
            <div>
              <div class="dosing-item-label">Localización de Infección</div>
              <div class="dosing-item-value">${r.siteName}</div>
            </div>
          </div>
          ${r.kpcContext ? `<div class="mt-sm text-xs text-muted"><strong>Contexto clínico:</strong> ${r.kpcContext}</div>` : ''}
        </div>

        <div class="section-divider">Evaluación Renal</div>
        <div class="flex gap-lg items-center" style="margin-bottom:var(--space-lg); padding:var(--space-md); background:var(--slate-50); border-radius:var(--radius-md);">
          <div class="text-center" style="min-width:100px; border-right:1px solid var(--slate-200); padding-right:var(--space-md);">
             <div class="text-xs text-muted">FGe Calculado</div>
             <div style="font-size:1.5rem; font-weight:800; color:var(--primary);">${r.clCr || 'N/A'}</div>
             <div class="text-xs">mL/min</div>
          </div>
          <div class="form-grid-3" style="flex:1; gap:var(--space-sm);">
             <div><span class="text-xs text-muted">Creatinina:</span> <span class="text-sm font-bold">${r.creatinine || '-'} mg/dL</span></div>
             <div><span class="text-xs text-muted">Edad:</span> <span class="text-sm font-bold">${r.patientAge || '-'} años</span></div>
             <div><span class="text-xs text-muted">Sexo:</span> <span class="text-sm font-bold">${r.patientSex || '-'}</span></div>
             <div style="grid-column: 1/-1;"><span class="text-xs text-muted">¿Requirió ajuste?:</span> <span class="badge ${r.renalAdjusted ? 'badge-danger' : 'badge-success'}">${r.renalAdjusted ? 'SÍ (Pauta ajustada)' : 'NO (Pauta normal)'}</span></div>
          </div>
        </div>

        <div class="form-grid-2" style="gap:var(--space-lg); margin-bottom:var(--space-xl);">
          <div>
            <div class="section-divider">Criterios SMS / BIFIMED</div>
            <ul class="result-criteria">
              ${(r.criteria || []).map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
          <div>
            <div class="section-divider">Aislamiento (Antibiograma)</div>
            ${antibiogramHtml}
          </div>
        </div>

        <div class="section-divider">Racional y Justificación Clínica</div>
        <div style="background:var(--slate-50); padding:var(--space-md); border-radius:var(--radius-md); font-size:0.9rem; color:var(--slate-700); border-left:4px solid var(--primary-300); margin-bottom:var(--space-xl);">
          ${r.rationale || 'Sin justificación registrada.'}
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" id="btn-modal-close">${ICONS.checkCircle} Entendido</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    const close = () => overlay.remove();
    document.getElementById('btn-modal-close').addEventListener('click', close);
    document.getElementById('btn-modal-close-top').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }
}
