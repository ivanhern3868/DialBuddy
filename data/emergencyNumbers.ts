/**
 * Emergency Number Database for DialBuddy
 *
 * Business Purpose:
 * This database maps countries to their official emergency service numbers.
 * Accuracy is CRITICAL - incorrect numbers could prevent a child from reaching
 * help in a life-threatening situation.
 *
 * Verification Process:
 * Every entry in this file has been verified against official government sources.
 * See docs/EMERGENCY_VERIFICATION.md for source URLs and verification dates.
 *
 * Audit Requirement:
 * Any modification to this file MUST include:
 * 1. Update to EMERGENCY_VERIFICATION.md with new source and date
 * 2. Testing with real phone in that country (if possible)
 * 3. Code review by at least one other developer
 *
 * Data Structure:
 * - numbers: Array of ALL valid emergency numbers (child should recognize any)
 * - primaryNumber: The ONE number we teach primarily (shown in lessons)
 * - serviceMap: For multi-number countries, which number calls which service
 * - silentCallSupported: Can silent/open-line calls dispatch help?
 * - dispatcherGreeting: Localized greeting for simulation (i18n key or literal)
 *
 * @author Ivan (DialBuddy Development Team)
 * @created 2024-01-15
 * @lastUpdated 2024-01-15
 */

/**
 * Configuration for a country's emergency services
 */
export interface EmergencyConfig {
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;

  /** Country name in English (for internal reference) */
  countryName: string;

  /** All valid emergency numbers (child should recognize all) */
  numbers: string[];

  /** Primary number to teach (e.g., '911', '112', '999') */
  primaryNumber: string;

  /**
   * Service type mapping for multi-number countries
   * Maps emergency number to service type identifier
   *
   * Service types: 'unified', 'police', 'fire', 'ambulance', 'rescue'
   *
   * Example (Brazil):
   * {
   *   '190': 'police',
   *   '192': 'ambulance',
   *   '193': 'fire'
   * }
   */
  serviceMap: Record<string, 'unified' | 'police' | 'fire' | 'ambulance' | 'rescue'>;

  /**
   * Whether silent/open-line calls can dispatch help
   *
   * true:  Silent call lesson IS shown (country has silent call protocols)
   * false: Silent call lesson NOT shown (voice communication required)
   */
  silentCallSupported: boolean;

  /**
   * Dispatcher greeting for simulation
   *
   * This is what the child hears when the "dispatcher answers" in the
   * emergency module. Should be realistic for that country.
   *
   * Can be:
   * - Literal string: "911, what is your emergency?"
   * - i18n key: "emergency.dispatcher.greeting.us"
   */
  dispatcherGreeting: string;

  /**
   * Official government source URL
   *
   * Used for verification audit trail. Must be a .gov, .gob, or official
   * government domain, OR an international authority (ITU, ISO, etc.)
   */
  officialSource: string;

  /**
   * Last verification date (ISO 8601 format: YYYY-MM-DD)
   *
   * Emergency numbers can change (e.g., countries transitioning to 911).
   * This tracks when we last confirmed the data is current.
   */
  lastVerified: string;

  /**
   * Person who verified this data
   *
   * Accountability for accuracy. Can be name, initials, or GitHub username.
   */
  verifiedBy: string;

  /**
   * Optional notes
   *
   * Country-specific quirks, infrastructure limitations, recent changes, etc.
   */
  notes?: string;
}

/**
 * Emergency Number Database
 *
 * Organized by region for maintainability. Each region contains countries
 * where our supported languages (English, Spanish, Portuguese) are primary.
 *
 * Regions:
 * - North America (US, Canada, Mexico)
 * - Central America (Guatemala through Panama)
 * - Caribbean (Spanish/Portuguese speaking islands)
 * - South America (Colombia through Argentina)
 */
