import fs from 'fs';
import path from 'path';

type RecordType = { id: string; createdAt?: string; [k: string]: any };

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'fallback-store.json');

const DEFAULT_STORE: Record<string, RecordType[]> = {
  Customers: [],
  Suppliers: [],
  Products: [],
  Sales: [],
  Payroll: [],
  Staff: [],
  Inventory: [],
  Logs: [],
  Users: [],
  SupplierTransactions: [],
  Invitations: [],
  Expenses: []
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore(): Record<string, RecordType[]> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading fallback store:', err);
  }
  return { ...DEFAULT_STORE };
}

function saveStore(store: Record<string, RecordType[]>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback store:', err);
  }
}

let store = loadStore();

function now() { return new Date().toISOString(); }

export default {
  getAll(table: string) {
    // Reload from disk on every read to ensure latest data
    store = loadStore();
    const list = store[table] || [];
    return Promise.resolve(list.slice());
  },
  insert(table: string, data: Record<string, any>) {
    if (!store[table]) store[table] = [];
    const id = data.id || `${table.toLowerCase()}_${Date.now()}`;
    const rec = { ...data, id, createdAt: data.createdAt || now() };
    store[table].unshift(rec);
    saveStore(store);
    return Promise.resolve(rec);
  },
  clear(table?: string) {
    if (table) store[table] = [];
    else Object.keys(store).forEach(k => store[k] = []);
    saveStore(store);
  }
};
