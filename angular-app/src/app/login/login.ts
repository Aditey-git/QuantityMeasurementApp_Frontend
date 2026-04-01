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
  private backendBaseUrl = 'http://localhost:5125';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      alert('Please fill all fields');
      return;
    }
    const url = `${this.backendBaseUrl}/api/auth/login?email=${encodeURIComponent(this.email)}&password=${encodeURIComponent(this.password)}`;
    this.http.post<{ token: string }>(url, {}).subscribe({
      next: (data) => {
        localStorage.setItem('authToken', data.token);
        this.router.navigate(['/measurement']);
      },
      error: (err) => {
        if (err.status === 401) {
          alert('Invalid Email or Password!');
        } else {
          alert('Cannot reach the server.');
        }
      }
    });
  }
}
