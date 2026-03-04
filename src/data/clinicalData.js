// ============================================================================
// ATB-SMS: Clinical Data Module
// Complete decision tree from SMS Consensus on New Antimicrobials (2026)
// ============================================================================

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
            loading: '2g/0.67g IV',
            maintenance: '1.5g/0.5g cada 6h',
            infusion: '3 horas',
            notes: 'Dosis de carga seguida de mantenimiento'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento dirigido en BGN productores de MBL sin alternativas.',
        targetOrganisms: ['Enterobacterales', 'S_maltophilia'],
        targetResistance: ['MBL'],
        renalAdjustment: {
            normal: { dose: '1.5g/0.5g cada 6h', loading: '2g/0.67g', infusion: '3h' },
            augmented: { dose: '1.5g/0.5g cada 6h', loading: '2g/0.67g', infusion: '3h', notes: 'Mismo régimen' },
            tier1: { label: 'ClCr 31-50 mL/min', dose: '1g/0.33g cada 6h', loading: '2g/0.67g', infusion: '3h' },
            tier2: { label: 'ClCr 16-30 mL/min', dose: '0.75g/0.25g cada 6h', loading: '2g/0.67g', infusion: '3h' },
            tier3: { label: 'ClCr ≤15 mL/min', dose: '0.75g/0.25g cada 8h', loading: '2g/0.67g', infusion: '3h' },
            hd: { dose: 'Dosis adicional post-HD', notes: 'Administrar dosis suplementaria tras hemodiálisis' }
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
            maintenance: '2g/0.5g cada 8h',
            infusion: '2 horas',
            notes: null
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Reservado para Enterobacterales BLEE/AmpC (ahorro de carbapenémicos).',
        targetOrganisms: ['Enterobacterales'],
        targetResistance: ['BLEE_AmpC'],
        renalAdjustment: {
            normal: { dose: '2g/0.5g cada 8h', infusion: '2h' },
            augmented: { dose: '2g/0.5g cada 8h', infusion: '2h' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: '1g/0.25g cada 8h', infusion: '2h' },
            tier2: { label: 'ClCr 15-30 mL/min', dose: '1g/0.25g cada 12h', infusion: '2h' },
            tier3: { label: 'ClCr <15 mL/min', dose: '0.5g/0.125g cada 12h', infusion: '2h' },
            hd: { dose: 'Dosis suplementaria post-HD', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'CFD': {
        id: 'CFD',
        abbr: 'CFD',
        name: 'Cefiderocol',
        components: 'Cefiderocol (cefalosporina siderófora)',
        mechanism: 'Cefalosporina siderófora. Usa el transporte activo de hierro para penetrar la membrana externa. Estable frente a la mayoría de β-lactamasas incluyendo MBL.',
        spectrum: 'Amplio espectro: Enterobacterales (MBL, KPC, OXA-48), P. aeruginosa, A. baumannii, S. maltophilia.',
        notActive: 'Gram-positivos, anaerobios',
        standardDose: {
            loading: null,
            maintenance: '2g cada 8h',
            infusion: '3 horas',
            notes: 'En aclaramiento aumentado (ClCr ≥120): 2g cada 6h'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento dirigido cuando no hay alternativas.',
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa', 'A_baumannii', 'S_maltophilia'],
        targetResistance: ['MBL', 'KPC', 'OXA_48'],
        renalAdjustment: {
            normal: { dose: '2g cada 8h', infusion: '3h' },
            augmented: { dose: '2g cada 6h', infusion: '3h', notes: 'ClCr ≥120 mL/min: aumentar frecuencia' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: '1.5g cada 8h', infusion: '3h' },
            tier2: { label: 'ClCr 15-30 mL/min', dose: '1g cada 8h', infusion: '3h' },
            tier3: { label: 'ClCr <15 mL/min', dose: '0.75g cada 12h', infusion: '3h' },
            hd: { dose: 'Dosis suplementaria post-HD', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'CAZ_AVI': {
        id: 'CAZ_AVI',
        abbr: 'CAZ/AVI',
        name: 'Ceftazidima/Avibactam',
        components: 'Ceftazidima + Avibactam',
        mechanism: 'Cefalosporina 3ª gen + Inhibidor de β-lactamasas (Clase A, C, D/OXA-48). No activo frente a MBL.',
        spectrum: 'Enterobacterales (KPC, OXA-48), P. aeruginosa DTR.',
        notActive: 'MBL (NDM, VIM, IMP)',
        standardDose: {
            loading: null,
            maintenance: '2g/0.5g cada 8h',
            infusion: '2 horas',
            notes: null
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento de elección para OXA-48. Alternativa para KPC en paciente no crítico.',
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa'],
        targetResistance: ['KPC', 'OXA_48', 'ClassA_C'],
        renalAdjustment: {
            normal: { dose: '2g/0.5g cada 8h', infusion: '2h' },
            augmented: { dose: '2g/0.5g cada 8h', infusion: '2h' },
            tier1: { label: 'ClCr 31-50 mL/min', dose: '1g/0.25g cada 8h', infusion: '2h' },
            tier2: { label: 'ClCr 16-30 mL/min', dose: '0.75g/0.1875g cada 12h', infusion: '2h' },
            tier3: { label: 'ClCr ≤15 mL/min', dose: '0.75g/0.1875g cada 24h', infusion: '2h' },
            hd: { dose: 'Dosis suplementaria post-HD', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'CTZ_TAZ': {
        id: 'CTZ_TAZ',
        abbr: 'CTZ/TAZ',
        name: 'Ceftolozano/Tazobactam',
        components: 'Ceftolozano + Tazobactam',
        mechanism: 'Cefalosporina antipseudomónica + Inhibidor de β-lactamasas (Clase A). Muy activo frente a P. aeruginosa DTR (no carbapenemasa).',
        spectrum: 'P. aeruginosa DTR (mecanismos no carbapenemasa). Enterobacterales BLEE.',
        notActive: 'Carbapenemasas (KPC, MBL, OXA-48), Acinetobacter',
        standardDose: {
            loading: null,
            maintenance: '1.5g cada 8h',
            infusion: '1 hora',
            notes: 'En neumonía nosocomial/NAV: 3g cada 8h'
        },
        pneumoniaDose: '3g cada 8h',
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento de elección para P. aeruginosa DTR (no carbapenemasa).',
        targetOrganisms: ['P_aeruginosa'],
        targetResistance: ['DTR'],
        renalAdjustment: {
            normal: { dose: '1.5g cada 8h (3g en neumonía)', infusion: '1h' },
            augmented: { dose: '1.5g cada 8h (3g en neumonía)', infusion: '1h' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: '750mg cada 8h (1.5g en neumonía)', infusion: '1h' },
            tier2: { label: 'ClCr 15-30 mL/min', dose: '375mg cada 8h (750mg en neumonía)', infusion: '1h' },
            tier3: { label: 'ClCr <15 mL/min', dose: '375mg dosis única, luego post-HD', infusion: '1h' },
            hd: { dose: 'Dosis suplementaria post-HD', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'ERV': {
        id: 'ERV',
        abbr: 'ERV',
        name: 'Eravaciclina',
        components: 'Eravaciclina (tetraciclina sintética)',
        mechanism: 'Tetraciclina de nueva generación. Activa frente a gram-positivos (MRSA, Enterococcus) y gram-negativos multirresistentes.',
        spectrum: 'MRSA, Enterococcus, Enterobacterales (KPC, MBL, OXA-48), A. baumannii, S. maltophilia.',
        notActive: 'P. aeruginosa',
        standardDose: {
            loading: null,
            maintenance: '1mg/kg cada 12h',
            infusion: '1 hora (aprox. 60 min)',
            notes: 'Solo indicada para IIAc'
        },
        indications: ['IIAc'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento dirigido para IIAc por BGN multirresistente.',
        targetOrganisms: ['Enterobacterales', 'A_baumannii', 'S_maltophilia'],
        targetResistance: ['MBL', 'KPC', 'OXA_48', 'BLEE_AmpC'],
        renalAdjustment: {
            normal: { dose: '1mg/kg cada 12h', infusion: '1h' },
            augmented: { dose: '1mg/kg cada 12h', infusion: '1h' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: 'No requiere ajuste', infusion: '1h' },
            tier2: { label: 'ClCr 15-30 mL/min', dose: 'No requiere ajuste', infusion: '1h' },
            tier3: { label: 'ClCr <15 mL/min', dose: 'No requiere ajuste', infusion: '1h' },
            hd: { dose: 'No requiere ajuste', notes: 'No se elimina por hemodiálisis' }
        }
    },
    'IMI_REL': {
        id: 'IMI_REL',
        abbr: 'IMI/REL',
        name: 'Imipenem/Cilastatina/Relebactam',
        components: 'Imipenem + Cilastatina + Relebactam',
        mechanism: 'Carbapenémico + Inhibidor de β-lactamasas (Clase A, C). No activo frente a OXA-48 ni MBL. Aporta cobertura anaerobia y gram-positivos.',
        spectrum: 'Enterobacterales (KPC), P. aeruginosa DTR (Clase A/C). Cobertura anaerobia.',
        notActive: 'OXA-48, MBL',
        standardDose: {
            loading: null,
            maintenance: '500/500/250mg cada 6h',
            infusion: '30 minutos',
            notes: 'Cobertura anaerobia y gram-positivos'
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento de elección para KPC en paciente crítico con necesidad de cobertura anaerobia/G+.',
        targetOrganisms: ['Enterobacterales', 'P_aeruginosa'],
        targetResistance: ['KPC', 'ClassA_C'],
        renalAdjustment: {
            normal: { dose: '500/500/250mg cada 6h', infusion: '30min' },
            augmented: { dose: '500/500/250mg cada 6h', infusion: '30min' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: '200/200/100mg cada 6h', infusion: '30min' },
            tier2: { label: 'ClCr 16-30 mL/min', dose: '200/200/100mg cada 6h', infusion: '30min' },
            tier3: { label: 'ClCr <15 mL/min', dose: 'Evitar uso', infusion: '-', notes: 'Riesgo de acumulación y toxicidad' },
            hd: { dose: 'Dosis suplementaria post-HD', notes: 'Administrar tras hemodiálisis' }
        }
    },
    'MERO_VABOR': {
        id: 'MERO_VABOR',
        abbr: 'MERO/VABOR',
        name: 'Meropenem/Vaborbactam',
        components: 'Meropenem + Vaborbactam',
        mechanism: 'Carbapenémico + Inhibidor de β-lactamasas (Clase A, C). Muy potente frente a KPC. No activo frente a OXA-48 ni MBL.',
        spectrum: 'Enterobacterales (KPC). Especialmente indicado en alto inóculo, CMI elevada o exposición previa a CAZ/AVI.',
        notActive: 'OXA-48, MBL, Acinetobacter',
        standardDose: {
            loading: null,
            maintenance: '2g/2g cada 8h',
            infusion: '3 horas',
            notes: null
        },
        indications: ['IIAc', 'ITUc', 'NAH_NAV', 'Bacteriemia'],
        funding: 'Financiación restringida (BIFIMED). Tratamiento de elección para KPC (alto inóculo, CMI elevada, exposición previa a CAZ/AVI).',
        targetOrganisms: ['Enterobacterales'],
        targetResistance: ['KPC'],
        renalAdjustment: {
            normal: { dose: '2g/2g cada 8h', infusion: '3h' },
            augmented: { dose: '2g/2g cada 8h', infusion: '3h' },
            tier1: { label: 'ClCr 30-50 mL/min', dose: '1g/1g cada 8h', infusion: '3h' },
            tier2: { label: 'ClCr 15-30 mL/min', dose: '1g/1g cada 12h', infusion: '3h' },
            tier3: { label: 'ClCr <15 mL/min', dose: '0.5g/0.5g cada 12h', infusion: '3h' },
            hd: { dose: 'Dosis suplementaria post-HD', notes: 'Administrar tras hemodiálisis' }
        }
    }
};

// ============================================================================
// ORGANISMS
// ============================================================================
export const ORGANISMS = {
    'Enterobacterales': {
        id: 'Enterobacterales',
        name: 'Enterobacterales',
        description: 'Citrobacter, E. coli, Klebsiella, Morganella, Proteus, Providencia, Raoultella, Serratia',
        resistanceMechanisms: ['MBL', 'KPC', 'OXA_48', 'BLEE_AmpC'],
        icon: '🦠'
    },
    'P_aeruginosa': {
        id: 'P_aeruginosa',
        name: 'Pseudomonas aeruginosa',
        description: 'P. aeruginosa DTR (Difficult-to-Treat Resistance)',
        resistanceMechanisms: ['MBL', 'DTR', 'ClassA_C'],
        icon: '🔬'
    },
    'A_baumannii': {
        id: 'A_baumannii',
        name: 'Acinetobacter baumannii',
        description: 'A. baumannii resistente a carbapenémicos',
        resistanceMechanisms: ['CR'],
        icon: '🧫'
    },
    'S_maltophilia': {
        id: 'S_maltophilia',
        name: 'Stenotrophomonas maltophilia',
        description: 'S. maltophilia multirresistente',
        resistanceMechanisms: ['MDR'],
        icon: '🔎'
    }
};

// ============================================================================
// RESISTANCE MECHANISMS
// ============================================================================
export const RESISTANCE_MECHANISMS = {
    'MBL': {
        id: 'MBL',
        name: 'Metalobetalactamasa (MBL)',
        description: 'NDM, VIM, IMP y otras. Hidroliza la mayoría de β-lactámicos incluyendo carbapenémicos.',
        examples: 'NDM, VIM, IMP',
        ambler: 'Clase B'
    },
    'KPC': {
        id: 'KPC',
        name: 'KPC (Klebsiella pneumoniae carbapenemasa)',
        description: 'Serina carbapenemasa. Hidroliza penicilinas, cefalosporinas y carbapenémicos.',
        examples: 'KPC-2, KPC-3',
        ambler: 'Clase A'
    },
    'OXA_48': {
        id: 'OXA_48',
        name: 'OXA-48',
        description: 'Oxacilinasa con actividad carbapenemasa débil. Frecuente en K. pneumoniae.',
        examples: 'OXA-48, OXA-181, OXA-232',
        ambler: 'Clase D'
    },
    'BLEE_AmpC': {
        id: 'BLEE_AmpC',
        name: 'BLEE / AmpC',
        description: 'β-lactamasas de espectro extendido y cefalosporinasas AmpC. Resistencia a cefalosporinas de 3ª gen.',
        examples: 'CTX-M, TEM, SHV, AmpC',
        ambler: 'Clase A / Clase C'
    },
    'DTR': {
        id: 'DTR',
        name: 'DTR (Difficult-to-Treat Resistance)',
        description: 'Resistencia a todos los β-lactámicos de primera línea, fluoroquinolonas y aminoglucósidos, SIN carbapenemasa identificada.',
        examples: 'Pérdida de porinas, bombas de eflujo',
        ambler: 'No aplica'
    },
    'ClassA_C': {
        id: 'ClassA_C',
        name: 'Betalactamasas Clase A / C',
        description: 'Betalactamasas de Clase A (serina) o Clase C (AmpC) en P. aeruginosa.',
        examples: 'GES, AmpC desreprimida',
        ambler: 'Clase A / Clase C'
    },
    'CR': {
        id: 'CR',
        name: 'Resistente a carbapenémicos',
        description: 'Acinetobacter baumannii resistente a carbapenémicos (múltiples mecanismos).',
        examples: 'OXA-23, OXA-24, OXA-58, NDM',
        ambler: 'Variable'
    },
    'MDR': {
        id: 'MDR',
        name: 'Multirresistente (MDR)',
        description: 'Resistencia intrínseca o adquirida a múltiples clases de antimicrobianos.',
        examples: 'Resistencia intrínseca a múltiples clases',
        ambler: 'Variable'
    }
};

// ============================================================================
// INFECTION SITES
// ============================================================================
export const INFECTION_SITES = {
    'IIAc': {
        id: 'IIAc',
        name: 'Infección intraabdominal complicada',
        abbr: 'IIAc'
    },
    'ITUc': {
        id: 'ITUc',
        name: 'Infección tracto urinario complicada (incl. pielonefritis)',
        abbr: 'ITUc'
    },
    'NAH_NAV': {
        id: 'NAH_NAV',
        name: 'Neumonía nosocomial / asociada a ventilación mecánica',
        abbr: 'NAH/NAV'
    },
    'Bacteriemia': {
        id: 'Bacteriemia',
        name: 'Bacteriemia / Infección del torrente sanguíneo',
        abbr: 'Bacteriemia'
    },
    'IPPB': {
        id: 'IPPB',
        name: 'Infección de piel y partes blandas',
        abbr: 'IPPB'
    }
};

// ============================================================================
// DECISION RULES ENGINE
// ============================================================================

/**
 * KPC context questions for refined drug selection
 */
export const KPC_CONTEXT_OPTIONS = [
    { id: 'critical', label: 'Paciente crítico / alto inóculo / CMI elevada / exposición previa a CAZ/AVI', drug: 'MERO_VABOR' },
    { id: 'anaerobic', label: 'Necesidad de cobertura anaerobia o gram-positivos', drug: 'IMI_REL' },
    { id: 'non_critical', label: 'Paciente no crítico, sin criterios anteriores', drug: 'CAZ_AVI' }
];

/**
 * Main decision engine: given organism + resistance → recommended drug(s)
 * Returns an array of { drugId, priority, rationale }
 */
export function getRecommendation(organismId, resistanceId, contextId = null, siteId = null) {
    const results = [];

    // Enterobacterales
    if (organismId === 'Enterobacterales') {
        if (resistanceId === 'MBL') {
            results.push(
                { drugId: 'ATM_AVI', priority: 1, rationale: 'Tratamiento de elección para Enterobacterales productoras de MBL. Avibactam protege al aztreonam de otras β-lactamasas.' },
                { drugId: 'CFD', priority: 1, rationale: 'Alternativa de primera línea. Cefalosporina siderófora estable frente a MBL.' }
            );
        } else if (resistanceId === 'KPC') {
            if (contextId === 'critical') {
                results.push({ drugId: 'MERO_VABOR', priority: 1, rationale: 'Tratamiento de elección para KPC en paciente crítico, alto inóculo, CMI elevada o exposición previa a CAZ/AVI.' });
                results.push({ drugId: 'CAZ_AVI', priority: 2, rationale: 'Alternativa si no disponible MERO/VABOR.' });
            } else if (contextId === 'anaerobic') {
                results.push({ drugId: 'IMI_REL', priority: 1, rationale: 'Tratamiento de elección cuando se necesita cobertura anaerobia y/o gram-positivos.' });
                results.push({ drugId: 'MERO_VABOR', priority: 2, rationale: 'Alternativa. Añadir metronidazol si se requiere cobertura anaerobia.' });
            } else {
                // non-critical (default)
                results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'Tratamiento de elección para KPC en paciente no crítico.' });
                results.push({ drugId: 'MERO_VABOR', priority: 2, rationale: 'Alternativa en caso de no respuesta.' });
            }
        } else if (resistanceId === 'OXA_48') {
            results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'Tratamiento de elección para OXA-48. Avibactam inhibe OXA-48 (Clase D).' });
            results.push({ drugId: 'CFD', priority: 2, rationale: 'Alternativa. Actividad frente a OXA-48.' });
        } else if (resistanceId === 'BLEE_AmpC') {
            results.push({ drugId: 'CFP_ETZ', priority: 1, rationale: 'Tratamiento de elección para BLEE/AmpC (estrategia de ahorro de carbapenémicos).' });
        }
    }

    // P. aeruginosa
    if (organismId === 'P_aeruginosa') {
        if (resistanceId === 'MBL') {
            results.push({ drugId: 'CFD', priority: 1, rationale: 'Tratamiento de elección para P. aeruginosa productora de MBL.' });
        } else if (resistanceId === 'DTR') {
            results.push({ drugId: 'CTZ_TAZ', priority: 1, rationale: 'Tratamiento de elección para P. aeruginosa DTR (no carbapenemasa). Muy activo frente a mecanismos de resistencia no enzimáticos.' });
        } else if (resistanceId === 'ClassA_C') {
            results.push(
                { drugId: 'IMI_REL', priority: 1, rationale: 'Tratamiento de elección para P. aeruginosa con β-lactamasas Clase A/C.' },
                { drugId: 'CAZ_AVI', priority: 1, rationale: 'Alternativa de primera línea para P. aeruginosa con β-lactamasas Clase A/C.' }
            );
        }
    }

    // A. baumannii
    if (organismId === 'A_baumannii') {
        if (resistanceId === 'CR') {
            results.push({ drugId: 'CFD', priority: 1, rationale: 'Tratamiento de elección para A. baumannii resistente a carbapenémicos.' });
        }
    }

    // S. maltophilia
    if (organismId === 'S_maltophilia') {
        if (resistanceId === 'MDR') {
            results.push(
                { drugId: 'ATM_AVI', priority: 1, rationale: 'Tratamiento de elección para S. maltophilia MDR.' },
                { drugId: 'CFD', priority: 1, rationale: 'Alternativa de primera línea para S. maltophilia MDR.' }
            );
        }
    }

    // Filter by infection site if provided
    if (siteId && results.length > 0) {
        const filtered = results.filter(r => {
            const drug = DRUGS[r.drugId];
            return drug.indications.includes(siteId);
        });
        // If filtering removes all results, return unfiltered with a note
        if (filtered.length === 0 && results.length > 0) {
            results.forEach(r => {
                r.siteWarning = `Indicación ${siteId} no aprobada específicamente para este fármaco. Valorar uso off-label.`;
            });
        } else {
            return filtered;
        }
    }

    return results;
}

/**
 * Get available organisms for a specific drug
 */
export function getOrganismsForDrug(drugId) {
    const drug = DRUGS[drugId];
    if (!drug) return [];
    return drug.targetOrganisms.map(orgId => ORGANISMS[orgId]).filter(Boolean);
}

/**
 * Get available resistance mechanisms for a given organism
 */
export function getResistanceForOrganism(organismId) {
    const org = ORGANISMS[organismId];
    if (!org) return [];
    return org.resistanceMechanisms.map(resId => RESISTANCE_MECHANISMS[resId]).filter(Boolean);
}

/**
 * Get drugs active against a given organism + resistance
 */
export function getDrugsForOrganismResistance(organismId, resistanceId) {
    return Object.values(DRUGS).filter(drug => {
        return drug.targetOrganisms.includes(organismId) && drug.targetResistance.includes(resistanceId);
    });
}

/**
 * Get available infection sites for a drug
 */
export function getSitesForDrug(drugId) {
    const drug = DRUGS[drugId];
    if (!drug) return [];
    return drug.indications.map(siteId => INFECTION_SITES[siteId]).filter(Boolean);
}

/**
 * Calculate renal-adjusted dose for a drug
 */
export function getRenalAdjustedDose(drugId, clCr) {
    const drug = DRUGS[drugId];
    if (!drug || !drug.renalAdjustment) return null;

    const adj = drug.renalAdjustment;

    if (clCr >= 120) return { ...adj.augmented, tier: 'Aclaramiento aumentado (≥120 mL/min)' };
    if (clCr > 50) return { ...adj.normal, tier: 'Normal (>50 mL/min)' };
    if (clCr >= 30) return { ...adj.tier1, tier: adj.tier1.label };
    if (clCr >= 15) return { ...adj.tier2, tier: adj.tier2.label };
    return { ...adj.tier3, tier: adj.tier3.label };
}

/**
 * Evaluate if treatment meets BIFIMED funding criteria
 */
export function evaluateFunding(organismId, resistanceId, drugId, hasAntibiogram = false) {
    const result = {
        meets: false,
        criteria: [],
        missing: []
    };

    // Criterion 1: Directed treatment based on microbiological confirmation
    if (hasAntibiogram) {
        result.criteria.push('✓ Tratamiento dirigido con confirmación microbiológica');
    } else {
        result.missing.push('✗ Se requiere antibiograma (tratamiento dirigido)');
    }

    // Criterion 2: Documented resistance mechanism
    if (resistanceId) {
        result.criteria.push(`✓ Mecanismo de resistencia documentado: ${RESISTANCE_MECHANISMS[resistanceId]?.name || resistanceId}`);
    } else {
        result.missing.push('✗ Se requiere documentar mecanismo de resistencia');
    }

    // Criterion 3: Drug matches organism + resistance
    const recommendations = getRecommendation(organismId, resistanceId);
    const isRecommended = recommendations.some(r => r.drugId === drugId);

    if (isRecommended) {
        result.criteria.push('✓ Fármaco recomendado según consenso SMS para este microorganismo/resistencia');
    } else {
        result.missing.push('✗ Fármaco no indicado por consenso SMS para esta combinación microorganismo/resistencia');
    }

    result.meets = result.missing.length === 0;
    return result;
}

// ============================================================================
// COMMON ANTIBIOTICS FOR ANTIBIOGRAM TABLE
// ============================================================================
export const ANTIBIOGRAM_ANTIBIOTICS = [
    'Amikacina', 'Amoxicilina/Ác. clavulánico', 'Ampicilina', 'Aztreonam',
    'Cefepima', 'Cefotaxima', 'Ceftazidima', 'Ceftolozano/Tazobactam',
    'Ceftriaxona', 'Ciprofloxacino', 'Colistina', 'Cotrimoxazol',
    'Ertapenem', 'Fosfomicina', 'Gentamicina', 'Imipenem',
    'Levofloxacino', 'Meropenem', 'Minociclina', 'Piperacilina/Tazobactam',
    'Tigeciclina', 'Tobramicina'
];
