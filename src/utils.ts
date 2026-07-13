import { Cliente, Veiculo, Produto, Servico, OrdemServico, Orçamento, VendaProduto, Recibo, NotaFiscal, Configuracoes } from './types';
import { initialClientes, initialVeiculos, initialProdutos, initialServicos, initialOrdensServico, initialOrcamentos, initialVendas, initialRecibos, initialNotasFiscais, defaultConfiguracoes } from './initialData';

// Format currency to BRL
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Phone formatting mask (11) 98765-4321 or (11) 3344-5566
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

// Document mask (CPF or CNPJ)
export function formatDocument(doc: string): string {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  } else if (clean.length === 14) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  }
  return doc;
}

// CEP formatting
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return cep;
}

// CPF validation (real digits verification)
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false; // Reject equal digits (e.g. 111.111.111-11)

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10))) return false;

  return true;
}

// CNPJ validation (real digits verification)
export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false; // Reject equal digits

  let length = 12;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = 13;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export interface CEPAddress {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// Simulated CEP Address Autofill mapping
export function getAddressByCEP(cep: string): CEPAddress | null {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  
  const prefix = parseInt(clean.slice(0, 2));
  
  if (prefix >= 1 && prefix <= 9) {
    return {
      rua: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP'
    };
  } else if (prefix >= 11 && prefix <= 19) {
    return {
      rua: 'Rua das Flores',
      bairro: 'Jardim Amália',
      cidade: 'Campinas',
      uf: 'SP'
    };
  } else if (prefix >= 20 && prefix <= 28) {
    return {
      rua: 'Avenida Atlântica',
      bairro: 'Copacabana',
      cidade: 'Rio de Janeiro',
      uf: 'RJ'
    };
  } else if (prefix >= 30 && prefix <= 39) {
    return {
      rua: 'Rua da Bahia',
      bairro: 'Centro',
      cidade: 'Belo Horizonte',
      uf: 'MG'
    };
  } else if (prefix >= 40 && prefix <= 48) {
    return {
      rua: 'Avenida Sete de Setembro',
      bairro: 'Barra',
      cidade: 'Salvador',
      uf: 'BA'
    };
  } else if (prefix >= 80 && prefix <= 87) {
    return {
      rua: 'Rua XV de Novembro',
      bairro: 'Centro',
      cidade: 'Curitiba',
      uf: 'PR'
    };
  } else if (prefix >= 90 && prefix <= 99) {
    return {
      rua: 'Avenida Ipiranga',
      bairro: 'Praia de Belas',
      cidade: 'Porto Alegre',
      uf: 'RS'
    };
  }
  
  // Default realistic fallback
  return {
    rua: 'Rua Principal',
    bairro: 'Bairro Central',
    cidade: 'São Paulo',
    uf: 'SP'
  };
}

export interface ParsedClientData {
  nome?: string;
  documento?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  tipo?: 'PF' | 'PJ';
}

// Intelligent Text Separation and Extraction for unstructured text inputs
export function parseUnstructuredText(text: string): ParsedClientData {
  const result: ParsedClientData = {};
  if (!text) return result;

  // 1. Email Extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0].trim();
  }

  // 2. Document (CPF / CNPJ) Extraction
  // Look for CNPJ (14 digits, optional dots/dash/slash) or CPF (11 digits, optional dots/dash)
  const cnpjRegex = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;
  const cnpjMatch = text.match(cnpjRegex);
  const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
  const cpfMatch = text.match(cpfRegex);

  if (cnpjMatch) {
    result.documento = cnpjMatch[0].trim();
    result.tipo = 'PJ';
  } else if (cpfMatch) {
    result.documento = cpfMatch[0].trim();
    result.tipo = 'PF';
  }

  // 3. CEP Extraction
  const cepRegex = /\b\d{5}-\d{3}\b|\b\d{8}\b/;
  const cepMatch = text.match(cepRegex);
  if (cepMatch) {
    result.cep = cepMatch[0].trim();
  }

  // 4. Phone Extraction
  // Remove matched document numbers, cep, and email to avoid false positives for phone numbers
  let textWithoutDocs = text;
  if (cnpjMatch) textWithoutDocs = textWithoutDocs.replace(cnpjRegex, '');
  if (cpfMatch) textWithoutDocs = textWithoutDocs.replace(cpfRegex, '');
  if (cepMatch) textWithoutDocs = textWithoutDocs.replace(cepRegex, '');
  if (emailMatch) textWithoutDocs = textWithoutDocs.replace(emailRegex, '');

  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}\b/;
  const phoneMatch = textWithoutDocs.match(phoneRegex);
  if (phoneMatch) {
    result.telefone = phoneMatch[0].trim();
  }

  // 5. Name Extraction
  // Split on common dividers like commas, semi-colons, dashes, newlines, or tabs
  const parts = text.split(/[\n,;\t-]/).map(p => p.trim()).filter(p => p.length > 0);
  
  for (const part of parts) {
    const hasEmail = emailMatch && part.includes(emailMatch[0]);
    const hasCnpj = cnpjMatch && part.includes(cnpjMatch[0]);
    const hasCpf = cpfMatch && part.includes(cpfMatch[0]);
    const hasCep = cepMatch && part.includes(cepMatch[0]);
    const hasPhone = phoneMatch && part.includes(phoneMatch[0]);
    
    // Check if it's mostly digits
    const isNumeric = part.replace(/\D/g, '').length > part.replace(/[0-9]/g, '').length;
    
    if (!hasEmail && !hasCnpj && !hasCpf && !hasCep && !hasPhone && !isNumeric && part.length > 2) {
      result.nome = part;
      break;
    }
  }

  // Fallback for name: first part that is not an email and has no @
  if (!result.nome && parts.length > 0) {
    for (const part of parts) {
      if (!part.includes('@') && part.replace(/\D/g, '').length < 6 && part.length > 2) {
        result.nome = part;
        break;
      }
    }
  }

  if (!result.tipo) {
    result.tipo = 'PF';
  }

  return result;
}

