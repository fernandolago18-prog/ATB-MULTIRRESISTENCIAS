// ============================================================================
// ATB-SMS: Clinical Data Module (Expert Universal Edition)
// Complete decision tree, Microbiology Expert Engine and Universal Renal Logic
// ============================================================================

import { ICONS } from '../icons.js';

/**
 * EXPERT MICROBIOLOGY ENGINE
 */
class MicrobiologyExpert {
    constructor(organismId, resistanceId, antibiogram) {
        this.org = organismId;
        this.res = resistanceId;
        this.atb = antibiogram.map(a => ({
            name: a.antibiotic.toLowerCase(),
            sir: a.sir.toUpperCase(),
            mic: a.mic
        }));
    }

    isS(names) { return this.atb.some(a => names.some(n => a.name.includes(n.toLowerCase())) && (a.sir === 'S' || a.sir === 'I')); }
    isR(names) { return this.atb.some(a => names.some(n => a.name.includes(n.toLowerCase())) && a.sir === 'R'); }
    getDrugsS(names) { return this.atb.filter(a => names.some(n => a.name.includes(n.toLowerCase())) && (a.sir === 'S' || a.sir === 'I')).map(a => a.name); }

    analyze() {
        const alerts = [];
        const carbapenems = ['meropenem', 'imipenem', 'ertapenem'];
        const cephs34 = ['ceftriaxona', 'cefotaxima', 'ceftazidima', 'cefepima'];
        
        if (this.org === 'Enterobacterales') {
            const intrinsicR = ['proteus', 'providencia', 'morganella', 'serratia'];
            if (intrinsicR.some(n => this.org.toLowerCase().includes(n)) || this.atb.some(a => intrinsicR.some(n => a.name.includes(n)))) {
                if (this.isS(['colistina'])) alerts.push('ERROR BIOLÓGICO: Proteeae/Serratia son intrínsecamente resistentes a Colistina.');
                if (this.isS(['tigeciclina'])) alerts.push('ERROR BIOLÓGICO: Proteeae son intrínsecamente resistentes a Tigeciclina.');
            }
        }
        if (this.org === 'P_aeruginosa') {
            if (this.isS(['ertapenem', 'ceftriaxona', 'cefotaxima', 'tigeciclina'])) {
                alerts.push('INCONGRUENCIA: P. aeruginosa es intrínsecamente resistente a Ertapenem, Cefalosporinas de 3ª (excepto Ceftazidima) y Tigeciclina.');
            }
        }
        if (this.org === 'S_maltophilia') {
            if (this.isS(carbapenems)) alerts.push('ERROR BIOLÓGICO: S. maltophilia posee L1/L2 (MBL/AmpC) y es siempre resistente a Carbapenémicos.');
        }

        if ((this.res === 'MBL' || this.res === 'KPC' || this.res === 'OXA_48') && this.isS(carbapenems)) {
            const sCarbas = this.getDrugsS(carbapenems);
            alerts.push(`ALERTA EXPERTA: Has declarado una Carbapenemasa (${this.res}) pero el antibiograma muestra sensibilidad a ${sCarbas.join(', ')}. Esto es altamente improbable.`);
        }

        if (this.res === 'BLEE_AmpC' && this.isS(cephs34)) {
            const sCephs = this.getDrugsS(cephs34);
            alerts.push(`INCONGRUENCIA: El mecanismo BLEE/AmpC implica resistencia a Cefalosporinas de 3ª/4ª (${sCephs.join(', ')}).`);
        }

        if (this.isR(carbapenems) && this.isS(cephs34)) {
            alerts.push('ALERTA TÉCNICA: Resistencia a Carbapenémicos con sensibilidad a Cefalosporinas de 3ª/4ª es un fenotipo imposible (error de lectura o mecanismo atípico).');
        }

        if (this.res === 'MBL') {
            if (this.isS(['ceftazidima/avibactam', 'meropenem/vaborbactam', 'imipenem/relebactam', 'ceftolozano/tazobactam'])) {
                alerts.push('ALERTA CLÍNICA: Las MBL inactivan todos los nuevos β-lactámicos con inhibidores de Clase A/C. Solo Aztreonam/Avibactam o Cefiderocol son opciones viables.');
            }
        }

        return alerts;
    }
}

