/**
 * Brazilian Phone Validation and Formatting Utilities
 * Standard for Brazilian telecommunications (ANATEL)
 */

export interface DddInfo {
  state: string;
  region: string;
}

export const BRAZILIAN_DDDS: Record<string, DddInfo> = {
  // São Paulo
  '11': { state: 'SP', region: 'São Paulo / Região Metropolitana' },
  '12': { state: 'SP', region: 'Vale do Paraíba / Litoral Norte' },
  '13': { state: 'SP', region: 'Baixada Santista / Litoral Sul' },
  '14': { state: 'SP', region: 'Bauru / Jaú / Marília' },
  '15': { state: 'SP', region: 'Sorocaba / Itapeva' },
  '16': { state: 'SP', region: 'Ribeirão Preto / Franca' },
  '17': { state: 'SP', region: 'São José do Rio Preto / Barretos' },
  '18': { state: 'SP', region: 'Presidente Prudente / Araçatuba' },
  '19': { state: 'SP', region: 'Campinas / Piracicaba / Americana' },

  // Rio de Janeiro & Espírito Santo
  '21': { state: 'RJ', region: 'Rio de Janeiro / Região Metropolitana' },
  '22': { state: 'RJ', region: 'Campos dos Goytacazes / Região dos Lagos' },
  '24': { state: 'RJ', region: 'Petrópolis / Volta Redonda / Angra dos Reis' },
  '27': { state: 'ES', region: 'Vitória / Região Metropolitana' },
  '28': { state: 'ES', region: 'Cachoeiro de Itapemirim / Sul do ES' },

  // Minas Gerais
  '31': { state: 'MG', region: 'Belo Horizonte / Região Metropolitana' },
  '32': { state: 'MG', region: 'Juiz de Fora / Barbacena' },
  '33': { state: 'MG', region: 'Governador Valadares / Teófilo Otoni' },
  '34': { state: 'MG', region: 'Uberlândia / Uberaba / Triângulo Mineiro' },
  '35': { state: 'MG', region: 'Poços de Caldas / Pouso Alegre / Varginha' },
  '37': { state: 'MG', region: 'Divinópolis / Itaúna' },
  '38': { state: 'MG', region: 'Montes Claros / Norte de MG' },

  // Paraná & Santa Catarina
  '41': { state: 'PR', region: 'Curitiba / Região Metropolitana' },
  '42': { state: 'PR', region: 'Ponta Grossa / Guarapuava' },
  '43': { state: 'PR', region: 'Londrina / Apucarana' },
  '44': { state: 'PR', region: 'Maringá / Campo Mourão' },
  '45': { state: 'PR', region: 'Cascavel / Foz do Iguaçu' },
  '46': { state: 'PR', region: 'Francisco Beltrão / Pato Branco' },
  '47': { state: 'SC', region: 'Joinville / Blumenau / Balneário Camboriú' },
  '48': { state: 'SC', region: 'Florianópolis / Criciúma / Tubarão' },
  '49': { state: 'SC', region: 'Chapecó / Lages / Concórdia' },

  // Rio Grande do Sul
  '51': { state: 'RS', region: 'Porto Alegre / Região Metropolitana' },
  '53': { state: 'RS', region: 'Pelotas / Rio Grande / Bagé' },
  '54': { state: 'RS', region: 'Caxias do Sul / Bento Gonçalves / Passo Fundo' },
  '55': { state: 'RS', region: 'Santa Maria / Uruguaiana' },

  // Centro-Oeste & Norte
  '61': { state: 'DF', region: 'Brasília / Entorno do DF' },
  '62': { state: 'GO', region: 'Goiânia / Anápolis' },
  '63': { state: 'TO', region: 'Palmas / Araguaína / Todo o Tocantins' },
  '64': { state: 'GO', region: 'Rio Verde / Caldas Novas / Catalão' },
  '65': { state: 'MT', region: 'Cuiabá / Várzea Grande' },
  '66': { state: 'MT', region: 'Rondonópolis / Sinop / Sorriso' },
  '67': { state: 'MS', region: 'Campo Grande / Dourados / Todo o MS' },
  '68': { state: 'AC', region: 'Rio Branco / Cruzeiro do Sul / Todo o Acre' },
  '69': { state: 'RO', region: 'Porto Velho / Ji-Paraná / Toda Rondônia' },

  // Nordeste
  '71': { state: 'BA', region: 'Salvador / Região Metropolitana' },
  '73': { state: 'BA', region: 'Ilhéus / Itabuna / Porto Seguro' },
  '74': { state: 'BA', region: 'Juazeiro / Jacobina / Senhor do Bonfim' },
  '75': { state: 'BA', region: 'Feira de Santana / Alagoinhas' },
  '77': { state: 'BA', region: 'Vitória da Conquista / Barreiras' },
  '79': { state: 'SE', region: 'Aracaju / Lagarto / Todo o Sergipe' },
  '81': { state: 'PE', region: 'Recife / Olinda / Jaboatão dos Guararapes' },
  '82': { state: 'AL', region: 'Maceió / Arapiraca / Todo o Alagoas' },
  '83': { state: 'PB', region: 'João Pessoa / Campina Grande / Toda a Paraíba' },
  '84': { state: 'RN', region: 'Natal / Mossoró / Todo o Rio Grande do Norte' },
  '85': { state: 'CE', region: 'Fortaleza / Região Metropolitana' },
  '86': { state: 'PI', region: 'Teresina / Parnaíba / Norte do Piauí' },
  '87': { state: 'PE', region: 'Petrolina / Garanhuns / Sertão de PE' },
  '88': { state: 'CE', region: 'Juazeiro do Norte / Sobral / Cariri' },
  '89': { state: 'PI', region: 'Picos / Floriano / Sul do Piauí' },

  // Norte & Maranhão
  '91': { state: 'PA', region: 'Belém / Ananindeua / Região Metropolitana' },
  '92': { state: 'AM', region: 'Manaus / Região Metropolitana' },
  '93': { state: 'PA', region: 'Santarém / Altamira / Oeste do Pará' },
  '94': { state: 'PA', region: 'Marabá / Parauapebas / Sul do Pará' },
  '95': { state: 'RR', region: 'Boa Vista / Rorainópolis / Toda Roraima' },
  '96': { state: 'AP', region: 'Macapá / Santana / Todo o Amapá' },
  '97': { state: 'AM', region: 'Interior do Estado do Amazonas' },
  '98': { state: 'MA', region: 'São Luís / Região Metropolitana' },
  '99': { state: 'MA', region: 'Imperatriz / Caxias / Sul do Maranhão' },
};

