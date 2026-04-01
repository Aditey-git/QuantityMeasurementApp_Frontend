import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private backendBaseUrl = 'http://localhost:5125';

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    const url = `${this.backendBaseUrl}/api/auth/register?email=${encodeURIComponent(this.email)}&password=${encodeURIComponent(this.password)}`;
    this.http.post(url, {}).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 400 || err.status === 409) {
          this.errorMessage = 'Registration failed. User may already exist.';
        } else {
          this.errorMessage = 'Cannot reach the server. Ensure the API is running.';
        }
      }
    });
  }
}