/**
 * DRUGS DATABASE (Universal SMS 2026 Edition)
 */
export const DRUGS = {
    'ATM_AVI': {
        id: 'ATM_AVI', abbr: 'ATM/AVI', name: 'Aztreonam/Avibactam', funding: 'SMS: Elección en MBL y S. maltophilia.', 
        standardDose: { loading: '2g/0.67g', maintenance: '1.5g/0.5g c/6h', infusion: '3h' }, 
        targetOrganisms: ['Enterobacterales', 'S_maltophilia'], indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        renalAdjustment: {
            normal: { threshold: 51, dose: '1.5/0.5g c/6h', loading: '2g/0.67g', infusion: '3h' },
            augmented: { dose: '1.5/0.5g c/6h', loading: '2g/0.67g', infusion: '4h', notes: 'Considerar infusión extendida 4h' },
            tiers: [
                { min: 31, max: 50, label: 'ClCr 31-50', dose: '0.75/0.25g cada 6h', loading: '2g/0.67g' },
                { min: 16, max: 30, label: 'ClCr 16-30', dose: '0.675/0.225g cada 8h', loading: '1.35/0.45g' },
                { min: 0, max: 15, label: 'ClCr ≤15 / HD', dose: '0.675/0.225g cada 12h', loading: '1g/0.33g', notes: 'Post-hemodiálisis' }
            ]
        }
    },
    'CFP_ETZ': {
        id: 'CFP_ETZ', abbr: 'CFP/ETZ', name: 'Cefepima/Enmetazobactam', funding: 'SMS: Elección OXA-48 + BLEE/AmpC.', 
        standardDose: { maintenance: '2g/0.5g c/8h', infusion: '2h' }, 
        targetOrganisms: ['Enterobacterales'], indications: ['ITUc', 'Bacteriemia', 'NAH_NAV'],
        renalAdjustment: {
            normal: { threshold: 60, dose: '2g/0.5g c/8h', infusion: '2h' },
            augmented: { dose: '2g/0.5g c/8h', infusion: '4h', notes: 'Optimizar T>CMI con infusión 4h' },
            tiers: [
                { min: 30, max: 59, label: 'TFGe 30-59', dose: '1g/0.25g cada 8h' },
                { min: 15, max: 29, label: 'TFGe 15-29', dose: '1g/0.25g cada 12h' },
                { min: 0, max: 14, label: 'TFGe <15 / HD', dose: '1g/0.25g cada 24h', notes: 'En HD: 0.5/0.125g c/24h tras sesión' }
            ]
        }
    },
    'CFD': {
        id: 'CFD', abbr: 'CFD', name: 'Cefiderocol', funding: 'SMS: Elección en Pseudomonas MBL.', 
        standardDose: { maintenance: '2g c/8h', infusion: '3h' }, 
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa', 'A_baumannii', 'S_maltophilia'], indications: ['NAH_NAV', 'Bacteriemia', 'ITUc'],
        renalAdjustment: {
            normal: { threshold: 60, dose: '2g cada 8h', infusion: '3h' },
            augmented: { dose: '2g cada 6h', infusion: '3h', notes: 'ClCr ≥120: Aumentar frecuencia a c/6h' },
            tiers: [
                { min: 30, max: 59, label: 'ClCr 30-59', dose: '1.5g cada 8h' },
                { min: 15, max: 29, label: 'ClCr 15-29', dose: '1g cada 8h' },
                { min: 0, max: 14, label: 'ClCr <15 / HD', dose: '0.75g cada 12h', notes: 'Post-hemodiálisis' }
            ]
        }
    },
    'CAZ_AVI': {
        id: 'CAZ_AVI', abbr: 'CAZ/AVI', name: 'Ceftazidima/Avibactam', funding: 'SMS: Elección OXA-48. KPC no crítico.', 
        standardDose: { maintenance: '2g/0.5g c/8h', infusion: '2h' }, 
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa'], indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        renalAdjustment: {
            normal: { threshold: 51, dose: '2g/0.5g c/8h', infusion: '2h' },
            augmented: { dose: '2g/0.5g c/8h', infusion: '4h', notes: 'En NAV o ARC valorar infusión 4h' },
            tiers: [
                { min: 31, max: 50, label: 'ClCr 31-50', dose: '1g/0.25g cada 8h' },
                { min: 16, max: 30, label: 'ClCr 16-30', dose: '0.75/0.18g cada 12h' },
                { min: 6, max: 15, label: 'ClCr 6-15', dose: '0.75/0.18g cada 24h' },
                { min: 0, max: 5, label: 'ClCr ≤5 / HD', dose: '0.75/0.18g cada 48h', notes: 'Post-hemodiálisis' }
            ]
        }
    },
    'CTZ_TAZ': {
        id: 'CTZ_TAZ', abbr: 'CTZ/TAZ', name: 'Ceftolozano/Tazobactam', funding: 'SMS: Elección P. aeruginosa DTR.', 
        standardDose: { maintenance: '1.5g c/8h (3g en NAV)', infusion: '1h' }, 
        targetOrganisms: ['P_aeruginosa'], indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        renalAdjustment: {
            normal: { threshold: 51, dose: '1.5g c/8h (3g en NAV)', infusion: '1h' },
            tiers: [
                { min: 30, max: 50, label: 'ClCr 30-50', dose: '750mg c/8h (1.5g en NAV)' },
                { min: 15, max: 29, label: 'ClCr 15-29', dose: '375mg c/8h (750mg en NAV)' },
                { min: 0, max: 14, label: 'ClCr <15 / HD', dose: '150mg c/8h (450mg en NAV)', loading: '750mg / 2.25g', notes: 'Post-hemodiálisis' }
            ]
        }
    },
    'IMI_REL': {
        id: 'IMI_REL', abbr: 'IMI/REL', name: 'Imipenem/Relebactam', funding: 'SMS: Elección KPC/DTR anaerobios.', 
        standardDose: { maintenance: '500/500/250mg c/6h', infusion: '30m' }, 
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa'], indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        renalAdjustment: {
            normal: { threshold: 90, dose: '500/500/250mg c/6h', infusion: '30m' },
            tiers: [
                { min: 60, max: 89, label: 'ClCr 60-89', dose: '400/400/200mg cada 6h' },
                { min: 30, max: 59, label: 'ClCr 30-59', dose: '300/300/150mg cada 6h' },
                { min: 15, max: 29, label: 'ClCr 15-29', dose: '200/200/100mg cada 6h' },
                { min: 0, max: 14, label: 'ClCr <15 / HD', dose: '200/200/100mg cada 6h', notes: 'Post-hemodiálisis' }
            ]
        }
    },
    'MERO_VABOR': {
        id: 'MERO_VABOR', abbr: 'MERO/VABOR', name: 'Meropenem/Vaborbactam', funding: 'SMS: Elección KPC crítico.', 
        standardDose: { maintenance: '2g/2g c/8h', infusion: '3h' }, 
        targetOrganisms: ['Enterobacterales'], indications: ['ITUc', 'NAH_NAV', 'IIAc', 'Bacteriemia'],
        renalAdjustment: {
            normal: { threshold: 40, dose: '2g/2g c/8h', infusion: '3h' },
            augmented: { dose: '2g/2g c/8h', infusion: '4h', notes: 'Considerar infusión 4h en ARC' },
            tiers: [
                { min: 20, max: 39, label: 'ClCr 20-39', dose: '1g/1g cada 8h' },
                { min: 10, max: 19, label: 'ClCr 10-19', dose: '1g/1g cada 12h' },
                { min: 0, max: 9, label: 'ClCr <10 / HD', dose: '0.5g/0.5g cada 12h', notes: 'Post-hemodiálisis' }
            ]
        }
    },
    'ERV': {
        id: 'ERV', abbr: 'ERV', name: 'Eravaciclina', funding: 'Reserva IIAc multirresistente.', 
        standardDose: { maintenance: '1mg/kg c/12h', infusion: '1h' }, 
        targetOrganisms: ['Enterobacterales', 'A_baumannii'], indications: ['IIAc'],
        renalAdjustment: {
            normal: { threshold: 0, dose: '1mg/kg cada 12h', infusion: '1h' },
            tiers: [{ min: 0, max: 200, label: 'Cualquier filtrado', dose: '1mg/kg cada 12h', notes: 'No requiere ajuste renal' }]
        }
    }
};

