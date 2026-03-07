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
        // Sanitizar y validar los datos del antibiograma
        this.atb = antibiogram
            .filter(a => a.antibiotic && a.sir)
            .map(a => ({
                name: a.antibiotic.toLowerCase().trim(),
                sir: a.sir.toUpperCase(),
                mic: a.mic || ''
            }));
    }

    matchDrug(atbName, targetName) {
        const atb = atbName.toLowerCase();
        const tgt = targetName.toLowerCase();
        
        // Combinación con inhibidor (ej. ceftazidima/avibactam)
        if (tgt.includes('/')) {
            const parts = tgt.split('/');
            return parts.every(p => atb.includes(p.trim()));
        }
        
        // Fármaco simple: asegurar que el antibiograma no tenga un inhibidor asociado
        const inhibitors = ['clav', 'tazobactam', 'taz', 'avibactam', 'vaborbactam', 'relebactam', 'sulbactam', 'enmetazobactam'];
        const hasInhibitor = inhibitors.some(inh => atb.includes(inh));
        
        if (hasInhibitor) {
            return false; // Si busco 'meropenem', descarto 'meropenem/vaborbactam'
        }
        
        return atb.includes(tgt);
    }

    isS(names) { return this.atb.some(a => names.some(n => this.matchDrug(a.name, n)) && (a.sir === 'S' || a.sir === 'I')); }
    isR(names) { return this.atb.some(a => names.some(n => this.matchDrug(a.name, n)) && a.sir === 'R'); }
    getDrugs(names, sirs) { return this.atb.filter(a => names.some(n => this.matchDrug(a.name, n)) && sirs.includes(a.sir)).map(a => a.name); }

    analyze() {
        const alerts = [];
        const carbapenems = ['meropenem', 'imipenem', 'ertapenem', 'doripenem'];
        const cephs3 = ['ceftriaxona', 'cefotaxima', 'ceftazidima'];
        const cephs4 = ['cefepima'];
        const aminos = ['amikacina', 'gentamicina', 'tobramicina'];

        // =========================================================================
        // 1. REGLAS EXPERTAS INTERNACIONALES (EUCAST / CLSI): RESISTENCIAS INTRÍNSECAS
        // =========================================================================
        
        if (this.org === 'Enterobacterales') {
            if (this.isS(['colistina']) || this.isS(['tigeciclina'])) {
                alerts.push('REGLA EXPERTA EUCAST (Aviso Biológico): Las especies de la tribu Proteeae (Proteus, Providencia, Morganella) y Serratia spp. tienen resistencia intrínseca a Colistina. Proteeae también a Tigeciclina. Valide la especie; si pertenece a estos grupos, asuma Resistencia independientemente del antibiograma.');
            }
        }
        
        if (this.org === 'P_aeruginosa') {
            const intrinsicPse = ['ertapenem', 'ceftriaxona', 'cefotaxima', 'tigeciclina', 'ampicilina', 'amoxicilina/clav', 'cefoxitina', 'trimetoprim'];
            if (this.isS(intrinsicPse)) {
                const sDrugs = this.getDrugs(intrinsicPse, ['S', 'I']);
                alerts.push(`REGLA EXPERTA EUCAST (Incongruencia Crítica): P. aeruginosa es intrínsecamente resistente a ${sDrugs.join(', ')}. Un resultado Sensible indica un error en la identificación, contaminación o fallo grave del sistema automatizado.`);
            }
        }
        
        if (this.org === 'A_baumannii') {
            const intrinsicAci = ['ertapenem', 'cefotaxima', 'ceftriaxona', 'ampicilina', 'amoxicilina/clav', 'aztreonam', 'trimetoprim'];
            if (this.isS(intrinsicAci)) {
                const sDrugs = this.getDrugs(intrinsicAci, ['S', 'I']);
                alerts.push(`REGLA EXPERTA EUCAST (Incongruencia Crítica): A. baumannii es intrínsecamente resistente a ${sDrugs.join(', ')}. Un reporte de Sensibilidad es biológicamente imposible.`);
            }
        }

        if (this.org === 'S_maltophilia') {
            if (this.isS(carbapenems)) {
                alerts.push('REGLA EXPERTA EUCAST (Incongruencia Crítica): S. maltophilia codifica cromosómicamente una Metalo-Beta-Lactamasa (L1) que hidroliza todos los carbapenémicos. Es biológicamente siempre Resistente a ellos.');
            }
            if (this.isS(['aztreonam'])) {
                alerts.push('REGLA EXPERTA EUCAST: S. maltophilia produce una cefalosporinasa cromosómica L2 que inactiva Aztreonam. Sensibilidad imposible.');
            }
        }

        // =========================================================================
        // 2. VALIDACIÓN FENOTÍPICA DE MECANISMOS DE RESISTENCIA
        // =========================================================================

        if (this.res === 'BLEE_AmpC') {
            if (this.isS(cephs3)) {
                const sCephs = this.getDrugs(cephs3, ['S', 'I']);
                alerts.push(`INCONGRUENCIA FENOTÍPICA: Las enzimas BLEE/AmpC hidrolizan sistemáticamente las Cefalosporinas de 3ª generación (${sCephs.join(', ')}). Si el antibiograma muestra sensibilidad, revise si hay un efecto inóculo o error de detección (falso negativo).`);
            }
        }

        // Carbapenemasas
        if (this.res === 'MBL' || this.res === 'KPC' || this.res === 'OXA_48' || this.res === 'CR') {
            
            // Validación frente a Carbapenémicos clásicos
            if (this.isS(carbapenems)) {
                const sCarbas = this.getDrugs(carbapenems, ['S', 'I']);
                if (this.res === 'OXA_48') {
                    alerts.push(`AVISO CLÍNICO (Perfil OXA-48): Las carbapenemasas tipo OXA-48 tienen una actividad hidrolítica débil y pueden mostrar sensibilidad in vitro a carbapenémicos (${sCarbas.join(', ')}). Clínicamente NO DEBEN USARSE en monoterapia a dosis estándar por alto riesgo de fracaso.`);
                } else {
                    alerts.push(`INCONGRUENCIA CRÍTICA: Se ha declarado una Carbapenemasa tipo ${this.res} pero existe sensibilidad in vitro a ${sCarbas.join(', ')}. En enzimas KPC y MBL esto es excepcionalmente raro y sugiere un error de asignación de mecanismo o lectura.`);
                }
            }

            // MBL vs Nuevos Inhibidores (Regla de ORO)
            if (this.res === 'MBL') {
                const classA_C_inhibitors = ['ceftazidima/avibactam', 'meropenem/vaborbactam', 'imipenem/relebactam', 'ceftolozano/tazobactam', 'cefepima/enmetazobactam'];
                if (this.isS(classA_C_inhibitors)) {
                    const sNew = this.getDrugs(classA_C_inhibitors, ['S', 'I']);
                    alerts.push(`INCONGRUENCIA CRÍTICA (MBL): Las metalo-beta-lactamasas (Ambler B) NO son inhibidas por Avibactam, Vaborbactam ni Relebactam. La sensibilidad reportada a ${sNew.join(', ')} es un FALSO SENSIBLE grave del sistema automatizado.`);
                }
            }

            // KPC
            if (this.res === 'KPC') {
                if (this.isS(['ceftolozano/tazobactam'])) {
                    alerts.push(`INCONGRUENCIA CRÍTICA (KPC): KPC inactiva el Ceftolozano/Tazobactam. Un resultado Sensible es falso.`);
                }
                if (this.isR(['ceftazidima/avibactam'])) {
                    alerts.push(`ALERTA PROA PREOCUPANTE: Resistencia detectada a Ceftazidima/Avibactam en presencia de KPC. Alerta de emergencia de variantes KPC mutadas (ej. KPC-31/33). Requiere confirmación molecular urgente.`);
                }
            }

            // OXA-48 (Trampas fenotípicas)
            if (this.res === 'OXA_48') {
                if (this.isS(cephs3) && this.isR(carbapenems)) {
                    alerts.push(`VALIDACIÓN EXPERTA: El fenotipo "Resistente a Carbapenémicos + Sensible a Cefalosporinas de 3ª/4ª" es perfectamente compatible con una OXA-48 pura, ya que esta enzima NO hidroliza Cefalosporinas.`);
                } else if (this.isR(cephs3) || this.isR(cephs4)) {
                    alerts.push(`AVISO FENOTÍPICO: OXA-48 no hidroliza Cefalosporinas. La resistencia observada a Cefalosporinas de 3ª/4ª indica co-producción de BLEE o AmpC (muy frecuente en Klebsiella pneumoniae).`);
                }
                if (this.isS(['meropenem/vaborbactam', 'imipenem/relebactam'])) {
                    alerts.push(`TRAMPA IN VITRO (Incongruencia Clínica): Vaborbactam y Relebactam NO inhiben OXA-48. La sensibilidad in vitro observada frente a estos fármacos se debe a la baja CMI basal del carbapenémico, pero el inhibidor no está aportando protección. Existe riesgo de fracaso.`);
                }
            }
        }

        // =========================================================================
        // 3. REGLAS BIOQUÍMICAS BÁSICAS DE ABERRACIÓN CASCADA (Tipo AES VITEK)
        // =========================================================================
        
        if (this.isS(['ampicilina', 'amoxicilina', 'cefazolina']) && this.isR(cephs3)) {
            alerts.push('REGLA BIOQUÍMICA ABERRANTE: Sensibilidad a penicilinas/cefalosporinas de 1ª generación con resistencia a Cefalosporinas de 3ª generación es enzimáticamente imposible. Sugiere un error severo en el laboratorio.');
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
            results.push({ drugId: 'ATM_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN (BIFIMED). Aztreonam/Avibactam es estable frente a MBL, y el avibactam protege al aztreonam de BLEE o AmpC coexistentes.' });
            results.push({ drugId: 'CFD', priority: 2, rationale: 'ALTERNATIVA. Cefiderocol evade las MBL utilizando el transporte de hierro bacteriano. Muy útil si hay co-infección con P. aeruginosa multirresistente.' });
        } else if (resistanceId === 'KPC') {
            if (contextId === 'critical') {
                results.push({ drugId: 'MERO_VABOR', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN en paciente crítico (BIFIMED). Vaborbactam es un potente inhibidor borónico diseñado específicamente contra carbapenemasas de clase A como KPC.' });
                results.push({ drugId: 'CAZ_AVI', priority: 2, rationale: 'ALTERNATIVA eficaz, pero en alto inóculo o situación crítica se prefiere Meropenem/Vaborbactam.' });
                results.push({ drugId: 'IMI_REL', priority: 2, rationale: 'ALTERNATIVA eficaz. Aporta ventaja si se requiere cobertura anaerobicida adicional en infecciones intraabdominales.' });
            } else {
                results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN en paciente no crítico (BIFIMED). Avibactam inactiva eficazmente las carbapenemasas tipo KPC.' });
                results.push({ drugId: 'MERO_VABOR', priority: 2, rationale: 'ALTERNATIVA de alta eficacia, reservada usualmente para fracaso de CAZ/AVI o cuadros críticos.' });
                results.push({ drugId: 'IMI_REL', priority: 2, rationale: 'ALTERNATIVA de espectro similar, ideal si hay infecciones mixtas con anaerobios o cepas productoras de AmpC desreprimidas.' });
            }
        } else if (resistanceId === 'OXA_48') {
            results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN. Avibactam es el único inhibidor de primera línea con buena actividad frente a las carbapenemasas clase D (OXA-48).' });
            results.push({ drugId: 'CFP_ETZ', priority: 2, rationale: 'TRATAMIENTO DIRIGIDO como estrategia de ahorro de carbapenémicos, especialmente si se asocia con BLEE/AmpC.' });
        } else if (resistanceId === 'BLEE_AmpC') {
            results.push({ drugId: 'CFP_ETZ', priority: 1, rationale: 'ESTRATEGIA DE AHORRO (Carbapenem-sparing). Enmetazobactam inhibe potentes BLEE y AmpC, protegiendo a Cefepima en infecciones graves o ITU.' });
            results.push({ drugId: 'CAZ_AVI', priority: 2, rationale: 'ALTERNATIVA válida, pero suele reservarse para microorganismos productores de carbapenemasas.' });
        } else if (resistanceId === 'CR' || resistanceId === 'MDR') {
            results.push({ drugId: 'ERV', priority: 2, rationale: 'RESERVA (Fluorociclina). Excelente actividad in vitro frente a KPC y OXA-48 en infecciones intraabdominales complicadas. Evita el uso de beta-lactámicos.' });
        }
    }
    
    if (organismId === 'P_aeruginosa') {
        if (resistanceId === 'MBL') {
            results.push({ drugId: 'CFD', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN. Cefiderocol es el único de los nuevos antibióticos estable a las Metalo-beta-lactamasas (VIM, IMP, NDM) de Pseudomonas.' });
        } else if (resistanceId === 'ClassA_C') {
            results.push({ drugId: 'CAZ_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN. Eficaz si la resistencia está mediada por desrepresión de AmpC o carbapenemasas de clase A (como GES).' });
            results.push({ drugId: 'IMI_REL', priority: 2, rationale: 'ALTERNATIVA (BIFIMED). Relebactam inactiva muy eficientemente la cefalosporinasa derivada de Pseudomonas (PDC/AmpC).' });
        } else if (resistanceId === 'DTR') {
            results.push({ drugId: 'CTZ_TAZ', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN (BIFIMED). Ceftolozano evade brillantemente el cierre de porinas (OprD) y la sobreexpresión de bombas de eflujo (MexAB).' });
            results.push({ drugId: 'IMI_REL', priority: 2, rationale: 'ALTERNATIVA en Pseudomonas DTR no MBL, útil en neumonía nosocomial o bacteriemia asociada.' });
            results.push({ drugId: 'CFD', priority: 3, rationale: 'RESERVA EXCEPCIONAL. Para cepas DTR donde CTZ/TAZ e IMI/REL muestren resistencia confirmada por antibiograma.' });
        }
    }
    
    if (organismId === 'S_maltophilia') {
        results.push({ drugId: 'ATM_AVI', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN. Supera la resistencia dual de S. maltophilia (MBL L1 + Cefalosporinasa L2). ATM evade L1 y AVI inactiva L2.' });
        results.push({ drugId: 'CFD', priority: 1, rationale: 'TRATAMIENTO DE ELECCIÓN. Extremadamente estable a la hidrólisis por las enzimas L1 y L2 típicas de esta bacteria.' });
    }
    
    if (organismId === 'A_baumannii') {
        if (resistanceId === 'CR' || resistanceId === 'MDR') {
            results.push({ drugId: 'CFD', priority: 1, rationale: 'TRATAMIENTO DE RESCATE (BIFIMED). Cefiderocol es el único betalactámico nuevo con actividad intrínseca frente a cepas resistentes a carbapenémicos de Acinetobacter.' });
            results.push({ drugId: 'ERV', priority: 2, rationale: 'ALTERNATIVA (IIAc). Eravaciclina mantiene actividad in vitro excelente incluso frente a cepas XDR de A. baumannii.' });
        }
    }
    
    // Si la infección es IIAc y no hay opciones, ofrecer Eravaciclina si aplica el espectro
    if (siteId === 'IIAc' && results.length === 0) {
        if (organismId === 'Enterobacterales' || organismId === 'A_baumannii') {
            results.push({ drugId: 'ERV', priority: 2, rationale: 'OPCIÓN DE RESCATE (IIAc). Eravaciclina es una fluorociclina de amplio espectro indicada para Infección Intraabdominal Complicada.' });
        }
    }

    return results;
}

export function evaluateFunding(organismId, resistanceId, drugId, antibiogramData = []) {
    const recs = getRecommendation(organismId, resistanceId);
    const matchedRec = recs.find(r => r.drugId === drugId);
    const isRecommended = !!matchedRec;
    const expert = new MicrobiologyExpert(organismId, resistanceId, antibiogramData);
    const incongruities = expert.analyze();
    
    const drug = DRUGS[drugId];
    const organism = ORGANISMS[organismId];
    
    let isSensitive = true;
    let antibiogramMsg = 'Sin antibiograma para confirmar';
    let drugInAtb = null;
    
    if (antibiogramData.length > 0) {
        drugInAtb = antibiogramData.find(a => 
            expert.matchDrug(a.antibiotic, drug.abbr) || 
            expert.matchDrug(a.antibiotic, drug.name.split('/')[0])
        );
        
        if (drugInAtb) {
            isSensitive = (drugInAtb.sir === 'S' || drugInAtb.sir === 'I');
            antibiogramMsg = isSensitive 
                ? 'Sensibilidad in vitro confirmada' 
                : 'Resistencia in vitro detectada';
        } else {
             antibiogramMsg = 'Fármaco no testado en el antibiograma';
        }
    }

    // Análisis clínico exhaustivo de idoneidad (Adecuación del fármaco)
    let clinicalAnalysis = '';
    let isSuitable = true;
    
    if (!drug.targetOrganisms.includes(organismId)) {
        isSuitable = false;
        clinicalAnalysis = `El espectro de actividad de ${drug.name} NO incluye de forma fiable a ${organism?.name || organismId}. Se desaconseja su uso empírico o dirigido.`;
    } else if (!isRecommended) {
        isSuitable = false;
        clinicalAnalysis = `Según las directrices del SMS, ${drug.name} NO es una indicación óptima para una infección por ${organism?.name} productor de ${RESISTANCE_MECHANISMS[resistanceId]?.name}. Las alternativas recomendadas tienen mejor perfil de eficacia o seguridad.`;
    } else {
        clinicalAnalysis = `JUSTIFICACIÓN: ${matchedRec.rationale}`;
    }
    
    if (!isSensitive) {
        isSuitable = false;
        clinicalAnalysis += ` ADVERTENCIA CRÍTICA: El antibiograma muestra RESISTENCIA a este fármaco. Su uso clínico está absolutamente contraindicado.`;
    }

    const meets = isSuitable && isSensitive && incongruities.length === 0;

    return {
        meets,
        clinicalAnalysis, // Nuevo campo explicativo
        criteria: [
            isRecommended ? '✓ Posicionamiento SMS / BIFIMED favorable' : '✗ Fuera de posicionamiento SMS preferente',
            (antibiogramData.length > 0) ? '✓ Antibiograma valorado' : '⚠ Evaluación sin antibiograma',
            (drugInAtb && !isSensitive) ? '✗ Resistente en antibiograma' : (drugInAtb ? '✓ Sensibilidad confirmada' : '⚠ Fármaco no testado in vitro')
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
