// ============================================================================
// ATB-SMS: Registry Tab
// Record management with pseudonymized patient IDs
// ============================================================================

import { getRecords, deleteRecord, generatePatientId, isNHC, saveRecord } from '../data/database.js';
import { showToast } from './Toast.js';

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
          <h2>📋 Registro de Intervenciones</h2>
          <p class="text-sm text-muted">Historial de evaluaciones y comprobaciones</p>
        </div>
        <div class="flex gap-md">
          <input type="text" class="form-input" id="registry-search" placeholder="🔍 Buscar..." style="width:250px;" />
          <button class="btn btn-secondary" id="btn-export">📥 Exportar</button>
        </div>
      </div>

      <!-- NHC Warning -->
      <div class="alert alert-danger mb-lg">
        <span class="alert-icon">🚫</span>
        <div>
          <strong>PROTECCIÓN DE DATOS:</strong> Nunca introduzcas el Número de Historia Clínica (NHC) directamente. 
          Usa el generador de ID seudonimizado para identificar pacientes.
        </div>
      </div>

      <!-- Pseudonymized ID Generator -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-icon">🆔</div>
          <div>
            <div class="card-title">Generador de ID Seudonimizado</div>
            <div class="card-subtitle">Genera un ID seguro basado en iniciales y fecha</div>
          </div>
        </div>
        <div class="flex gap-md items-center" style="flex-wrap:wrap;">
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:150px;">
            <label class="form-label">Iniciales</label>
            <input type="text" class="form-input" id="input-initials" placeholder="ABC" maxlength="3" style="text-transform:uppercase;" />
          </div>
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:150px;">
            <label class="form-label">Fecha nacimiento</label>
            <input type="date" class="form-input" id="input-birthdate" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-primary" id="btn-generate-id">Generar ID</button>
          </div>
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:200px;">
            <label class="form-label">ID Generado</label>
            <input type="text" class="form-input font-mono" id="output-patient-id" readonly placeholder="Se generará aquí..." style="background:var(--bg-800);" />
          </div>
        </div>

        <!-- NHC Blocker -->
        <div id="nhc-warning" class="hidden alert alert-danger mt-md">
          <span class="alert-icon">🚨</span>
          <div>
            <strong>¡ATENCIÓN!</strong> El valor introducido parece ser un NHC (solo dígitos). 
            <br>Esto NO está permitido. Usa las iniciales del paciente.
          </div>
        </div>
      </div>

      <!-- Records Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon">📑</div>
          <div>
            <div class="card-title">Registros guardados</div>
            <div class="card-subtitle" id="record-count">Cargando...</div>
          </div>
        </div>
        <div id="registry-table-container">
          <p class="text-muted text-center" style="padding:var(--space-xl);">Cargando registros...</p>
        </div>
      </div>
    `;

        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        document.getElementById('btn-generate-id').addEventListener('click', () => {
            const initials = document.getElementById('input-initials').value;
            const birthdate = document.getElementById('input-birthdate').value;

            // Check NHC
            if (isNHC(initials)) {
                document.getElementById('nhc-warning').classList.remove('hidden');
                document.getElementById('output-patient-id').value = '';
                return;
            }

            document.getElementById('nhc-warning').classList.add('hidden');
            const id = generatePatientId(initials, birthdate);
            document.getElementById('output-patient-id').value = id;
        });

        document.getElementById('input-initials').addEventListener('input', (e) => {
            if (isNHC(e.target.value)) {
                document.getElementById('nhc-warning').classList.remove('hidden');
            } else {
                document.getElementById('nhc-warning').classList.add('hidden');
            }
        });

        document.getElementById('registry-search').addEventListener('input', (e) => {
            this.filter = e.target.value.toLowerCase();
            this.renderTable();
        });

        document.getElementById('btn-export').addEventListener('click', async () => {
            const records = await getRecords();
            const json = JSON.stringify(records, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `atb-sms-registros-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Registros exportados', 'success');
        });
    }

    renderTable() {
        const container = document.getElementById('registry-table-container');
        const countEl = document.getElementById('record-count');

        let records = this.records;

        if (this.filter) {
            records = records.filter(r =>
                (r.drugName || '').toLowerCase().includes(this.filter) ||
                (r.organismName || '').toLowerCase().includes(this.filter) ||
                (r.resistanceName || '').toLowerCase().includes(this.filter) ||
                (r.patientId || '').toLowerCase().includes(this.filter) ||
                (r.result || '').toLowerCase().includes(this.filter)
            );
        }

        countEl.textContent = `${records.length} registro${records.length !== 1 ? 's' : ''}`;

        if (records.length === 0) {
            container.innerHTML = `
        <p class="text-muted text-center" style="padding:var(--space-xl);">
          ${this.filter ? 'Sin resultados para esta búsqueda' : 'No hay registros guardados. Realiza una consulta y guárdala.'}
        </p>
      `;
            return;
        }

        const rows = records.map(r => {
            const date = r.date ? new Date(r.date).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : 'N/A';

            const resultBadge = r.result === 'CUMPLE'
                ? '<span class="sir-badge sir-S">✓</span>'
                : '<span class="sir-badge sir-R">✗</span>';

            return `
        <tr>
          <td style="font-size:0.8rem; color:var(--text-muted);">${date}</td>
          <td><strong>${r.drugName || 'N/A'}</strong></td>
          <td>${r.organismName || 'N/A'}</td>
          <td>${r.resistanceName || 'N/A'}</td>
          <td>${r.siteName || 'N/A'}</td>
          <td>${resultBadge}</td>
          <td>
            <button class="btn btn-icon btn-secondary btn-delete-record" data-id="${r.id}" title="Eliminar">🗑</button>
          </td>
        </tr>
      `;
        }).join('');

        container.innerHTML = `
      <table class="registry-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Fármaco</th>
            <th>Microorganismo</th>
            <th>Resistencia</th>
            <th>Localización</th>
            <th>Resultado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

        container.querySelectorAll('.btn-delete-record').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.target.closest('button').dataset.id);
                if (confirm('¿Eliminar este registro?')) {
                    await deleteRecord(id);
                    showToast('Registro eliminado', 'success');
                    this.refresh();
                }
            });
        });
    }
}