export const ORGANISMS = {
    'Enterobacterales': { id: 'Enterobacterales', name: 'Enterobacterales', resistanceMechanisms: ['MBL', 'KPC', 'OXA_48', 'BLEE_AmpC'], icon: ICONS.bugEntero },
    'P_aeruginosa': { id: 'P_aeruginosa', name: 'Pseudomonas aeruginosa', resistanceMechanisms: ['MBL', 'ClassA_C', 'DTR'], icon: ICONS.bugPseudo },
    'A_baumannii': { id: 'A_baumannii', name: 'Acinetobacter baumannii', resistanceMechanisms: ['CR'], icon: ICONS.bugAcineto },
    'S_maltophilia': { id: 'S_maltophilia', name: 'Stenotrophomonas maltophilia', resistanceMechanisms: ['MDR'], icon: ICONS.bugSteno }
};

export const RESISTANCE_MECHANISMS = {
    'MBL': { id: 'MBL', name: 'Metalo-β-lactamasa (MBL)', ambler: 'Clase B' },
    'KPC': { id: 'KPC', name: 'KPC (Clase A)', ambler: 'Clase A' },
    'OXA_48': { id: 'OXA_48', name: 'OXA-48 like (Clase D)', ambler: 'Clase D' },
    'BLEE_AmpC': { id: 'BLEE_AmpC', name: 'BLEE / AmpC', ambler: 'Clase A / C' },
    'DTR': { id: 'DTR', name: 'Resistencia DTR (No Carbapenemasa)', ambler: 'N/A' },
    'ClassA_C': { id: 'ClassA_C', name: 'Clase A (GES) o Clase C', ambler: 'Clase A / C' },
    'CR': { id: 'CR', name: 'Resistencia a Carbapenémicos', ambler: 'Clase D / B' },
    'MDR': { id: 'MDR', name: 'Multirresistencia (MDR)', ambler: 'N/A' }
};

