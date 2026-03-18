import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatTableModule, MatSortModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, FormsModule
  ],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Aktivitas Proyek</h2>
          <p class="subtitle">Monitoring commit per proyek di GitLab UMS</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-field">
            <mat-label>Periode</mat-label>
            <mat-select [(ngModel)]="selectedDays" (ngModelChange)="loadProjects()">
              <mat-option [value]="7">7 Hari</mat-option>
              <mat-option [value]="14">14 Hari</mat-option>
              <mat-option [value]="30">30 Hari</mat-option>
              <mat-option [value]="90">90 Hari</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="accent" (click)="syncProjects()" [disabled]="syncing">
            <mat-icon [class.spin]="syncing">sync</mat-icon> {{ syncing ? 'Menyinkronkan...' : 'Sync Proyek' }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      @if (!loading && projects.length > 0) {
        <div class="stats-row">
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si">folder</mat-icon>
              <div><span class="sn">{{ totalProjects }}</span><span class="sl">Proyek Aktif</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si commit">commit</mat-icon>
              <div><span class="sn">{{ totalCommits }}</span><span class="sl">Total Commits</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si people">people</mat-icon>
              <div><span class="sn">{{ totalContributors }}</span><span class="sl">Kontributor Unik</span></div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Sync Progress -->
      @if (syncing) {
        <mat-card class="sync-progress-card">
          <mat-card-content>
            <div class="sync-status">
              <mat-icon class="spin">sync</mat-icon>
              <div class="sync-text">
                <span class="sync-msg">{{ syncMessage }}</span>
                <span class="sync-elapsed">{{ syncElapsed }}s</span>
              </div>
            </div>
            <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
          </mat-card-content>
        </mat-card>
      }
      @if (syncResult) {
        <mat-card class="sync-result-card" [class.error]="syncError">
          <mat-card-content>
            <mat-icon>{{ syncError ? 'error' : 'check_circle' }}</mat-icon>
            <span>{{ syncResult }}</span>
          </mat-card-content>
        </mat-card>
      }

      <!-- Search + Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Cari nama proyek / namespace</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Ketik untuk mencari...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          @if (loading) {
            <div class="loading-center"><mat-spinner></mat-spinner><p>Memuat data proyek...</p></div>
          } @else {
            <div class="table-scroll">
            <table mat-table [dataSource]="projects" matSort (matSortChange)="onSort($event)" class="full-width">
              <ng-container matColumnDef="no">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let p; let i = index">{{ i + 1 }}</td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Nama Proyek</th>
                <td mat-cell *matCellDef="let p">
                  <div class="project-name">{{ p.name }}</div>
                  <div class="project-ns">{{ p.namespace }}</div>
                </td>
              </ng-container>
              <ng-container matColumnDef="commits">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="commits" class="center">Commits</th>
                <td mat-cell *matCellDef="let p" class="center">
                  <span class="commit-badge" [class.high]="p.commit_count >= 20" [class.mid]="p.commit_count >= 5 && p.commit_count < 20">
                    {{ p.commit_count }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="contributors">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="contributors" class="center">Kontributor</th>
                <td mat-cell *matCellDef="let p" class="center">
                  <span class="contrib-badge">{{ p.contributor_count }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="last_activity">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="last_activity">Aktivitas Terakhir</th>
                <td mat-cell *matCellDef="let p">{{ p.last_activity_at || '-' }}</td>
              </ng-container>
              <ng-container matColumnDef="visibility">
                <th mat-header-cell *matHeaderCellDef>Visibilitas</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class]="p.visibility">{{ p.visibility }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="center">Aksi</th>
                <td mat-cell *matCellDef="let p" class="center">
                  <button mat-icon-button color="primary" [routerLink]="['/projects', p.id]" title="Detail">
                    <mat-icon>bar_chart</mat-icon>
                  </button>
                  <a mat-icon-button [href]="p.web_url" target="_blank" title="Buka di GitLab">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
            </table>

            @if (projects.length === 0) {
              <div class="empty">
                <mat-icon>folder_off</mat-icon>
                <p>Belum ada data proyek. Klik "Sync Proyek" untuk memulai.</p>
              </div>
            }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .period-field { width: 130px; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px !important; }
    .si { font-size: 36px; width: 36px; height: 36px; color: #1976d2; }
    .si.commit { color: #388e3c; }
    .si.people { color: #7b1fa2; }
    .sn { display: block; font-size: 28px; font-weight: 700; line-height: 1; }
    .sl { display: block; font-size: 12px; color: #666; margin-top: 4px; }

    .table-card { border-radius: 12px !important; }
    .search-field { width: 100%; margin: 8px 0; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .full-width { width: 100%; }
    .center { text-align: center !important; }

    th { background: #1976d2 !important; color: white !important; font-weight: 600 !important; font-size: 13px !important; }
    .mat-sort-header-arrow { color: white !important; }
    td { font-size: 13px; border-bottom: 1px solid #f0f0f0 !important; }
    .table-row:hover { background: #e3f2fd !important; cursor: pointer; }
    .table-row:nth-child(even) { background: #fafafa; }

    .project-name { font-weight: 500; color: #1976d2; }
    .project-ns { font-size: 11px; color: #999; margin-top: 2px; }

    .commit-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-weight: 700; background: #fce4ec; color: #c62828; }
    .commit-badge.mid { background: #fff3e0; color: #e65100; }
    .commit-badge.high { background: #e8f5e9; color: #2e7d32; }
    .contrib-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-weight: 700; background: #e3f2fd; color: #1976d2; }

    mat-chip.private { background: #fce4ec !important; color: #c62828 !important; font-size: 11px; }
    mat-chip.internal { background: #fff3e0 !important; color: #e65100 !important; font-size: 11px; }
    mat-chip.public { background: #e8f5e9 !important; color: #2e7d32 !important; font-size: 11px; }

    .loading-center { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; color: #666; }
    .empty { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #999; gap: 8px; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .sync-progress-card { margin-bottom: 16px; border-left: 4px solid #ff9800 !important; }
    .sync-progress-card mat-card-content { padding: 12px 16px !important; }
    .sync-status { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .sync-text { display: flex; flex-direction: column; }
    .sync-msg { font-size: 14px; color: #555; }
    .sync-elapsed { font-size: 12px; color: #999; }
    .sync-result-card { margin-bottom: 16px; border-left: 4px solid #4caf50 !important; }
    .sync-result-card.error { border-left-color: #f44336 !important; }
    .sync-result-card mat-card-content { display: flex; align-items: center; gap: 10px; padding: 12px 16px !important; font-size: 14px; }
    .sync-result-card mat-icon { color: #4caf50; }
    .sync-result-card.error mat-icon { color: #f44336; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin 1s linear infinite; }

    @media (max-width: 768px) {
      .page { max-width: 100%; }
      .page-title { font-size: 18px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
      .sn { font-size: 22px; }
      .header-actions { width: 100%; justify-content: space-between; }
      .period-field { flex: 1; }
      .table-card { border-radius: 0 !important; margin: 0 -16px; }
      .mat-column-no, .mat-column-last_activity, .mat-column-visibility { display: none !important; }
      td, th { padding: 8px 10px !important; font-size: 12px !important; }
    }
  `]
})
export class ProjectsComponent implements OnInit {
  projects: any[] = [];
  displayedColumns = ['no', 'name', 'commits', 'contributors', 'last_activity', 'visibility', 'actions'];
  loading = false;
  syncing = false;
  syncMessage = '';
  syncElapsed = 0;
  syncResult = '';
  syncError = false;
  selectedDays = 30;
  searchQuery = '';
  private searchTimer: any;
  private syncTimer: any;

  get totalProjects() { return this.projects.length; }
  get totalCommits() { return this.projects.reduce((s, p) => s + p.commit_count, 0); }
  get totalContributors() { return new Set(this.projects.flatMap(p => p.contributor_count)).size; }

  constructor(private projectService: ProjectService) {}

  ngOnInit() { this.loadProjects(); }

  loadProjects() {
    this.loading = true;
    this.projectService.getProjects(this.selectedDays, this.searchQuery).subscribe({
      next: (data) => {
        this.projects = data.results ?? data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProjects(), 400);
  }

  onSort(sort: Sort) {
    const dir = sort.direction === 'desc' ? -1 : 1;
    this.projects = [...this.projects].sort((a, b) => {
      const field = sort.active === 'commits' ? 'commit_count' : sort.active === 'contributors' ? 'contributor_count' : sort.active;
      return (a[field] > b[field] ? 1 : -1) * dir;
    });
  }

  syncProjects() {
    this.syncing = true;
    this.syncElapsed = 0;
    this.syncResult = '';
    this.syncError = false;
    this.syncMessage = 'Mengambil daftar proyek dari GitLab...';
    this.syncTimer = setInterval(() => this.syncElapsed++, 1000);
    this.projectService.syncProjects().subscribe({
      next: (res) => {
        clearInterval(this.syncTimer);
        this.syncing = false;
        const count = res?.message?.match(/\d+/)?.[0] || '?';
        this.syncResult = `Sinkronisasi selesai: ${count} proyek diperbarui (${this.syncElapsed}s)`;
        this.loadProjects();
        setTimeout(() => this.syncResult = '', 8000);
      },
      error: (err) => {
        clearInterval(this.syncTimer);
        this.syncing = false;
        this.syncError = true;
        this.syncResult = 'Sinkronisasi gagal: ' + (err?.error?.error || 'Periksa konfigurasi GitLab');
        setTimeout(() => { this.syncResult = ''; this.syncError = false; }, 8000);
      }
    });
  }
}
