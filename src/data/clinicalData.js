// ============================================================================
// ATB-SMS: Clinical Data Module
// Complete decision tree from SMS Consensus (2026) and CIMA/AEMPS
// ============================================================================

import { ICONS } from '../icons.js';

/**
 * DRUGS DATABASE
 * Renal adjustment doses extracted from CIMA (AEMPS) Technical Sheets (2024-2026)
 */
export const DRUGS = {
    'ATM_AVI': {
        id: 'ATM_AVI',
        abbr: 'ATM/AVI',
        name: 'Aztreonam/Avibactam',
        components: 'Aztreonam + Avibactam',
        mechanism: 'Monobactámico + Inhibidor de β-lactamasas (Clase A, C, algunas D). Avibactam protege al aztreonam de otras β-lactamasas en productores de MBL.',
        spectrum: 'Gram-negativos: Enterobacterales (Citrobacter, E. coli, Klebsiella, Morganella, Proteus, Providencia, Raoultella, Serratia). Actividad limitada frente a P. aeruginosa.',
        notActive: 'Acinetobacter, anaerobios',
        standardDose: {
            loading: '2g / 0.67g (Carga)',
            maintenance: '1.5g / 0.5g cada 6h',
            infusion: '3 horas',
            notes: 'Pauta estándar (ClCr >50 ml/min): Carga + 1.5/0.5g c/6h'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento dirigido en BGN productores de MBL sin alternativas.',
        targetOrganisms: ['Enterobacterales', 'S_maltophilia'],
        targetResistance: ['MBL'],
        renalAdjustment: {
            normal: { dose: '1.5g / 0.5g cada 6h', loading: '2g / 0.67g', infusion: '3h', threshold: 51 },
            augmented: { dose: '1.5g / 0.5g cada 6h', loading: '2g / 0.67g', infusion: '3h' },
            tier1: { label: 'ClCr 31-50 mL/min', dose: '0.75g / 0.25g cada 6h', loading: '2g / 0.67g', infusion: '3h' },
            tier2: { label: 'ClCr 16-30 mL/min', dose: '0.675g / 0.225g cada 8h', loading: '1.35g / 0.45g', infusion: '3h' },
            tier3: { label: 'ClCr ≤15 mL/min (HD)', dose: '0.675g / 0.225g cada 12h', loading: '1g / 0.33g', infusion: '3h', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'CFP_ETZ': {
        id: 'CFP_ETZ',
        abbr: 'CFP/ETZ',
        name: 'Cefepima/Enmetazobactam',
        components: 'Cefepima + Enmetazobactam',
        mechanism: 'Cefalosporina 4ª gen + Inhibidor de β-lactamasas (Clase A/BLEE). No activo frente a MBL, AmpC inducible ni OXA-48.',
        spectrum: 'Enterobacterales productoras de BLEE/AmpC.',
        notActive: 'MBL, OXA-48, AmpC inducible',
        standardDose: {
            loading: null,
            maintenance: '2g / 0.5g cada 8h',
            infusion: '2 horas',
            notes: '2h en ITUc; valorar 4h en neumonía/NAV'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Reservado para Enterobacterales BLEE/AmpC (ahorro de carbapenémicos).',
        targetOrganisms: ['Enterobacterales'],
        targetResistance: ['BLEE_AmpC'],
        renalAdjustment: {
            normal: { dose: '2g / 0.5g cada 8h', infusion: '2h', threshold: 60 },
            augmented: { dose: '2g / 0.5g cada 8h', infusion: '2h' },
            tier1: { label: 'TFGe 30-59 mL/min', dose: '1g / 0.25g cada 8h', infusion: '2h' },
            tier2: { label: 'TFGe 15-29 mL/min', dose: '1g / 0.25g cada 12h', infusion: '2h' },
            tier3: { label: 'TFGe <15 mL/min', dose: '1g / 0.25g cada 24h', infusion: '2h' },
            hd: { label: 'Hemodiálisis', dose: '0.5g / 0.125g cada 24h', loading: '1g / 0.25g (Día 1)', notes: 'Tras hemodiálisis' }
        }
    },
    'CFD': {
        id: 'CFD',
        abbr: 'CFD',
        name: 'Cefiderocol',
        components: 'Cefiderocol',
        mechanism: 'Cefalosporina siderófora estable frente a la mayoría de β-lactamasas incluyendo MBL.',
        spectrum: 'Amplio espectro G-: MBL, KPC, OXA-48, P. aeruginosa, A. baumannii, S. maltophilia.',
        notActive: 'Gram-positivos, anaerobios',
        standardDose: {
            loading: null,
            maintenance: '2g cada 8h',
            infusion: '3 horas',
            notes: 'Pauta para ClCr 60-119 mL/min'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento dirigido cuando no hay alternativas.',
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa', 'A_baumannii', 'S_maltophilia'],
        targetResistance: ['MBL', 'KPC', 'OXA_48'],
        renalAdjustment: {
            normal: { dose: '2g cada 8h', infusion: '3h', threshold: 60 },
            augmented: { dose: '2g cada 6h', infusion: '3h', notes: 'ClCr ≥120 mL/min: aumentar frecuencia' },
            tier1: { label: 'ClCr 30-59 mL/min', dose: '1.5g cada 8h', infusion: '3h' },
            tier2: { label: 'ClCr 15-29 mL/min', dose: '1g cada 8h', infusion: '3h' },
            tier3: { label: 'ClCr <15 mL/min (HD)', dose: '0.75g cada 12h', infusion: '3h', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'CAZ_AVI': {
        id: 'CAZ_AVI',
        abbr: 'CAZ/AVI',
        name: 'Ceftazidima/Avibactam',
        components: 'Ceftazidima + Avibactam',
        mechanism: 'Cefalosporina 3ª gen + Inhibidor (Clase A, C, D/OXA-48). No activo frente a MBL.',
        spectrum: 'Enterobacterales (KPC, OXA-48), P. aeruginosa DTR.',
        notActive: 'MBL (NDM, VIM, IMP)',
        standardDose: {
            loading: null,
            maintenance: '2g / 0.5g cada 8h',
            infusion: '2 horas',
            notes: null
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Elección para OXA-48.',
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa'],
        targetResistance: ['KPC', 'OXA_48', 'ClassA_C'],
        renalAdjustment: {
            normal: { dose: '2g / 0.5g cada 8h', infusion: '2h', threshold: 51 },
            augmented: { dose: '2g / 0.5g cada 8h', infusion: '2h' },
            tier1: { label: 'ClCr 31-50 mL/min', dose: '1g / 0.25g cada 8h', infusion: '2h' },
            tier2: { label: 'ClCr 16-30 mL/min', dose: '0.75g / 0.1875g cada 12h', infusion: '2h' },
            tier3: { label: 'ClCr 6-15 mL/min', dose: '0.75g / 0.1875g cada 24h', infusion: '2h' },
            hd: { label: 'ClCr ≤5 mL/min (HD)', dose: '0.75g / 0.1875g cada 48h', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'CTZ_TAZ': {
        id: 'CTZ_TAZ',
        abbr: 'CTZ/TAZ',
        name: 'Ceftolozano/Tazobactam',
        components: 'Ceftolozano + Tazobactam',
        mechanism: 'Muy activo frente a P. aeruginosa DTR (no carbapenemasa).',
        spectrum: 'P. aeruginosa DTR, Enterobacterales BLEE.',
        notActive: 'Carbapenemasas (KPC, MBL, OXA-48), Acinetobacter',
        standardDose: {
            loading: null,
            maintenance: '1.5g (1/0.5) cada 8h',
            infusion: '1 hora',
            notes: 'En neumonía nosocomial/NAV: 3g (2/1) cada 8h'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Elección para P. aeruginosa DTR sin carbapenemasa.',
        targetOrganisms: ['P_aeruginosa'],
        targetResistance: ['DTR'],
        renalAdjustment: {
            normal: { dose: '1.5g c/8h (3g en NAV)', infusion: '1h', threshold: 51 },
            augmented: { dose: '1.5g c/8h (3g en NAV)', infusion: '1h' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: '750mg c/8h (1.5g en NAV)', infusion: '1h' },
            tier2: { label: 'ClCr 15-29 mL/min', dose: '375mg c/8h (750mg en NAV)', infusion: '1h' },
            tier3: { label: 'ESRD / HD', dose: '150mg c/8h (450mg en NAV)', loading: '750mg / 2.25g Carga', infusion: '1h', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'ERV': {
        id: 'ERV',
        abbr: 'ERV',
        name: 'Eravaciclina',
        components: 'Eravaciclina',
        mechanism: 'Fluorociclina. Activa frente a cepas productoras de carbapenemasas (excepto P. aeruginosa).',
        spectrum: 'Enterobacterales, MRSA, VRE, A. baumannii.',
        notActive: 'P. aeruginosa, Proteus, Providencia, Morganella',
        standardDose: {
            loading: null,
            maintenance: '1 mg/kg cada 12h',
            infusion: '1 hora',
            notes: 'Solo indicada para IIAc'
        },
        indications: ['IIAc'],
        funding: 'Tratamiento dirigido de reserva en IIAc.',
        targetOrganisms: ['Enterobacterales', 'A_baumannii', 'S_maltophilia'],
        targetResistance: ['MBL', 'KPC', 'OXA_48', 'BLEE_AmpC', 'CR', 'MDR'],
        renalAdjustment: {
            normal: { dose: '1 mg/kg cada 12h', infusion: '1h', threshold: 0 },
            augmented: { dose: '1 mg/kg cada 12h', infusion: '1h' },
            tier1: { label: 'Cualquier filtrado', dose: 'No requiere ajuste', infusion: '1h' }
        }
    },
    'IMI_REL': {
        id: 'IMI_REL',
        abbr: 'IMI/REL',
        name: 'Imipenem/Cilastatina/Relebactam',
        components: 'Imipenem + Cilastatina + Relebactam',
        mechanism: 'Carbapenémico + Inhibidor (Clase A, C). Potente frente a KPC y AmpC.',
        spectrum: 'Enterobacterales (KPC), P. aeruginosa DTR (Clase A/C). Cobertura anaerobia.',
        notActive: 'OXA-48, MBL',
        standardDose: {
            loading: null,
            maintenance: '500/500/250 mg cada 6h',
            infusion: '30 minutos',
            notes: 'Pauta para ClCr ≥ 90 mL/min'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Elección para KPC/DTR con necesidad de cobertura polimicrobiana.',
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa'],
        targetResistance: ['KPC', 'ClassA_C'],
        renalAdjustment: {
            normal: { dose: '500/500/250mg cada 6h', infusion: '30min', threshold: 90 },
            augmented: { dose: '500/500/250mg cada 6h', infusion: '30min' },
            tier1: { label: 'ClCr 60-89 mL/min', dose: '400/400/200mg cada 6h', infusion: '30min' },
            tier2: { label: 'ClCr 30-59 mL/min', dose: '300/300/150mg cada 6h', infusion: '30min' },
            tier3: { label: 'ClCr 15-29 mL/min', dose: '200/200/100mg cada 6h', infusion: '30min' },
            hd: { label: 'ESRD / HD', dose: '200/200/100mg cada 6h', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'MERO_VABOR': {
        id: 'MERO_VABOR',
        abbr: 'MERO/VABOR',
        name: 'Meropenem/Vaborbactam',
        components: 'Meropenem + Vaborbactam',
        mechanism: 'Carbapenémico + Inhibidor (Clase A, C). Muy potente frente a KPC.',
        spectrum: 'Enterobacterales (KPC). Superior a carbapenémicos solos.',
        notActive: 'OXA-48, MBL, Acinetobacter',
        standardDose: {
            loading: null,
            maintenance: '2g / 2g cada 8h',
            infusion: '3 horas',
            notes: 'Pauta para ClCr ≥ 40 mL/min'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Elección para KPC en paciente crítico.',
        targetOrganisms: ['Enterobacterales'],
        targetResistance: ['KPC'],
        renalAdjustment: {
            normal: { dose: '2g / 2g cada 8h', infusion: '3h', threshold: 40 },
            augmented: { dose: '2g / 2g cada 8h', infusion: '3h' },
            tier1: { label: 'ClCr 20-39 mL/min', dose: '1g / 1g cada 8h', infusion: '3h' },
            tier2: { label: 'ClCr 10-19 mL/min', dose: '1g / 1g cada 12h', infusion: '3h' },
            tier3: { label: 'ClCr <10 mL/min (HD)', dose: '0.5g / 0.5g cada 12h', infusion: '3h', notes: 'Administrar tras hemodiálisis' }
        }
    }
};

/**
 * ORGANISMS DATABASE
 */
export const ORGANISMS = {
    'Enterobacterales': {
        id: 'Enterobacterales',
        name: 'Enterobacterales',
        description: 'Klebsiella spp., E. coli, Enterobacter spp., Serratia spp., etc.',
        resistanceMechanisms: ['MBL', 'KPC', 'OXA_48', 'BLEE_AmpC'],
        icon: ICONS.bugEntero
    },
    'P_aeruginosa': {
        id: 'P_aeruginosa',
        name: 'Pseudomonas aeruginosa',
        description: 'P. aeruginosa con resistencia difícil de tratar (DTR)',
        resistanceMechanisms: ['MBL', 'ClassA_C', 'DTR'],
        icon: ICONS.bugPseudo
    },
    'A_baumannii': {
        id: 'A_baumannii',
        name: 'Acinetobacter baumannii',
        description: 'A. baumannii resistente a carbapenémicos',
        resistanceMechanisms: ['CR'],
        icon: ICONS.bugAcineto
    },
    'S_maltophilia': {
        id: 'S_maltophilia',
        name: 'Stenotrophomonas maltophilia',
        description: 'S. maltophilia multirresistente',
        resistanceMechanisms: ['MDR'],
        icon: ICONS.bugSteno
    }
};

/**
 * RESISTANCE MECHANISMS
 */
export const RESISTANCE_MECHANISMS = {
    'MBL': { id: 'MBL', name: 'Metalo-β-lactamasa (MBL)', description: 'Resistencia a casi todos los β-lactámicos (NDM, VIM, IMP).', ambler: 'Clase B' },
    'KPC': { id: 'KPC', name: 'KPC (K. pneumoniae carbapenemasa)', description: 'Carbapenemasa de Clase A. Frecuente en Klebsiella.', ambler: 'Clase A' },
    'OXA_48': { id: 'OXA_48', name: 'OXA-48 like', description: 'Carbapenemasa de Clase D.', ambler: 'Clase D' },
    'BLEE_AmpC': { id: 'BLEE_AmpC', name: 'BLEE / AmpC', description: 'β-lactamasas de espectro extendido o AmpC.', ambler: 'Clase A / C' },
    'DTR': { id: 'DTR', name: 'Resistencia DTR (No Carbapenemasa)', description: 'Pérdida de porinas, bombas de eflujo.', ambler: 'N/A' },
    'ClassA_C': { id: 'ClassA_C', name: 'Clase A (GES) o Clase C', description: 'Producción de GES o hiperproducción de AmpC.', ambler: 'Clase A / C' },
    'CR': { id: 'CR', name: 'Resistencia a Carbapenémicos', description: 'Mecanismos múltiples en Acinetobacter.', ambler: 'Clase D / B' },
    'MDR': { id: 'MDR', name: 'Multirresistencia (MDR)', description: 'Resistencia en S. maltophilia.', ambler: 'N/A' }
};

/**
 * INFECTION SITES
 */
export const INFECTION_SITES = {
    'IIAc': { id: 'IIAc', name: 'Infección intraabdominal complicada', abbr: 'IIAc' },
    'ITUc': { id: 'ITUc', name: 'Infección tracto urinario complicada', abbr: 'ITUc' },
    'NAH_NAV': { id: 'NAH_NAV', name: 'Neumonía nosocomial / NAV', abbr: 'NAH/NAV' },
    'Bacteriemia': { id: 'Bacteriemia', name: 'Bacteriemia / ITS', abbr: 'Bacteriemia' }
};

export const KPC_CONTEXT_OPTIONS = [
    { id: 'critical', label: 'Paciente crítico / Alto inóculo / CMI elevada (>1) / Exposición previa a CAZ/AVI' },
    { id: 'anaerobic', label: 'Necesidad de cobertura anaerobia o frente a Gram-positivos' },
    { id: 'non_critical', label: 'Paciente no crítico, sin los criterios anteriores' }
];

/**
 * DECISION ENGINE
 */
export function getRecommendation(organismId, resistanceId, contextId = null, siteId = null) {
    const results = [];
    if (organismId === 'Enterobacterales') {
        if (resistanceId === 'MBL') {
            results.push({ drugId: 'ATM_AVI', priority: 1, rationale: 'Tratamiento de elección (o CFD si se precisa cobertura antipseudomónica).' });
            results.push({ drugId: 'CFD', priority: 1, rationale: 'Tratamiento de elección (especialmente si precisa cobertura frente a P. aeruginosa DTR).' });
        } else if (resistanceId === 'KPC') {
            if (contextId === 'critical') results.push({ drugId: 'MERO_VABOR', priority: 1, rationale: 'Tratamiento de elección en paciente crítico o CMI elevada.' });
            else if (contextId === 'anaerobic') results.push({ drugId: 'IMI_REL', priority: 1, rationale: 'Tratamiento de elección si se precisa cobertura anaerobia/G+.' });
            else results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'Tratamiento de elección en paciente no crítico.' });
            results.push({ drugId: 'ATM_AVI', priority: 2, rationale: 'Alternativa según antibiograma.' });
            results.push({ drugId: 'CFD', priority: 2, rationale: 'Alternativa según antibiograma.' });
        } else if (resistanceId === 'OXA_48') {
            results.push({ drugId: 'CFP_ETZ', priority: 1, rationale: 'Elección si sensibilidad confirmada (ahorro carbapenémicos).' });
            results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'Elección. Potente inhibidor de OXA-48.' });
            results.push({ drugId: 'ATM_AVI', priority: 2, rationale: 'Alternativa según antibiograma.' });
            results.push({ drugId: 'CFD', priority: 2, rationale: 'Alternativa según antibiograma.' });
        } else if (resistanceId === 'BLEE_AmpC') {
            results.push({ drugId: 'CFP_ETZ', priority: 1, rationale: 'Alternativa para preservar carbapenémicos.' });
        }
        if (siteId === 'IIAc') results.push({ drugId: 'ERV', priority: 2, rationale: 'Reserva en IIAc multirresistente.' });
    }
    if (organismId === 'P_aeruginosa') {
        if (resistanceId === 'MBL') results.push({ drugId: 'CFD', priority: 1, rationale: 'Elección (única opción monobactámica/siderófora estable).' });
        else if (resistanceId === 'ClassA_C') {
            results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'Elección para Clase A (GES) o Clase C desreprimida.' });
            results.push({ drugId: 'IMI_REL', priority: 1, rationale: 'Elección si precisa cobertura anaerobia.' });
        } else if (resistanceId === 'DTR') results.push({ drugId: 'CTZ_TAZ', priority: 1, rationale: 'Elección para P. aeruginosa DTR sin carbapenemasa.' });
    }
    if (organismId === 'A_baumannii' && resistanceId === 'CR') {
        results.push({ drugId: 'CFD', priority: 1, rationale: 'Alternativa según sensibilidad.' });
        if (siteId === 'IIAc') results.push({ drugId: 'ERV', priority: 2, rationale: 'Alternativa en IIAc.' });
    }
    if (organismId === 'S_maltophilia' && resistanceId === 'MDR') {
        results.push({ drugId: 'ATM_AVI', priority: 1, rationale: 'Elección (en combinación).' });
        results.push({ drugId: 'CFD', priority: 1, rationale: 'Elección.' });
    }
    if (siteId && results.length > 0) {
        const filtered = results.filter(r => DRUGS[r.drugId].indications.includes(siteId));
        if (filtered.length === 0) {
            results.forEach(r => r.siteWarning = `Uso off-label para ${siteId}.`);
            return results;
        }
        return filtered;
    }
    return results;
}

/**
 * HELPER FUNCTIONS
 */
export function getOrganismsForDrug(drugId) {
    const drug = DRUGS[drugId];
    return drug ? drug.targetOrganisms.map(id => ORGANISMS[id]).filter(Boolean) : [];
}

export function getResistanceForOrganism(organismId) {
    const org = ORGANISMS[organismId];
    return org ? org.resistanceMechanisms.map(id => RESISTANCE_MECHANISMS[id]).filter(Boolean) : [];
}

export function getRenalAdjustedDose(drugId, clCr) {
    const drug = DRUGS[drugId];
    if (!drug || !drug.renalAdjustment) return null;
    const adj = drug.renalAdjustment;
    if (clCr >= 120 && adj.augmented) return { ...adj.augmented, tier: 'Filtrado aumentado (≥120)' };
    if (clCr >= adj.normal.threshold) return { ...adj.normal, tier: `Normal (≥${adj.normal.threshold})` };
    
    // Drug-specific logic
    if (drugId === 'IMI_REL') {
        if (clCr >= 60) return { ...adj.tier1, tier: adj.tier1.label };
        if (clCr >= 30) return { ...adj.tier2, tier: adj.tier2.label };
        if (clCr >= 15) return { ...adj.tier3, tier: adj.tier3.label };
        return { ...adj.hd, tier: adj.hd.label };
    }
    if (drugId === 'MERO_VABOR') {
        if (clCr >= 20) return { ...adj.tier1, tier: adj.tier1.label };
        if (clCr >= 10) return { ...adj.tier2, tier: adj.tier2.label };
        return { ...adj.tier3, tier: adj.tier3.label };
    }
    if (drugId === 'ATM_AVI') {
        if (clCr >= 31) return { ...adj.tier1, tier: adj.tier1.label };
        if (clCr >= 16) return { ...adj.tier2, tier: adj.tier2.label };
        return { ...adj.tier3, tier: adj.tier3.label };
    }
    if (clCr >= 30 && adj.tier1) return { ...adj.tier1, tier: adj.tier1.label };
    if (clCr >= 15 && adj.tier2) return { ...adj.tier2, tier: adj.tier2.label };
    return { ...adj.tier3, tier: adj.tier3?.label || 'Filtrado grave / HD' };
}

export function getContraindication(drugId, organismId, resistanceId) {
    const drug = DRUGS[drugId];
    if (!drug) return null;
    if (resistanceId === 'MBL' && ['CAZ_AVI', 'IMI_REL', 'MERO_VABOR', 'CFP_ETZ'].includes(drugId)) return `Fármaco NO activo frente a MBL.`;
    if (resistanceId === 'OXA_48' && ['IMI_REL', 'MERO_VABOR'].includes(drugId)) return `Fármaco NO activo frente a OXA-48.`;
    if (resistanceId === 'KPC' && ['CTZ_TAZ', 'CFP_ETZ'].includes(drugId)) return `Fármaco NO activo frente a KPC.`;
    if (organismId === 'P_aeruginosa' && ['ERV', 'ATM_AVI'].includes(drugId)) return `Fármaco SIN actividad útil frente a P. aeruginosa.`;
    if (organismId === 'A_baumannii' && ['MERO_VABOR', 'CTZ_TAZ', 'CAZ_AVI', 'ATM_AVI'].includes(drugId)) return `Fármaco SIN actividad frente a A. baumannii.`;
    return null;
}

export function evaluateFunding(organismId, resistanceId, drugId, hasAntibiogram = false) {
    const recs = getRecommendation(organismId, resistanceId);
    const isRecommended = recs.some(r => r.drugId === drugId);
    const contra = getContraindication(drugId, organismId, resistanceId);
    const result = { meets: hasAntibiogram && !!resistanceId && isRecommended && !contra, criteria: [], missing: [], contraindication: contra };
    if (hasAntibiogram) result.criteria.push('✓ Tratamiento dirigido'); else result.missing.push('✗ Falta antibiograma');
    if (resistanceId) result.criteria.push(`✓ Mecanismo: ${resistanceId}`); else result.missing.push('✗ Falta mecanismo');
    if (isRecommended) result.criteria.push('✓ Recomendado SMS'); else result.missing.push('✗ No recomendado SMS');
    return result;
}

export const ANTIBIOGRAM_ANTIBIOTICS = [
    'Amikacina', 'Amoxicilina/clav', 'Ampicilina', 'Aztreonam', 'Cefepima', 'Cefotaxima', 'Ceftazidima', 'Ceftolozano/taz',
    'Ceftriaxona', 'Ciprofloxacino', 'Colistina', 'Cotrimoxazol', 'Ertapenem', 'Fosfomicina', 'Gentamicina', 'Imipenem',
    'Levofloxacino', 'Meropenem', 'Minociclina', 'Piperacilina/taz', 'Tigeciclina', 'Tobramicina'
];
