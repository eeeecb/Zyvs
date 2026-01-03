import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { ImportRow } from './import.types';

export class ImportParser {
  /**
   * Parse arquivo (CSV ou Excel) para array de objetos
   */
  async parse(file: any, columnMapping: Record<string, string> = {}): Promise<ImportRow[]> {
    const buffer = await file.toBuffer();
    const mimetype = file.mimetype;

    if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
      return this.parseCSV(buffer, columnMapping);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return this.parseExcel(buffer, columnMapping);
    } else {
      throw new Error('Formato de arquivo não suportado');
    }
  }

  /**
   * Parse CSV
   */
  private async parseCSV(buffer: Buffer, columnMapping: Record<string, string>): Promise<ImportRow[]> {
    return new Promise((resolve, reject) => {
      const rows: ImportRow[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csv())
        .on('data', (row) => {
          const mappedRow = this.applyColumnMapping(row, columnMapping);
          rows.push(mappedRow);
        })
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Parse Excel
   */
  private parseExcel(buffer: Buffer, columnMapping: Record<string, string>): ImportRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const data = XLSX.utils.sheet_to_json<ImportRow>(sheet);

    // Aplicar mapeamento de colunas
    return data.map((row) => this.applyColumnMapping(row, columnMapping));
  }

  /**
   * Aplicar mapeamento de colunas
   * Exemplo: { "Nome Completo": "name", "E-mail": "email" }
   */
  private applyColumnMapping(row: ImportRow, mapping: Record<string, string>): ImportRow {
    if (Object.keys(mapping).length === 0) {
      return row; // Sem mapeamento, retorna como está
    }

    const mappedRow: ImportRow = {};

    for (const [fileColumn, systemField] of Object.entries(mapping)) {
      if (row[fileColumn] !== undefined) {
        mappedRow[systemField] = row[fileColumn];
      }
    }

    return mappedRow;
  }

  /**
   * Extrair colunas do arquivo para preview
   */
  async extractColumns(file: any): Promise<string[]> {
    const buffer = await file.toBuffer();
    const mimetype = file.mimetype;

    if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
      return this.extractCSVColumns(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return this.extractExcelColumns(buffer);
    }

    return [];
  }

  private async extractCSVColumns(buffer: Buffer): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const stream = Readable.from(buffer);
      let columns: string[] = [];

      stream
        .pipe(csv())
        .on('headers', (headers) => {
          columns = headers;
          stream.destroy(); // Parar após ler headers
        })
        .on('end', () => resolve(columns))
        .on('error', (error) => reject(error));
    });
  }

  private extractExcelColumns(buffer: Buffer): string[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ImportRow>(sheet, { header: 1 });

    if (data.length > 0) {
      return Object.values(data[0] as any);
    }

    return [];
  }
}