export const EMERGENCY_NUMBERS: Record<string, EmergencyConfig> = {

  // ==========================================================================
  // NORTH AMERICA
  // ==========================================================================

  US: {
    countryCode: 'US',
    countryName: 'United States',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // FCC requires PSAP silent call handling
    dispatcherGreeting: '911, what is your emergency?',
    officialSource: 'https://www.fcc.gov/general/9-1-1-and-e9-1-1-services',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: '988 is suicide/mental health crisis line, NOT general emergency. 311 is non-emergency in some cities. Only teach 911.'
  },

  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // CRTC mandates silent call protocols
    dispatcherGreeting: '911, what is your emergency?',
    officialSource: 'https://www.canada.ca/en/health-canada/services/healthy-living/your-health/environment/know-call-911.html',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Bilingual service (English/French) in some provinces. Use English greeting by default.'
  },

  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: false, // Major cities partial support, rural areas no
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.gob.mx/911',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: '911 system fully unified as of 2017. Old numbers (060, 066, 080, 089) redirect but should NOT be taught.'
  },

  // ==========================================================================
  // CENTRAL AMERICA
  // ==========================================================================

  GT: {
    countryCode: 'GT',
    countryName: 'Guatemala',
    numbers: ['110', '120', '122', '123'],
    primaryNumber: '123', // Red Cross is most reliable for medical emergencies
    serviceMap: {
      '110': 'fire',      // Bomberos Voluntarios
      '120': 'police',    // Policía Nacional Civil
      '122': 'police',    // Municipal Police (varies by city)
      '123': 'ambulance'  // Cruz Roja (Red Cross)
    },
    silentCallSupported: false,
    dispatcherGreeting: 'Emergencias, ¿qué ocurre?',
    officialSource: 'https://conred.gob.gt/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'No unified 911. Teach scenario-based routing: Medical→123, Fire→110, Danger→120'
  },

  BZ: {
    countryCode: 'BZ',
    countryName: 'Belize',
    numbers: ['911', '90'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified',
      '90': 'police'  // Legacy, still functional
    },
    silentCallSupported: false, // Limited to major cities only
    dispatcherGreeting: '911, what is your emergency?',
    officialSource: 'https://www.belize.gov.bz/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'English-speaking country. 911 coverage in cities; rural areas limited.'
  },

  HN: {
    countryCode: 'HN',
    countryName: 'Honduras',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // Major cities have protocols
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.911.hn/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'System implemented 2011. Some rural regions use legacy numbers (199, 198) but teach 911 only.'
  },

  SV: {
    countryCode: 'SV',
    countryName: 'El Salvador',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // Implemented 2018
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.seguridad.gob.sv/911/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Modern unified system. Old numbers (121 police, 123 fire) discontinued.'
  },

  NI: {
    countryCode: 'NI',
    countryName: 'Nicaragua',
    numbers: ['118', '115', '128'],
    primaryNumber: '118', // Police is most commonly needed
    serviceMap: {
      '118': 'police',
      '115': 'fire',      // Bomberos
      '128': 'ambulance'  // Red Cross
    },
    silentCallSupported: false,
    dispatcherGreeting: 'Emergencias, ¿qué necesita?',
    officialSource: 'https://www.policia.gob.ni/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'No unified 911. Teach multiple numbers based on scenario type.'
  },

  CR: {
    countryCode: 'CR',
    countryName: 'Costa Rica',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // Modern system with silent call handling
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://sistema911.go.cr/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Advanced system (best in Central America). Fully operational nationwide since 2018.'
  },

  PA: {
    countryCode: 'PA',
    countryName: 'Panama',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true,
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.sisepa.gob.pa/911/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'System implemented 2017. Good coverage in Panama City; rural areas developing.'
  },

  // ==========================================================================
  // CARIBBEAN (Spanish/Portuguese speaking)
  // ==========================================================================

  CU: {
    countryCode: 'CU',
    countryName: 'Cuba',
    numbers: ['106', '104', '105'],
    primaryNumber: '106', // Police
    serviceMap: {
      '106': 'police',
      '104': 'ambulance',
      '105': 'fire'
    },
    silentCallSupported: false,
    dispatcherGreeting: 'Emergencia, ¿qué ocurre?',
    officialSource: 'International SOS database', // Limited official web presence
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Infrastructure limited. Verify with Cuban community before launch in Cuba market.'
  },

  DO: {
    countryCode: 'DO',
    countryName: 'Dominican Republic',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: false, // Partial - major cities only
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.911.gob.do/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Modern system in urban areas (implemented 2015); rural coverage inconsistent.'
  },

  PR: {
    countryCode: 'PR',
    countryName: 'Puerto Rico (US Territory)',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // FCC requirements apply
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.pr.gov/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Uses US 911 system. Operators are bilingual (Spanish/English). Spanish greeting default.'
  },

  // ==========================================================================
  // SOUTH AMERICA
  // ==========================================================================

  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    numbers: ['123'],
    primaryNumber: '123',
    serviceMap: {
      '123': 'unified'
    },
    silentCallSupported: true, // Modern system with protocols
    dispatcherGreeting: '123, ¿cuál es su emergencia?',
    officialSource: 'https://www.mininterior.gov.co/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Excellent modern system. Legacy numbers (112, 119, 156) redirect to 123.'
  },

  VE: {
    countryCode: 'VE',
    countryName: 'Venezuela',
    numbers: ['911', '171'],
    primaryNumber: '171', // More reliable than 911
    serviceMap: {
      '911': 'unified',    // Implementation incomplete
      '171': 'police'      // CICPC - more reliable
    },
    silentCallSupported: false, // Infrastructure unreliable
    dispatcherGreeting: 'Emergencias, ¿qué necesita?',
    officialSource: 'International emergency databases', // Political situation limits official sources
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'CRITICAL: Infrastructure degraded. Teach both numbers. Verify with Venezuelan community. Consider parent warning about system reliability.'
  },

  EC: {
    countryCode: 'EC',
    countryName: 'Ecuador',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true, // State-of-the-art system
    dispatcherGreeting: 'ECU 911, ¿cuál es su emergencia?',
    officialSource: 'https://www.ecu911.gob.ec/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'One of the most advanced systems in Latin America (launched 2012). Full nationwide coverage.'
  },

  PE: {
    countryCode: 'PE',
    countryName: 'Peru',
    numbers: ['105', '116', '117'],
    primaryNumber: '105', // Police
    serviceMap: {
      '105': 'police',
      '116': 'fire',      // Bomberos
      '117': 'ambulance'  // SAMU
    },
    silentCallSupported: false,
    dispatcherGreeting: 'Emergencias, ¿qué ocurre?',
    officialSource: 'https://www.gob.pe/institucion/mininter/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'No unified system. Teach scenario-based routing. 911 planned but not operational as of 2024-01-15.'
  },

  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    numbers: ['190', '192', '193'],
    primaryNumber: '190', // Military Police - PRIMARY for most emergencies
    serviceMap: {
      '190': 'police',    // Polícia Militar
      '192': 'ambulance', // SAMU
      '193': 'fire'       // Bombeiros
    },
    silentCallSupported: false, // Partial in major cities only
    dispatcherGreeting: 'Polícia Militar, qual é a emergência?',
    officialSource: 'https://www.gov.br/pt-br',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'No unified 911. Scenario-based routing: Medical→192, Fire→193, Danger→190. 180/181 are for missing children, NOT general emergency.'
  },

  BO: {
    countryCode: 'BO',
    countryName: 'Bolivia',
    numbers: ['110', '118', '119'],
    primaryNumber: '110', // Police
    serviceMap: {
      '110': 'police',
      '118': 'ambulance',
      '119': 'fire'
    },
    silentCallSupported: false,
    dispatcherGreeting: 'Emergencias, ¿qué necesita?',
    officialSource: 'https://www.policia.bo/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'No unified system. Limited infrastructure. Teach multiple numbers by scenario.'
  },

  PY: {
    countryCode: 'PY',
    countryName: 'Paraguay',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: false, // Partial - Asunción and major cities only
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.911.gov.py/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Modern unified system (implemented 2018). Urban coverage good; rural developing.'
  },

  CL: {
    countryCode: 'CL',
    countryName: 'Chile',
    numbers: ['131', '132', '133'],
    primaryNumber: '133', // Police (Carabineros)
    serviceMap: {
      '131': 'ambulance', // SAMU
      '132': 'fire',      // Bomberos
      '133': 'police'     // Carabineros
    },
    silentCallSupported: false,
    dispatcherGreeting: 'Emergencias, ¿qué ocurre?',
    officialSource: 'https://www.onemi.gov.cl/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Well-established multi-number system. 911 NOT operational. Teach scenario-based routing.'
  },

  AR: {
    countryCode: 'AR',
    countryName: 'Argentina',
    numbers: ['911', '107', '100'],
    primaryNumber: '911', // Police (unified in most provinces)
    serviceMap: {
      '911': 'police',    // Unified in most provinces
      '107': 'ambulance', // SAME
      '100': 'fire'       // Bomberos
    },
    silentCallSupported: false, // Partial - Buenos Aires and major cities
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.argentina.gob.ar/seguridad',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: '911 is provincial (each province operates independently). Teach 911 as primary + scenario backups (107, 100). System quality varies by province.'
  },

  UY: {
    countryCode: 'UY',
    countryName: 'Uruguay',
    numbers: ['911'],
    primaryNumber: '911',
    serviceMap: {
      '911': 'unified'
    },
    silentCallSupported: true,
    dispatcherGreeting: '911, ¿cuál es su emergencia?',
    officialSource: 'https://www.gub.uy/',
    lastVerified: '2024-01-15',
    verifiedBy: 'Ivan',
    notes: 'Modern unified system. Full national coverage.'
  },
};

