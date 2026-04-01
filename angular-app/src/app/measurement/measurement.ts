import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, NgFor } from '@angular/common';
import { Router } from '@angular/router';

interface MeasurementResponse {
  isSuccess: boolean;
  isComparison: boolean;
  areEqual: boolean;
  calculatedValue: number;
  formattedMessage: string;
  errorMessage: string;
}

@Component({
  selector: 'app-measurement',
  imports: [FormsModule, CommonModule, NgFor],
  templateUrl: './measurement.html',
  styleUrl: './measurement.css'
})
export class Measurement implements OnInit {
  private backendBaseUrl = 'http://localhost:5125';

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
  unit1 = '';
  unit2 = '';
  targetUnit = '';
  value1: number | null = null;
  value2: number | null = null;
  operatorIcon = '⚖️';
  resultMessage = 'Pick a category, operation and values to run.';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.setCategory('Length');
  }

  setCategory(category: string) {
    this.currentCategory = category;
    this.availableUnits = this.units[category] || [];
    this.unit1 = this.availableUnits[0];
    this.unit2 = this.availableUnits[0];
    this.targetUnit = this.availableUnits[0];

    if (category === 'Temperature') {
      this.availableOperations = ['Compare'];
      this.operation = 'Compare';
    } else {
      this.availableOperations = ['Compare', 'Add', 'Subtract', 'Divide'];
    }
    this.updateOperatorIcon();
    this.resultMessage = `Category set to ${category}. Pick operation and values to run.`;
  }

  updateOperatorIcon() {
    const icons: Record<string, string> = {
      Compare: '⚖️', Add: '➕', Subtract: '➖', Divide: '➗'
    };
    this.operatorIcon = icons[this.operation] || '🧮';
  }

  formatResult(value: number): string {
    return Number.isFinite(value) ? Number(value.toFixed(6)).toString() : 'NaN';
  }

  execute() {
    if (this.value1 === null || this.value1 === undefined) {
      this.resultMessage = 'Please enter a value for Value 1.';
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const requestDTO = {
      MeasurementCategory: this.currentCategory,
      OperationType: this.operationMap[this.operation],
      MeasurementUnit1: this.unit1,
      MeasurementValue1: this.value1,
      MeasurementUnit2: this.unit2,
      MeasurementValue2: this.value2 ?? 0,
      TargetMeasurementUnit: this.targetUnit
    };

    const operationUrl = `${this.backendBaseUrl}/api/quantities/${this.operation.toLowerCase()}`;

    this.http.post<MeasurementResponse>(operationUrl, requestDTO, { headers }).subscribe({
      next: (data) => {
        if (!data.isSuccess) {
          this.resultMessage = `Error: ${data.errorMessage || 'Unknown error'}`;
          return;
        }
        if (data.isComparison) {
          if (data.areEqual) {
            this.resultMessage = `Result: ${this.value1} ${this.unit1} is equal to ${this.value2} ${this.unit2}`;
          } else {
            this.resultMessage = `Result: ${this.value1} ${this.unit1} is not equal to ${this.value2} ${this.unit2}`;
          }
        } else {
          const niceValue = this.formatResult(data.calculatedValue);
          this.resultMessage = `${this.value1} ${this.unit1} ${this.operatorIcon} ${this.value2} ${this.unit2} = ${niceValue} ${this.targetUnit}`;
        }
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.resultMessage = 'Authentication required. Please login first.';
          this.router.navigate(['/login']);
        } else {
          this.resultMessage = 'Cannot reach backend. Ensure the API server is running.';
        }
      }
    });
  }
}