// Local Storage Helper
export function getStoredState<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    console.error(`Error reading localStorage key "${key}":`, e);
  }
  return defaultValue;
}

export function setStoredState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing localStorage key "${key}":`, e);
  }
}

// Helpers to read/write specific state from/to LocalStorage
export const stateKeys = {
  CLIENTES: 'oficinapro_clientes',
  VEICULOS: 'oficinapro_veiculos',
  PRODUTOS: 'oficinapro_produtos',
  SERVICOS: 'oficinapro_servicos',
  OS: 'oficinapro_ordens_servico',
  ORCAMENTOS: 'oficinapro_orcamentos',
  VENDAS: 'oficinapro_vendas',
  RECIBOS: 'oficinapro_recibos',
  NOTAS_FISCAIS: 'oficinapro_notas_fiscais',
  CONFIGURACOES: 'oficinapro_configuracoes',
};

export function initializeAppState() {
  if (!localStorage.getItem(stateKeys.CLIENTES)) {
    localStorage.setItem(stateKeys.CLIENTES, JSON.stringify(initialClientes));
  }
  if (!localStorage.getItem(stateKeys.VEICULOS)) {
    localStorage.setItem(stateKeys.VEICULOS, JSON.stringify(initialVeiculos));
  }
  if (!localStorage.getItem(stateKeys.PRODUTOS)) {
    localStorage.setItem(stateKeys.PRODUTOS, JSON.stringify(initialProdutos));
  }
  if (!localStorage.getItem(stateKeys.SERVICOS)) {
    localStorage.setItem(stateKeys.SERVICOS, JSON.stringify(initialServicos));
  }
  if (!localStorage.getItem(stateKeys.OS)) {
    localStorage.setItem(stateKeys.OS, JSON.stringify(initialOrdensServico));
  }
  if (!localStorage.getItem(stateKeys.ORCAMENTOS)) {
    localStorage.setItem(stateKeys.ORCAMENTOS, JSON.stringify(initialOrcamentos));
  }
  if (!localStorage.getItem(stateKeys.VENDAS)) {
    localStorage.setItem(stateKeys.VENDAS, JSON.stringify(initialVendas));
  }
  if (!localStorage.getItem(stateKeys.RECIBOS)) {
    localStorage.setItem(stateKeys.RECIBOS, JSON.stringify(initialRecibos));
  }
  if (!localStorage.getItem(stateKeys.NOTAS_FISCAIS)) {
    localStorage.setItem(stateKeys.NOTAS_FISCAIS, JSON.stringify(initialNotasFiscais));
  }
  if (!localStorage.getItem(stateKeys.CONFIGURACOES)) {
    localStorage.setItem(stateKeys.CONFIGURACOES, JSON.stringify(defaultConfiguracoes));
  }
}

// Convert a number into its Portuguese spelled out representation (BRL currency)
export function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'Zero reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenasEspeciais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrozentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function converterGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';

    let resultado = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      resultado += centenas[c];
    }

    if (d > 0 || u > 0) {
      if (resultado !== '') resultado += ' e ';
      if (d === 1) {
        resultado += dezenasEspeciais[u];
      } else {
        if (d > 1) {
          resultado += dezenas[d];
          if (u > 0) resultado += ' e ' + unidades[u];
        } else if (u > 0) {
          resultado += unidades[u];
        }
      }
    }
    return resultado;
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let porExtenso = '';

  const milhoes = Math.floor(inteiro / 1000000);
  const milhares = Math.floor((inteiro % 1000000) / 1000);
  const unidadesRestantes = inteiro % 1000;

  if (milhoes > 0) {
    porExtenso += converterGrupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões');
  }

  if (milhares > 0) {
    if (porExtenso !== '') {
      porExtenso += (unidadesRestantes === 0 ? ' e ' : ', ');
    }
    if (milhares === 1) {
      porExtenso += 'mil';
    } else {
      porExtenso += converterGrupo(milhares) + ' mil';
    }
  }

  if (unidadesRestantes > 0) {
    if (porExtenso !== '') {
      porExtenso += (unidadesRestantes < 100 || unidadesRestantes % 100 === 0 ? ' e ' : ' ');
    }
    porExtenso += converterGrupo(unidadesRestantes);
  }

  if (inteiro > 0) {
    porExtenso += (inteiro === 1 ? ' real' : ' reais');
  }

  if (centavos > 0) {
    if (porExtenso !== '') porExtenso += ' e ';
    if (centavos === 1) {
      porExtenso += 'um centavo';
    } else {
      porExtenso += converterGrupo(centavos) + ' centavos';
    }
  }

  // Capitalize first letter of result
  return porExtenso.trim().charAt(0).toUpperCase() + porExtenso.trim().slice(1);
}