export const INFECTION_SITES = {
    'IIAc': { id: 'IIAc', name: 'Infección intraabdominal complicada', abbr: 'IIAc' },
    'ITUc': { id: 'ITUc', name: 'Infección tracto urinario complicada', abbr: 'ITUc' },
    'NAH_NAV': { id: 'NAH_NAV', name: 'Neumonía nosocomial / NAV', abbr: 'NAH/NAV' },
    'Bacteriemia': { id: 'Bacteriemia', name: 'Bacteriemia / ITS', abbr: 'Bacteriemia' }
};

export const KPC_CONTEXT_OPTIONS = [
    { id: 'critical', label: 'Paciente crítico / Alto inóculo / CMI elevada (>1) / Exposición previa a CAZ/AVI' },
    { id: 'non_critical', label: 'Paciente no crítico, sin los criterios anteriores' }
];

export function getRecommendation(organismId, resistanceId, contextId = null, siteId = null) {
    const results = [];
    if (organismId === 'Enterobacterales') {
        if (resistanceId === 'MBL') {
            results.push({ drugId: 'ATM_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN.' });
            results.push({ drugId: 'CFD', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN (si precisa cobertura antipseudomónica).' });
        } else if (resistanceId === 'KPC') {
            if (contextId === 'critical') {
                results.push({ drugId: 'MERO_VABOR', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN en paciente crítico.' });
                results.push({ drugId: 'IMI_REL', priority: 1, rationale: 'Alternativa si precisa cobertura anaerobia.' });
            } else {
                results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN en paciente no crítico.' });
                results.push({ drugId: 'MERO_VABOR', priority: 1, rationale: 'Alternativa preferente si falla CAZ/AVI.' });
            }
        } else if (resistanceId === 'OXA_48') {
            results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN.' });
            results.push({ drugId: 'CFP_ETZ', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN para ahorro de carbapenémicos.' });
        } else if (resistanceId === 'BLEE_AmpC') {
            results.push({ drugId: 'CFP_ETZ', priority: 1, rationale: 'Alternativa para ahorro de carbapenémicos.' });
        }
    }
    if (organismId === 'P_aeruginosa') {
        if (resistanceId === 'MBL') results.push({ drugId: 'CFD', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN.' });
        else if (resistanceId === 'ClassA_C') results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'ELECCIÓN para Clase A o C.' });
        else if (resistanceId === 'DTR') results.push({ drugId: 'CTZ_TAZ', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN.' });
    }
    if (organismId === 'S_maltophilia') {
        results.push({ drugId: 'ATM_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN.' });
        results.push({ drugId: 'CFD', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN.' });
    }
    return results;
}

export function evaluateFunding(organismId, resistanceId, drugId, antibiogramData = []) {
    const recs = getRecommendation(organismId, resistanceId);
    const isRecommended = recs.some(r => r.drugId === drugId);
    const expert = new MicrobiologyExpert(organismId, resistanceId, antibiogramData);
    const incongruities = expert.analyze();
    const drug = DRUGS[drugId];
    const drugInAtb = antibiogramData.find(a => 
        a.antibiotic.toLowerCase().includes(drug.abbr.toLowerCase()) || 
        a.antibiotic.toLowerCase().includes(drug.name.split('/')[0].toLowerCase())
    );
    const isSensitive = drugInAtb ? (drugInAtb.sir === 'S' || drugInAtb.sir === 'I') : true;
    const meets = isRecommended && isSensitive && incongruities.length === 0;

    return {
        meets,
        criteria: [
            isRecommended ? '✓ Recomendado SMS' : '✗ No recomendado SMS',
            (antibiogramData.length > 0) ? '✓ Antibiograma disponible' : '✗ Sin antibiograma',
            (drugInAtb && !isSensitive) ? '✗ Resistente en antibiograma' : '✓ Sensibilidad confirmada/presunta'
        ],
        missing: [],
        incongruities
    };
}

export function getOrganismsForDrug(drugId) { return DRUGS[drugId]?.targetOrganisms.map(id => ORGANISMS[id]).filter(Boolean) || []; }
export function getResistanceForOrganism(organismId) { return ORGANISMS[organismId]?.resistanceMechanisms.map(id => RESISTANCE_MECHANISMS[id]).filter(Boolean) || []; }

/**
 * UNIVERSAL HIGH-PRECISION RENAL DOSING ENGINE
 */
export function getRenalAdjustedDose(drugId, clCr) {
    const drug = DRUGS[drugId];
    if (!drug || !drug.renalAdjustment) return null;
    const adj = drug.renalAdjustment;
    
    // ARC: Augmented Renal Clearance
    if (clCr >= 120 && adj.augmented) {
        return { ...adj.augmented, tier: 'Filtrado aumentado (ARC ≥120 mL/min)' };
    }
    
    // Normal function
    if (clCr >= adj.normal.threshold) {
        return { ...adj.normal, tier: `Función Renal Normal (≥${adj.normal.threshold} mL/min)` };
    }
    
    // Dynamic Tiers check
    if (adj.tiers) {
        const tier = adj.tiers.find(t => clCr >= t.min && clCr <= t.max);
        if (tier) return { ...tier, tier: tier.label };
    }

    return { ...adj.normal, tier: 'Ajuste según criterio clínico (Filtrado muy bajo)' };
}

export const ANTIBIOGRAM_ANTIBIOTICS = [
    'Amikacina', 'Amoxicilina/clav', 'Ampicilina', 'Aztreonam', 'Cefepima', 'Cefotaxima', 'Ceftazidima', 'Ceftolozano/taz',
    'Ceftriaxona', 'Ciprofloxacino', 'Colistina', 'Cotrimoxazol', 'Ertapenem', 'Fosfomicina', 'Gentamicina', 'Imipenem',
    'Levofloxacino', 'Meropenem', 'Minociclina', 'Piperacilina/taz', 'Tigeciclina', 'Tobramicina'
];
