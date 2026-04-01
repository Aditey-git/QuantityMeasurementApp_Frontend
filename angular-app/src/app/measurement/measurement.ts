import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface MeasurementResponse {
  isSuccess: boolean;
  isComparison: boolean;
  areEqual: boolean;
  calculatedValue: number;
  formattedMessage: string;
  errorMessage: string;
}

interface HistoryRecord {
  id: number;
  operand1Value: number;
  operand1Unit: string;
  operand2Value: number | null;
  operand2Unit: string | null;
  measurementCategory: string;
  operationType: string;
  resultValue: number | null;
  resultUnit: string | null;
  errorMessage: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-measurement',
  imports: [FormsModule, CommonModule],
  templateUrl: './measurement.html',
  styleUrl: './measurement.css'
})
export class Measurement implements OnInit {
  private baseUrl = 'http://localhost:5125';

  // ── Calculator ──
  units: Record<string, string[]> = {
    Length: ['Feet', 'Inch', 'Yard', 'Centimeters'],
    Weight: ['Kilogram', 'Gram', 'Pound'],
    Volume: ['Litre', 'Millilitre', 'Gallon'],
    Temperature: ['Celsius', 'Fahrenheit', 'Kelvin']
  };
  iconMap: Record<string, string> = {
    Length: '📏', Weight: '⚖️', Volume: '🧴', Temperature: '🌡️'
  };
  operationMap: Record<string, number> = {
    Compare: 1, Add: 2, Subtract: 3, Divide: 4
  };

  categories = Object.keys(this.units);
  currentCategory = 'Length';
  availableUnits: string[] = [];
  availableOperations: string[] = [];
  operation = 'Compare';
  unit1 = ''; unit2 = ''; targetUnit = '';
  value1: number | null = null;
  value2: number | null = null;
  operatorIcon = '⚖️';
  resultMessage = 'Pick a category, operation and values to run.';
  resultState: 'idle' | 'success' | 'error' = 'idle';
  isExecuting = false;

