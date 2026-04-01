import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  private backendBaseUrl = 'http://localhost:5125';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }
    this.isLoading = true;
    const url = `${this.backendBaseUrl}/api/auth/login?email=${encodeURIComponent(this.email)}&password=${encodeURIComponent(this.password)}`;
    this.http.post<{ token: string }>(url, {}).subscribe({
      next: (data) => {
        this.isLoading = false;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', this.email);
        this.router.navigate(['/measurement']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.status === 401
          ? 'Invalid email or password.'
          : 'Cannot reach the server. Ensure the API is running.';
      }
    });
  }
}
