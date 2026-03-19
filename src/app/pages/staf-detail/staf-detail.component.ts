import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { GitlabService, ActivitySummary } from '../../core/services/gitlab.service';

@Component({
  selector: 'app-staf-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatSnackBarModule, MatChipsModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, FormsModule
  ],
  template: `
    @if (loading) { <div class="loading-center"><mat-spinner></mat-spinner></div> }

    @if (summary && !loading) { <div class="detail-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button routerLink="/staf">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="avatar-large">{{ summary.staf.name.charAt(0).toUpperCase() }}</div>
        <div class="staf-info">
          <h2>{{ summary.staf.name }}</h2>
          <p>
            <mat-icon style="font-size:16px;width:16px;height:16px;vertical-align:middle">person</mat-icon>
            {{ summary.staf.gitlab_username || summary.staf.username }}
            &nbsp;|&nbsp;
            <mat-icon style="font-size:16px;width:16px;height:16px;vertical-align:middle">badge</mat-icon>
            {{ summary.staf.role }}
          </p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline">
            <mat-label>Periode</mat-label>
            <mat-select [(ngModel)]="selectedDays" (ngModelChange)="loadData()">
              <mat-option [value]="7">7 Hari</mat-option>
              <mat-option [value]="14">14 Hari</mat-option>
              <mat-option [value]="30">30 Hari</mat-option>
              <mat-option [value]="90">90 Hari</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="accent" (click)="sync()" [disabled]="syncing">
            <mat-icon [class.spin]="syncing">sync</mat-icon> {{ syncing ? 'Menyinkronkan...' : 'Sync Aktivitas' }}
          </button>
        </div>
      </div>

      @if (syncing) {
        <mat-progress-bar mode="indeterminate" color="accent" style="margin-bottom:12px;border-radius:4px"></mat-progress-bar>
      }

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card commits">
          <mat-card-content>
            <mat-icon>commit</mat-icon>
            <span class="stat-num">{{ summary.total_commits }}</span>
            <span class="stat-lbl">Commits</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card pushes">
          <mat-card-content>
            <mat-icon>upload</mat-icon>
            <span class="stat-num">{{ summary.total_push_events }}</span>
            <span class="stat-lbl">Push Events</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card merges">
          <mat-card-content>
            <mat-icon>merge</mat-icon>
            <span class="stat-num">{{ summary.total_merge_requests }}</span>
            <span class="stat-lbl">Merge Requests</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card issues">
          <mat-card-content>
            <mat-icon>bug_report</mat-icon>
            <span class="stat-num">{{ summary.total_issues }}</span>
            <span class="stat-lbl">Issues</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card comments">
          <mat-card-content>
            <mat-icon>comment</mat-icon>
            <span class="stat-num">{{ summary.total_comments }}</span>
            <span class="stat-lbl">Komentar</span>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Daily Activity -->
      <mat-card style="margin-top:16px">
        <mat-card-header>
          <mat-card-title><mat-icon>bar_chart</mat-icon> Aktivitas Harian</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (summary.daily_activity.length === 0) {
            <div class="no-data">Belum ada data aktivitas harian.</div>
          } @else {
            <div class="activity-bars">
              @for (day of summary.daily_activity; track day.date) {
                <div class="day-bar-wrap" [title]="day.date + ': ' + day.count + ' aktivitas'">
                  <div class="day-bar" [style.height.px]="getBarHeight(day.count)"></div>
                  <span class="day-label">{{ formatDay(day.date) }}</span>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Active Projects -->
      <mat-card style="margin-top:16px">
        <mat-card-header>
          <mat-card-title><mat-icon>folder</mat-icon> Proyek Aktif ({{ summary.active_projects.length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (summary.active_projects.length === 0) {
            <div class="no-data">Tidak ada proyek aktif pada periode ini.</div>
          } @else {
            <mat-chip-set>
              @for (p of summary.active_projects; track p) {
                <mat-chip highlighted>
                  <mat-icon matChipAvatar>folder_open</mat-icon>
                  {{ p }}
                </mat-chip>
              }
            </mat-chip-set>
          }
        </mat-card-content>
      </mat-card>
    </div> }

    @if (syncing || syncMsg) {
      <div class="sync-banner" [class.success]="syncDone && !syncFail" [class.fail]="syncFail">
        @if (syncing) { <span class="sync-spinner"></span> }
        @if (!syncing && syncDone && !syncFail) { <span>✅</span> }
        @if (syncFail) { <span>❌</span> }
        <span>{{ syncMsg }}</span>
      </div>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .detail-container { max-width: 1100px; }

    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .avatar-large { width: 56px; height: 56px; border-radius: 50%; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; flex-shrink: 0; }
    .staf-info h2 { margin: 0; }
    .staf-info p { margin: 4px 0 0; color: #666; font-size: 14px; display: flex; align-items: center; gap: 4px; }
    .header-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; }
    .stat-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 24px 16px !important; }
    .stat-card mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; }
    .stat-num { font-size: 32px; font-weight: 700; line-height: 1; }
    .stat-lbl { font-size: 12px; color: #888; margin-top: 4px; }
    .stat-card.commits mat-icon, .stat-card.commits .stat-num { color: #1976d2; }
    .stat-card.pushes mat-icon, .stat-card.pushes .stat-num { color: #0288d1; }
    .stat-card.merges mat-icon, .stat-card.merges .stat-num { color: #388e3c; }
    .stat-card.issues mat-icon, .stat-card.issues .stat-num { color: #f57c00; }
    .stat-card.comments mat-icon, .stat-card.comments .stat-num { color: #7b1fa2; }

    .activity-bars { display: flex; align-items: flex-end; gap: 4px; height: 120px; overflow-x: auto; padding: 8px 0; }
    .day-bar-wrap { display: flex; flex-direction: column; align-items: center; min-width: 28px; }
    .day-bar { width: 20px; background: #1976d2; border-radius: 3px 3px 0 0; min-height: 4px; transition: height 0.3s; }
    .day-label { font-size: 9px; color: #999; margin-top: 2px; writing-mode: vertical-rl; height: 30px; }

    .no-data { color: #999; font-style: italic; padding: 16px 0; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    .sync-banner { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1565c0; color: #fff; padding: 12px 24px; border-radius: 6px; display: flex; align-items: center; gap: 10px; z-index: 99999; box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-size: 14px; white-space: nowrap; }
    .sync-banner.success { background: #2e7d32; }
    .sync-banner.fail { background: #c62828; }
    @keyframes spin2 { to { transform: rotate(360deg); } }
    .sync-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin2 0.8s linear infinite; flex-shrink: 0; }

    @media (max-width: 768px) {
      .detail-container { max-width: 100%; }
      .page-header { gap: 10px; margin-bottom: 16px; }
      .staf-info h2 { font-size: 18px; margin: 0; }
      .header-actions { margin-left: 0; width: 100%; justify-content: space-between; }
      .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .stat-card mat-card-content { padding: 16px 8px !important; }
      .stat-num { font-size: 24px; }
      .stat-card mat-icon { font-size: 24px; width: 24px; height: 24px; }
      .avatar-large { width: 44px; height: 44px; font-size: 18px; }
    }
  `]
})
export class StafDetailComponent implements OnInit {
  summary: ActivitySummary | null = null;
  loading = false;
  syncing = false;
  syncMsg = '';
  syncDone = false;
  syncFail = false;
  selectedDays = 30;
  stafId = 0;

