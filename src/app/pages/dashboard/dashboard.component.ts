import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { from, concatMap, catchError, of } from 'rxjs';
import { GitlabService, ActivitySummary } from '../../core/services/gitlab.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule,
    FormsModule, RouterLink
  ],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="header-row">
        <div>
          <h2 class="page-title">Dashboard Aktivitas Tim</h2>
          <p class="subtitle">Monitoring aktivitas programmer di GitLab</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-select">
            <mat-label>Periode</mat-label>
            <mat-select [(ngModel)]="selectedDays" (ngModelChange)="loadData()">
              <mat-option [value]="7">7 Hari</mat-option>
              <mat-option [value]="14">14 Hari</mat-option>
              <mat-option [value]="30">30 Hari</mat-option>
              <mat-option [value]="90">90 Hari</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="accent" (click)="syncAll()" [disabled]="syncing">
            <mat-icon>sync</mat-icon>
            {{ syncProgress || (syncing ? 'Sinkronisasi...' : 'Sync GitLab') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="loading-center">
          <mat-spinner></mat-spinner>
          <p>Memuat data...</p>
        </div>
      }

      <!-- Team Stats Overview -->
      @if (!loading && teamSummary.length > 0) {
        <div class="overview-cards">
          <mat-card class="overview-card">
            <mat-card-content>
              <mat-icon class="overview-icon commits">commit</mat-icon>
              <div class="overview-stat">
                <span class="stat-number">{{ totalStats.commits }}</span>
                <span class="stat-label">Total Commits</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="overview-card">
            <mat-card-content>
              <mat-icon class="overview-icon merges">merge</mat-icon>
              <div class="overview-stat">
                <span class="stat-number">{{ totalStats.mergeRequests }}</span>
                <span class="stat-label">Merge Requests</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="overview-card">
            <mat-card-content>
              <mat-icon class="overview-icon issues">bug_report</mat-icon>
              <div class="overview-stat">
                <span class="stat-number">{{ totalStats.issues }}</span>
                <span class="stat-label">Issues</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="overview-card">
            <mat-card-content>
              <mat-icon class="overview-icon team">people</mat-icon>
              <div class="overview-stat">
                <span class="stat-number">{{ teamSummary.length }}</span>
                <span class="stat-label">Staf Aktif</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Staf Activity Cards -->
        <div class="section-title">
          <mat-icon>people</mat-icon> Aktivitas Per Staf
        </div>
        <div class="staf-grid">
          @for (item of teamSummary; track item.staf.id; let i = $index) {
            <mat-card class="staf-card" [class.top-three]="i < 3">
              <div class="rank-badge" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                {{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1) }}
              </div>
              <mat-card-header>
                <div mat-card-avatar class="avatar-circle" [class.gold-av]="i===0" [class.silver-av]="i===1" [class.bronze-av]="i===2">
                  {{ item.staf.name.charAt(0).toUpperCase() }}
                </div>
                <mat-card-title>{{ item.staf.name }}</mat-card-title>
                <mat-card-subtitle>{{ item.staf.gitlab_username || item.staf.username }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="mini-stats">
                  <div class="mini-stat">
                    <span class="mini-number commits">{{ item.total_commits }}</span>
                    <span class="mini-label">Commits</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-number merges">{{ item.total_merge_requests }}</span>
                    <span class="mini-label">MR</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-number issues">{{ item.total_issues }}</span>
                    <span class="mini-label">Issues</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-number comments">{{ item.total_comments }}</span>
                    <span class="mini-label">Komentar</span>
                  </div>
                </div>
                <div class="total-activity">
                  <mat-icon style="font-size:14px;width:14px;height:14px">bolt</mat-icon>
                  <span><strong>{{ totalActivity(item) }}</strong> total aktivitas</span>
                </div>
                @if (item.active_projects.length > 0) {
                  <div class="projects-info">
                    <mat-icon style="font-size:14px;width:14px;height:14px">folder</mat-icon>
                    <span>{{ item.active_projects.length }} proyek aktif</span>
                  </div>
                }
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button color="primary" [routerLink]="['/staf', item.staf.id]">
                  <mat-icon>bar_chart</mat-icon> Detail
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      @if (!loading && teamSummary.length === 0) {
        <div class="empty-state">
          <mat-icon>info_outline</mat-icon>
          <h3>Belum ada data aktivitas</h3>
          <p>Pastikan konfigurasi GitLab sudah diatur dan staf memiliki gitlab_username.</p>
          <button mat-raised-button color="primary" (click)="syncAll()">
            <mat-icon>sync</mat-icon> Mulai Sinkronisasi
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .period-select { width: 130px; }

    .overview-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .overview-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px !important; }
    .overview-icon { font-size: 40px; width: 40px; height: 40px; border-radius: 50%; padding: 8px; }
    .overview-icon.commits { color: #1976d2; background: #e3f2fd; }
    .overview-icon.merges { color: #388e3c; background: #e8f5e9; }
    .overview-icon.issues { color: #f57c00; background: #fff3e0; }
    .overview-icon.team { color: #7b1fa2; background: #f3e5f5; }
    .overview-stat { display: flex; flex-direction: column; }
    .stat-number { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }

    .section-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 500; margin-bottom: 16px; color: #333; }

    .staf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .staf-card { transition: box-shadow 0.2s; position: relative; }
    .staf-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
    .staf-card.top-three { border-top: 3px solid #ffd700; }
    .rank-badge { position: absolute; top: 8px; right: 12px; font-size: 20px; line-height: 1; }
    .rank-badge:not(.gold):not(.silver):not(.bronze) { font-size: 12px; color: #999; font-weight: 600; }
    .avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
    .avatar-circle.gold-av { background: #f9a825; }
    .avatar-circle.silver-av { background: #90a4ae; }
    .avatar-circle.bronze-av { background: #a1887f; }

    .mini-stats { display: flex; justify-content: space-around; margin: 16px 0 8px; }
    .mini-stat { display: flex; flex-direction: column; align-items: center; }
    .mini-number { font-size: 22px; font-weight: 700; }
    .mini-number.commits { color: #1976d2; }
    .mini-number.merges { color: #388e3c; }
    .mini-number.issues { color: #f57c00; }
    .mini-number.comments { color: #7b1fa2; }
    .mini-label { font-size: 11px; color: #888; margin-top: 2px; }

    .total-activity { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #444; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px; }
    .total-activity mat-icon { color: #f57c00; }
    .projects-info { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #888; margin-top: 4px; }

    .loading-center { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; gap: 16px; color: #666; }
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; padding: 64px; color: #999; gap: 8px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; }
    .empty-state h3 { margin: 0; color: #666; }
    .empty-state p { margin: 0; text-align: center; }

    @media (max-width: 768px) {
      .dashboard { max-width: 100%; }
      .header-row { margin-bottom: 16px; }
      .page-title { font-size: 18px; }
      .header-actions { width: 100%; justify-content: space-between; }
      .period-select { flex: 1; }
      .overview-cards { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
      .overview-card mat-card-content { padding: 14px !important; gap: 10px; }
      .overview-icon { font-size: 28px; width: 28px; height: 28px; padding: 6px; }
      .stat-number { font-size: 22px; }
      .staf-grid { grid-template-columns: 1fr; gap: 12px; }
      .mini-number { font-size: 18px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  teamSummary: ActivitySummary[] = [];
  loading = false;
  syncing = false;
  syncProgress = '';
  selectedDays = 30;

  get totalStats() {
    return {
      commits: this.teamSummary.reduce((s, i) => s + i.total_commits, 0),
      mergeRequests: this.teamSummary.reduce((s, i) => s + i.total_merge_requests, 0),
      issues: this.teamSummary.reduce((s, i) => s + i.total_issues, 0),
    };
  }

  constructor(private gitlabService: GitlabService, private authService: AuthService) {}

  ngOnInit() { this.loadData(); }

  totalActivity(item: ActivitySummary): number {
    return item.total_commits + item.total_push_events + item.total_merge_requests + item.total_issues + item.total_comments;
  }

  loadData() {
    this.loading = true;
    this.gitlabService.getTeamSummary(this.selectedDays).subscribe({
      next: (data) => {
        this.teamSummary = data
          .filter(item => item.total_commits > 0)
          .sort((a, b) => this.totalActivity(b) - this.totalActivity(a));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  syncAll() {
    this.syncing = true;
    this.syncProgress = 'Mengambil daftar staf...';
    this.authService.getStafIds().subscribe({
      next: (ids) => {
        let done = 0;
        const total = ids.length;
        from(ids).pipe(
          concatMap(id => this.gitlabService.syncStaf(id, this.selectedDays).pipe(
            catchError(() => of(null))
          ))
        ).subscribe({
          next: () => {
            done++;
            this.syncProgress = `Sinkronisasi ${done}/${total} staf...`;
          },
          complete: () => {
            this.syncing = false;
            this.syncProgress = '';
            this.loadData();
          }
        });
      },
      error: () => { this.syncing = false; this.syncProgress = ''; }
    });
  }
}
