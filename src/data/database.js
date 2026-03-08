// ============================================================================
// ATB-SMS: Database Module (Supabase)
// All persistence via Supabase — async, non-blocking
// ============================================================================

import { supabase } from './supabaseClient.js';

// ---- Settings (API key, etc.) ----

/**
 * Get a setting value by key
 */
export async function getSetting(key) {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        console.warn('getSetting error:', error.message);
        return null;
    }
    return data?.value || null;
}

/**
 * Save or update a setting
 */
export async function saveSetting(key, value) {
    const { error } = await supabase
        .from('settings')
        .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
        );

    if (error) {
        console.error('saveSetting error:', error.message);
        throw error;
    }
}

// ---- Records ----

/**
 * Save a consultation record asynchronously (non-blocking)
 */
export async function saveRecord(record) {
    const row = {
        date: record.date || new Date().toISOString(),
        result: record.result,
        patient_id: record.patientId || null,
        drug_id: record.drugId || null,
        drug_name: record.drugName || null,
        drug_full_name: record.drugFullName || null,
        organism_id: record.organismId || null,
        organism_name: record.organismName || null,
        resistance_id: record.resistanceId || null,
        resistance_name: record.resistanceName || null,
        site_id: record.siteId || null,
        site_name: record.siteName || null,
        kpc_context: record.kpcContext || null,
        dose: record.dose || null,
        renal_adjusted: record.renalAdjusted || false,
        cl_cr: record.clCr || null,
        antibiogram: record.antibiogram || [],
        criteria: record.criteria || [],
        rationale: record.rationale || null,
        notes: record.notes || null
    };

    const { data, error } = await supabase
        .from('records')
        .insert(row)
        .select('id')
        .single();

    if (error) {
        console.error('saveRecord error:', error.message);
        throw error;
    }
    return data.id;
}

/**
 * Get all records with optional filters
 */
export async function getRecords(filters = {}) {
    let query = supabase
        .from('records')
        .select('*')
        .order('date', { ascending: false });

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.drugId) query = query.eq('drug_id', filters.drugId);
    if (filters.organismId) query = query.eq('organism_id', filters.organismId);
    if (filters.result) query = query.eq('result', filters.result);
    if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('date', filters.dateTo);

    const { data, error } = await query;

    if (error) {
        console.error('getRecords error:', error.message);
        return [];
    }

    // Map snake_case DB columns to camelCase for UI compatibility
    return (data || []).map(r => ({
        id: r.id,
        date: r.date,
        result: r.result,
        patientId: r.patient_id,
        drugId: r.drug_id,
        drugName: r.drug_name,
        drugFullName: r.drug_full_name,
        organismId: r.organism_id,
        organismName: r.organism_name,
        resistanceId: r.resistance_id,
        resistanceName: r.resistance_name,
        siteId: r.site_id,
        siteName: r.site_name,
        kpcContext: r.kpc_context,
        dose: r.dose,
        renalAdjusted: r.renal_adjusted,
        clCr: r.cl_cr,
        antibiogram: r.antibiogram,
        criteria: r.criteria,
        rationale: r.rationale,
        notes: r.notes
    }));
}

/**
 * Get usage statistics for dashboard
 */
export async function getStats() {
    const records = await getRecords();

    const stats = {
        total: records.length,
        approved: records.filter(r => r.result === 'CUMPLE').length,
        rejected: records.filter(r => r.result === 'NO_CUMPLE').length,
        byDrug: {},
        byOrganism: {},
        byResistance: {},
        byMonth: {},
        recent: records.slice(0, 10)
    };

    records.forEach(record => {
        const drugKey = record.drugName || record.drugId || 'Desconocido';
        stats.byDrug[drugKey] = (stats.byDrug[drugKey] || 0) + 1;

        const orgKey = record.organismName || record.organismId || 'Desconocido';
        stats.byOrganism[orgKey] = (stats.byOrganism[orgKey] || 0) + 1;

        const resKey = record.resistanceName || record.resistanceId || 'Desconocido';
        stats.byResistance[resKey] = (stats.byResistance[resKey] || 0) + 1;

        const monthKey = record.date ? record.date.substring(0, 7) : 'N/A';
        stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
    });

    return stats;
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(id) {
    const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteRecord error:', error.message);
        throw error;
    }
}

/**
 * Generate a pseudonymized patient ID
 */
export function generatePatientId(initials, birthDate) {
    const clean = (initials || 'XX').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
    const dateStr = birthDate ? birthDate.replace(/-/g, '') : '00000000';

    let hash = 0;
    const combined = clean + dateStr + Date.now().toString();
    for (let i = 0; i < combined.length; i++) {
        const chr = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    const suffix = Math.abs(hash).toString(36).toUpperCase().substring(0, 4).padEnd(4, '0');

    return `${clean}-${dateStr.substring(6, 8)}${dateStr.substring(4, 6)}${dateStr.substring(0, 4)}-${suffix}`;
}

/**
 * Validate that input is NOT an NHC (numeric patient ID)
 */
export function isNHC(value) {
    const cleaned = (value || '').replace(/[\s-]/g, '');
    return /^\d{5,}$/.test(cleaned);
}

/**
 * Export records to JSON for backup
 */
export async function exportRecords() {
    const records = await getRecords();
    return JSON.stringify(records, null, 2);
}