  // ── Tabs / History ──
  activeTab: 'calculator' | 'history' = 'calculator';
  historyRecords: HistoryRecord[] = [];
  historyCount = 0;
  isHistoryLoading = false;
  historyError = '';
  filterOperation = 'all';
  filterCategory = 'all';
  userEmail = '';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setCategory('Length');
    this.userEmail = localStorage.getItem('userEmail') || '';
  }

  // ── Auth headers ──
  private authHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  // ── Calculator methods ──
  setCategory(cat: string) {
    this.currentCategory = cat;
    this.availableUnits = this.units[cat] || [];
    this.unit1 = this.availableUnits[0];
    this.unit2 = this.availableUnits[0];
    this.targetUnit = this.availableUnits[0];
    this.availableOperations = cat === 'Temperature' ? ['Compare'] : ['Compare', 'Add', 'Subtract', 'Divide'];
    if (cat === 'Temperature') this.operation = 'Compare';
    this.updateOperatorIcon();
    this.resultMessage = `Category: ${cat}. Pick operation and values.`;
    this.resultState = 'idle';
  }

  updateOperatorIcon() {
    const m: Record<string, string> = { Compare: '⚖️', Add: '➕', Subtract: '➖', Divide: '➗' };
    this.operatorIcon = m[this.operation] || '🧮';
  }

  execute() {
    if (this.value1 === null || this.value1 === undefined) {
      this.resultMessage = 'Please enter a value for Value 1.';
      this.resultState = 'error';
      return;
    }
    this.isExecuting = true;
    this.resultState = 'idle';

    const body = {
      MeasurementCategory: this.currentCategory,
      OperationType: this.operationMap[this.operation],
      MeasurementUnit1: this.unit1,
      MeasurementValue1: Number(this.value1),
      MeasurementUnit2: this.unit2,
      MeasurementValue2: Number(this.value2 ?? 0),
      TargetMeasurementUnit: this.targetUnit
    };

    const url = `${this.baseUrl}/api/quantities/${this.operation.toLowerCase()}`;
    this.http.post<MeasurementResponse>(url, body, { headers: this.authHeaders() }).subscribe({
      next: (data) => {
        this.isExecuting = false;
        if (!data.isSuccess) {
          this.resultMessage = `Error: ${data.errorMessage || 'Unknown error'}`;
          this.resultState = 'error';
          this.cdr.detectChanges();
          return;
        }
        if (data.isComparison) {
          this.resultMessage = data.areEqual
            ? `✅ ${this.value1} ${this.unit1} equals ${this.value2} ${this.unit2}`
            : `❎ ${this.value1} ${this.unit1} does NOT equal ${this.value2} ${this.unit2}`;
        } else {
          const val = Number.isFinite(data.calculatedValue)
            ? Number(data.calculatedValue.toFixed(6)).toString() : 'NaN';
          this.resultMessage = `${this.value1} ${this.unit1} ${this.operatorIcon} ${this.value2} ${this.unit2} = ${val} ${this.targetUnit}`;
        }
        this.resultState = 'success';
        this.cdr.detectChanges();
        if (this.historyCount >= 0) this.loadCount();
      },
      error: (err) => {
        this.isExecuting = false;
        this.resultState = 'error';
        if (err.status === 401 || err.status === 403) {
          this.resultMessage = 'Session expired. Please login again.';
          this.cdr.detectChanges();
          this.router.navigate(['/login']);
        } else {
          this.resultMessage = 'Cannot reach the server. Ensure the API is running.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  // ── History / GET methods ──
  switchToHistory() {
    this.activeTab = 'history';
    this.loadCount();
    this.applyFilter();
  }

  /** GET /api/quantities/history */
  loadAllHistory() {
    this.isHistoryLoading = true;
    this.historyError = '';
    this.cdr.detectChanges();
    this.http.get<HistoryRecord[]>(`${this.baseUrl}/api/quantities/history`, { headers: this.authHeaders() })
      .subscribe({
        next: (data) => { this.historyRecords = data; this.isHistoryLoading = false; this.cdr.detectChanges(); },
        error: (err) => {
          this.isHistoryLoading = false;
          this.historyError = err.status === 401 ? 'Session expired. Please login again.' : 'Failed to load history.';
          this.cdr.detectChanges();
        }
      });
  }

  /** GET /api/quantities/history/operation/{operationType} */
  loadHistoryByOperation(op: string) {
    this.isHistoryLoading = true;
    this.historyError = '';
    this.cdr.detectChanges();
    this.http.get<HistoryRecord[]>(`${this.baseUrl}/api/quantities/history/operation/${op}`, { headers: this.authHeaders() })
      .subscribe({
        next: (data) => { this.historyRecords = data; this.isHistoryLoading = false; this.cdr.detectChanges(); },
        error: () => { this.isHistoryLoading = false; this.historyError = 'Failed to load history by operation.'; this.cdr.detectChanges(); }
      });
  }

  /** GET /api/quantities/history/category/{category} */
  loadHistoryByCategory(cat: string) {
    this.isHistoryLoading = true;
    this.historyError = '';
    this.cdr.detectChanges();
    this.http.get<HistoryRecord[]>(`${this.baseUrl}/api/quantities/history/category/${cat}`, { headers: this.authHeaders() })
      .subscribe({
        next: (data) => { this.historyRecords = data; this.isHistoryLoading = false; this.cdr.detectChanges(); },
        error: () => { this.isHistoryLoading = false; this.historyError = 'Failed to load history by category.'; this.cdr.detectChanges(); }
      });
  }

  /** GET /api/quantities/count */
  loadCount() {
    this.http.get<number>(`${this.baseUrl}/api/quantities/count`, { headers: this.authHeaders() })
      .subscribe({ next: (n) => { this.historyCount = n; }, error: () => {} });
  }

  applyFilter() {
    if (this.filterOperation !== 'all') {
      this.loadHistoryByOperation(this.filterOperation);
    } else if (this.filterCategory !== 'all') {
      this.loadHistoryByCategory(this.filterCategory);
    } else {
      this.loadAllHistory();
    }
  }

  /** Client-side category filter when operation filter is also active */
  get displayedHistory(): HistoryRecord[] {
    if (this.filterOperation !== 'all' && this.filterCategory !== 'all') {
      return this.historyRecords.filter(
        r => r.measurementCategory?.toLowerCase() === this.filterCategory.toLowerCase()
      );
    }
    return this.historyRecords;
  }

  formatOp(op: string): string {
    if (!op) return '—';
    return op.charAt(0).toUpperCase() + op.slice(1).toLowerCase();
  }

  opIcon(op: string): string {
    const m: Record<string, string> = { compare: '⚖️', add: '➕', subtract: '➖', divide: '➗' };
    return m[op?.toLowerCase()] || '🧮';
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login']);
  }
}