  constructor(private route: ActivatedRoute, private gitlabService: GitlabService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.stafId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.gitlabService.getStafSummary(this.stafId, this.selectedDays).subscribe({
      next: (data) => { this.summary = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  sync() {
    this.syncing = true;
    this.syncDone = false;
    this.syncFail = false;
    this.syncMsg = 'Menyinkronkan aktivitas dari GitLab...';
    this.gitlabService.syncStaf(this.stafId, this.selectedDays).subscribe({
      next: (res) => {
        this.syncing = false;
        this.syncDone = true;
        const synced = res?.results?.[0]?.synced ?? '?';
        this.syncMsg = `Selesai: ${synced} aktivitas baru disinkronkan`;
        this.loadData();
        setTimeout(() => this.syncMsg = '', 5000);
      },
      error: (err) => {
        this.syncing = false;
        this.syncFail = true;
        this.syncMsg = 'Gagal: ' + (err?.error?.error || 'Terjadi kesalahan');
        setTimeout(() => this.syncMsg = '', 8000);
      }
    });
  }

  getBarHeight(count: number): number {
    if (!this.summary) return 0;
    const max = Math.max(...this.summary.daily_activity.map(d => d.count), 1);
    return Math.max((count / max) * 100, 4);
  }

  formatDay(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1}`;
  }
}