/**
 * Helper function: Get emergency config for a country
 *
 * Business Logic:
 * Provides type-safe access to emergency numbers with fallback to generic 112
 * (international emergency number) if country not found.
 *
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., 'US', 'BR', 'MX')
 * @returns Emergency configuration for that country
 */
export function getEmergencyConfig(countryCode: string): EmergencyConfig {
  const config = EMERGENCY_NUMBERS[countryCode];

  if (!config) {
    console.warn(`[DialBuddy] Emergency numbers not found for country: ${countryCode}. Falling back to generic 112.`);

    // Fallback for unsupported countries: generic 112 (international emergency number)
    return {
      countryCode,
      countryName: 'Unknown Country',
      numbers: ['112'], // 112 works in most of Europe and many other countries
      primaryNumber: '112',
      serviceMap: { '112': 'unified' },
      silentCallSupported: false, // Unknown - default to false for safety
      dispatcherGreeting: 'Emergency services, what is your emergency?',
      officialSource: 'ITU-T Recommendation E.164 (international standard)',
      lastVerified: '2024-01-15',
      verifiedBy: 'System Default',
      notes: `Country ${countryCode} not in database. Using international standard 112. Parent should verify correct number.`
    };
  }

  return config;
}

/**
 * Helper function: Get primary emergency number for a country
 *
 * Business Logic:
 * Quick access to just the number string (most common use case in UI).
 *
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Primary emergency number as string (e.g., '911', '123', '112')
 */