export interface PhoneValidationResult {
  isValid: boolean;
  digits: string;
  formatted: string;
  type: 'celular' | 'fixo' | 'incompleto' | 'invalido';
  ddd?: string;
  info?: DddInfo;
  errorMessage?: string;
}

/**
 * Clean phone input, stripping country code +55 if present
 */
export function extractPhoneDigits(input: string): string {
  let cleaned = input.replace(/\D/g, '');
  // Remove country code 55 if prefixed and length exceeds 11 digits
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    cleaned = cleaned.slice(2);
  }
  return cleaned.slice(0, 11);
}

/**
 * Format phone progressively as user types
 */
export function formatBrazilianPhone(input: string): string {
  const digits = extractPhoneDigits(input);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Strict Brazilian phone validator
 */
export function validateBrazilianPhone(input: string): PhoneValidationResult {
  const digits = extractPhoneDigits(input);
  const formatted = formatBrazilianPhone(digits);

  if (!digits || digits.length === 0) {
    return {
      isValid: false,
      digits: '',
      formatted: '',
      type: 'incompleto',
      errorMessage: 'Por favor, digite o telefone com DDD.'
    };
  }

  // Check DDD presence
  if (digits.length < 2) {
    return {
      isValid: false,
      digits,
      formatted,
      type: 'incompleto',
      errorMessage: 'Digite o DDD (ex: 11).'
    };
  }

  const ddd = digits.slice(0, 2);
  const dddInfo = BRAZILIAN_DDDS[ddd];

  if (!dddInfo) {
    return {
      isValid: false,
      digits,
      formatted,
      ddd,
      type: 'invalido',
      errorMessage: `DDD (${ddd}) é inválido. Informe um DDD brasileiro válido (ex: 11, 21, 31, 41, 71, etc.).`
    };
  }

  // Incomplete number check
  if (digits.length < 10) {
    return {
      isValid: false,
      digits,
      formatted,
      ddd,
      info: dddInfo,
      type: 'incompleto',
      errorMessage: `Número incompleto. Faltam ${11 - digits.length} dígitos (DDD ${ddd} - ${dddInfo.state}).`
    };
  }

  // Check for dummy/fake repeated numbers like (11) 99999-9999, (11) 11111-1111, (11) 00000-0000
  const localDigits = digits.slice(2);
  const isAllSameDigit = /^(\d)\1+$/.test(localDigits);
  if (isAllSameDigit) {
    return {
      isValid: false,
      digits,
      formatted,
      ddd,
      info: dddInfo,
      type: 'invalido',
      errorMessage: 'Número inválido com todos os dígitos iguais. Informe um número real.'
    };
  }

  // Check sequences like 12345678 or 98765432
  if (localDigits === '123456789' || localDigits === '987654321' || localDigits === '12345678') {
    return {
      isValid: false,
      digits,
      formatted,
      ddd,
      info: dddInfo,
      type: 'invalido',
      errorMessage: 'Número sequencial inválido. Informe o número real do seu WhatsApp.'
    };
  }

  // 11 digits: Mobile (Celular)
  if (digits.length === 11) {
    const ninthDigit = digits[2];
    if (ninthDigit !== '9') {
      return {
        isValid: false,
        digits,
        formatted,
        ddd,
        info: dddInfo,
        type: 'invalido',
        errorMessage: `Celular com DDD ${ddd} deve começar com o dígito 9 após o DDD (ex: (${ddd}) 9XXXX-XXXX).`
      };
    }

    return {
      isValid: true,
      digits,
      formatted,
      ddd,
      info: dddInfo,
      type: 'celular'
    };
  }

  // 10 digits: Landline (Fixo)
  if (digits.length === 10) {
    const firstLocalDigit = digits[2];
    // Landline numbers in Brazil start with 2, 3, 4, 5
    if (firstLocalDigit === '9') {
      return {
        isValid: false,
        digits,
        formatted,
        ddd,
        info: dddInfo,
        type: 'incompleto',
        errorMessage: `Parece um celular com DDD ${ddd}. Faltou o último dígito (deve ter 9 dígitos após o DDD).`
      };
    }

    if (!['2', '3', '4', '5'].includes(firstLocalDigit)) {
      return {
        isValid: false,
        digits,
        formatted,
        ddd,
        info: dddInfo,
        type: 'invalido',
        errorMessage: `Telefone fixo com DDD ${ddd} deve iniciar com 2, 3, 4 ou 5 (ou use seu celular com 9 dígitos).`
      };
    }

    return {
      isValid: true,
      digits,
      formatted,
      ddd,
      info: dddInfo,
      type: 'fixo'
    };
  }

  return {
    isValid: false,
    digits,
    formatted,
    type: 'invalido',
    errorMessage: 'Número de telefone inválido.'
  };
}
