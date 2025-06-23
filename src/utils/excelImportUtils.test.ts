import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseExcelDate, 
  parseNumericValue, 
  parseDate,
  importExcelFile,
  ImportOptions
} from './excelImportUtils';

// Mock de supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis()
  }
}));

// Mock de XLSX
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
    parse_date_code: vi.fn((value) => {
      // Simuler la conversion d'une date Excel
      // Pour simplifier, on considère que la valeur 44000 correspond au 01/01/2020
      const baseDate = new Date(2020, 0, 1);
      const dayOffset = value - 44000;
      const resultDate = new Date(baseDate);
      resultDate.setDate(baseDate.getDate() + dayOffset);
      
      return {
        y: resultDate.getFullYear(),
        m: resultDate.getMonth() + 1,
        d: resultDate.getDate()
      };
    })
  },
  SSF: {
    parse_date_code: vi.fn((value) => {
      // Simuler la conversion d'une date Excel
      // Pour simplifier, on considère que la valeur 44000 correspond au 01/01/2020
      const baseDate = new Date(2020, 0, 1);
      const dayOffset = value - 44000;
      const resultDate = new Date(baseDate);
      resultDate.setDate(baseDate.getDate() + dayOffset);
      
      return {
        y: resultDate.getFullYear(),
        m: resultDate.getMonth() + 1,
        d: resultDate.getDate()
      };
    })
  }
}));

describe('parseExcelDate', () => {
  it('devrait convertir une date Excel en format YYYY-MM-DD', () => {
    // 44000 représente le 01/01/2020 dans notre mock
    expect(parseExcelDate(44000)).toBe('2020-01-01');
    // 44031 représente le 01/02/2020 dans notre mock
    expect(parseExcelDate(44031)).toBe('2020-02-01');
  });

  it('devrait retourner null pour des valeurs non numériques', () => {
    expect(parseExcelDate('not a number')).toBeNull();
    expect(parseExcelDate(null)).toBeNull();
    expect(parseExcelDate(undefined)).toBeNull();
  });
});

describe('parseNumericValue', () => {
  it('devrait convertir correctement les valeurs numériques', () => {
    expect(parseNumericValue(123.45)).toBe(123.45);
    expect(parseNumericValue('123.45')).toBe(123.45);
    expect(parseNumericValue('123,45')).toBe(123.45);
  });

  it('devrait gérer les grands nombres entiers qui devraient avoir 2 décimales', () => {
    expect(parseNumericValue(12345)).toBe(123.45);
    expect(parseNumericValue(-12345)).toBe(-123.45);
  });

  it('devrait retourner null pour des valeurs vides ou invalides', () => {
    expect(parseNumericValue('')).toBeNull();
    expect(parseNumericValue(null)).toBeNull();
    expect(parseNumericValue(undefined)).toBeNull();
    expect(parseNumericValue('abc')).toBeNull();
  });
});

describe('parseDate', () => {
  it('devrait parser correctement les dates au format JJ/MM/AAAA', () => {
    expect(parseDate('01/01/2023')).toBe('2023-01-01');
    expect(parseDate('31/12/2023')).toBe('2023-12-31');
  });

  it('devrait parser correctement les dates au format JJ/MM/AA', () => {
    expect(parseDate('01/01/23')).toBe('2023-01-01');
    expect(parseDate('31/12/99')).toBe('1999-12-31');
  });

  it('devrait parser correctement les dates au format AAAA-MM-JJ', () => {
    expect(parseDate('2023-01-01')).toBe('2023-01-01');
    expect(parseDate('2023-12-31')).toBe('2023-12-31');
  });

  it('devrait parser correctement les dates au format JJ-MM-AAAA', () => {
    expect(parseDate('01-01-2023')).toBe('2023-01-01');
    expect(parseDate('31-12-2023')).toBe('2023-12-31');
  });

  it('devrait retourner null pour des formats de date invalides', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('invalid date')).toBeNull();
  });
});

// Tests pour importExcelFile
describe('importExcelFile', () => {
  // Créer un mock de File
  let mockFile: File;
  let mockFileReader: any;
  
  beforeEach(() => {
    // Créer un mock de File
    mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Mock de FileReader
    mockFileReader = {
      readAsBinaryString: vi.fn(),
      onload: null,
      onerror: null,
      result: JSON.stringify([
        { data_lancamento: 44000, descricao: 'Test 1', valor: 100.50 },
        { data_lancamento: 44031, descricao: 'Test 2', valor: -50.25 }
      ])
    };
    
    // Remplacer le constructeur global FileReader
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Mock de crypto.randomUUID
    global.crypto = {
      ...global.crypto,
      randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000')
    };
  });

  it('devrait retourner une erreur si le format d\'import n\'est pas trouvé', async () => {
    // Mock de getImportFormat pour retourner null
    vi.mock('./excelImportUtils', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        getImportFormat: vi.fn().mockResolvedValue(null)
      };
    });
    
    const options: ImportOptions = {
      formatId: 1,
      contratClientId: 'test-contract-id',
      requiredColumns: ['data_lancamento', 'descricao', 'valor']
    };
    
    // Appeler la fonction avec un mock de File
    const result = await importExcelFile(mockFile, options);
    
    // Vérifier que le résultat contient une erreur
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Format d\'import non trouvé');
  });

  // Autres tests pour importExcelFile...
});