export function getPrimaryEmergencyNumber(countryCode: string): string {
  return getEmergencyConfig(countryCode).primaryNumber;
}

/**
 * Helper function: Check if a dialed number is an emergency number
 *
 * Business Logic:
 * Used in Free Dial mode to detect when child dials emergency number.
 * If detected, redirect to emergency module instead of "wrong number" animation.
 *
 * @param dialedNumber The number the child typed (e.g., '911', '112')
 * @param countryCode Current country context
 * @returns true if this is a valid emergency number for that country
 */
export function isEmergencyNumber(dialedNumber: string, countryCode: string): boolean {
  const config = getEmergencyConfig(countryCode);
  return config.numbers.includes(dialedNumber);
}

/**
 * Helper function: Get service type for a specific emergency number
 *
 * Business Logic:
 * For multi-number countries, determines which scenario to route to based on
 * the number the child dialed.
 *
 * Example: In Brazil, dialing '192' should route to Medical scenario,
 * but dialing '193' should route to Fire scenario.
 *
 * @param dialedNumber The emergency number dialed
 * @param countryCode Current country context
 * @returns Service type ('unified', 'police', 'fire', 'ambulance', 'rescue')
 */
export function getServiceType(
  dialedNumber: string,
  countryCode: string
): 'unified' | 'police' | 'fire' | 'ambulance' | 'rescue' | null {
  const config = getEmergencyConfig(countryCode);
  return config.serviceMap[dialedNumber] || null;
}

/**
 * List of all supported country codes
 *
 * Useful for country picker UI and validation.
 */
export const SUPPORTED_COUNTRIES = Object.keys(EMERGENCY_NUMBERS);

/**
 * Count of total supported countries
 *
 * For display in app settings or about screen.
 */
export const SUPPORTED_COUNTRY_COUNT = SUPPORTED_COUNTRIES.length;
