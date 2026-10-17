import * as XLSX from 'xlsx';
import { DataRow } from '../types';

export const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.csv'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function validateFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return `Unsupported file type. Please upload one of: ${ACCEPTED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. The maximum supported size is 50 MB.';
  }
  return null;
}

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array', cellDates: true });
}

export function parseSheet(workbook: XLSX.WorkBook, sheetName: string): { rows: DataRow[]; headers: string[] } {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error(`Sheet "${sheetName}" was not found in the workbook.`);
  const rows = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: null, raw: true });
  if (rows.length === 0) throw new Error(`Sheet "${sheetName}" does not contain any data rows.`);
  return { rows, headers: Object.keys(rows[0]) };
}
