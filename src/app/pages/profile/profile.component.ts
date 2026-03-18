import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card style="max-width:600px">
      <mat-card-header>
        <mat-icon mat-card-avatar style="font-size:40px;width:40px;height:40px">account_circle</mat-icon>
        <mat-card-title>{{ user?.first_name }} {{ user?.last_name }}</mat-card-title>
        <mat-card-subtitle>{{ user?.role | titlecase }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content style="padding-top:16px">
        <p><strong>Username:</strong> {{ user?.username }}</p>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>GitLab:</strong> {{ user?.gitlab_username || '-' }}</p>
      </mat-card-content>
    </mat-card>
  `
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  constructor(private authService: AuthService) {}
  ngOnInit() { this.user = this.authService.currentUser; }
}
