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
  private backendBaseUrl = 'http://localhost:5125';

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    if (!this.email || !this.password || !this.confirmPassword) {
      alert('Please fill all fields');
      return;
    }
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    const url = `${this.backendBaseUrl}/api/auth/register?email=${encodeURIComponent(this.email)}&password=${encodeURIComponent(this.password)}`;
    this.http.post(url, {}).subscribe({
      next: () => {
        alert('Registration successful');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 400 || err.status === 409) {
          alert('Registration failed. User may already exist.');
        } else {
          alert('Cannot reach the server.');
        }
      }
    });
  }
}
