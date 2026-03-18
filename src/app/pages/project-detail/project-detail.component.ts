import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatTableModule, MatSelectModule, FormsModule
  ],
  template: `
    @if (loading) { <div class="loading-center"><mat-spinner></mat-spinner></div> }

    @if (data && !loading) {
      <div class="detail">
        <!-- Header -->
        <div class="page-header">
          <button mat-icon-button routerLink="/projects"><mat-icon>arrow_back</mat-icon></button>
          <div class="proj-info">
            <h2>{{ data.project.name }}</h2>
            <p>
              <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle">folder</mat-icon>
              {{ data.project.name_with_namespace }}
              &nbsp;
              <a [href]="data.project.web_url" target="_blank" style="color:#1976d2">
                <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle">open_in_new</mat-icon>
              </a>
            </p>
          </div>
          <div class="header-actions">
            <mat-form-field appearance="outline" style="width:130px">
              <mat-label>Periode</mat-label>
              <mat-select [(ngModel)]="selectedDays" (ngModelChange)="loadData()">
                <mat-option [value]="7">7 Hari</mat-option>
                <mat-option [value]="14">14 Hari</mat-option>
                <mat-option [value]="30">30 Hari</mat-option>
                <mat-option [value]="90">90 Hari</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="sync()" [disabled]="syncing">
              <mat-icon [class.spin]="syncing">sync</mat-icon> {{ syncing ? 'Menyinkronkan...' : 'Sync Commits' }}
            </button>
          </div>
        </div>

        <!-- Sync Progress -->
        @if (syncing) {
          <div class="sync-progress">
            <div class="sync-status">
              <mat-icon class="spin">sync</mat-icon>
              <div class="sync-text">
                <span class="sync-msg">{{ syncMessage }}</span>
                <span class="sync-elapsed">{{ syncElapsed }}s</span>
              </div>
            </div>
            <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
          </div>
        }
        @if (syncResult) {
          <div class="sync-result" [class.error]="syncError">
            <mat-icon>{{ syncError ? 'error' : 'check_circle' }}</mat-icon>
            <span>{{ syncResult }}</span>
          </div>
        }

        <!-- Stats -->
        <div class="stats-row">
          <mat-card class="sc">
            <mat-card-content>
              <mat-icon class="si">commit</mat-icon>
              <div><span class="sn">{{ data.total_commits }}</span><span class="sl">Total Commits</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="sc">
            <mat-card-content>
              <mat-icon class="si people">people</mat-icon>
              <div><span class="sn">{{ data.contributors.length }}</span><span class="sl">Kontributor</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="sc">
            <mat-card-content>
              <mat-icon class="si calendar">event</mat-icon>
              <div><span class="sn" style="font-size:16px">{{ data.project.last_activity_at || '-' }}</span><span class="sl">Aktivitas Terakhir</span></div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Contributors Table -->
        <mat-card>
          <mat-card-header><mat-card-title>Kontributor ({{ selectedDays }} hari terakhir)</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.contributors" class="full-width">
              <ng-container matColumnDef="rank">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let c; let i = index">
                  {{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }}
                </td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nama</th>
                <td mat-cell *matCellDef="let c">
                  <div style="font-weight:500">{{ c.name }}</div>
                  <div style="font-size:11px;color:#999">{{ c.gitlab_username }}</div>
                </td>
              </ng-container>
              <ng-container matColumnDef="commits">
                <th mat-header-cell *matHeaderCellDef class="center">Commits</th>
                <td mat-cell *matCellDef="let c" class="center">
                  <span class="commit-bar-wrap">
                    <span class="commit-bar" [style.width.%]="getBarWidth(c.total_commits)"></span>
                    <span class="commit-num">{{ c.total_commits }}</span>
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="last_commit">
                <th mat-header-cell *matHeaderCellDef>Commit Terakhir</th>
                <td mat-cell *matCellDef="let c">{{ c.last_commit || '-' }}</td>
              </ng-container>
              <ng-container matColumnDef="first_commit">
                <th mat-header-cell *matHeaderCellDef>Commit Pertama</th>
                <td mat-cell *matCellDef="let c">{{ c.first_commit || '-' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="center">Profil</th>
                <td mat-cell *matCellDef="let c" class="center">
                  @if (c.staf_id) {
                    <button mat-icon-button color="primary" [routerLink]="['/staf', c.staf_id]">
                      <mat-icon>person</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;" class="table-row"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .detail { max-width: 1100px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .proj-info { flex: 1; }
    .proj-info h2 { margin: 0; }
    .proj-info p { margin: 4px 0 0; color: #666; font-size: 13px; display: flex; align-items: center; gap: 4px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .sc mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px !important; }
    .si { font-size: 36px; width: 36px; height: 36px; color: #388e3c; }
    .si.people { color: #7b1fa2; }
    .si.calendar { color: #f57c00; }
    .sn { display: block; font-size: 28px; font-weight: 700; line-height: 1; }
    .sl { display: block; font-size: 12px; color: #666; margin-top: 4px; }

    .full-width { width: 100%; }
    .center { text-align: center !important; }
    th { background: #1976d2 !important; color: white !important; font-weight: 600 !important; font-size: 13px !important; }
    td { font-size: 13px; border-bottom: 1px solid #f0f0f0 !important; }
    .table-row:hover { background: #e3f2fd !important; }
    .table-row:nth-child(even) { background: #fafafa; }

    .commit-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .commit-bar { display: inline-block; height: 12px; background: #1976d2; border-radius: 6px; min-width: 4px; }
    .commit-num { font-weight: 700; color: #1976d2; min-width: 24px; }

    .sync-progress { background: #fff8e1; border-left: 4px solid #ff9800; border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; }
    .sync-status { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .sync-text { display: flex; flex-direction: column; }
    .sync-msg { font-size: 14px; color: #555; }
    .sync-elapsed { font-size: 12px; color: #999; }
    .sync-result { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: 16px; border-radius: 4px; border-left: 4px solid #4caf50; background: #f1f8e9; font-size: 14px; }
    .sync-result.error { border-left-color: #f44336; background: #fce4ec; }
    .sync-result mat-icon { color: #4caf50; }
    .sync-result.error mat-icon { color: #f44336; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  data: any = null;
  loading = false;
  syncing = false;
  syncMessage = '';
  syncElapsed = 0;
  syncResult = '';
  syncError = false;
  selectedDays = 30;
  projectId = 0;
  columns = ['rank', 'name', 'commits', 'last_commit', 'first_commit', 'actions'];
  private syncTimer: any;

  constructor(private route: ActivatedRoute, private projectService: ProjectService) {}

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.projectService.getProjectDetail(this.projectId, this.selectedDays).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  sync() {
    this.syncing = true;
    this.syncElapsed = 0;
    this.syncResult = '';
    this.syncError = false;
    this.syncMessage = `Mengambil commits ${this.selectedDays} hari terakhir dari GitLab...`;
    this.syncTimer = setInterval(() => this.syncElapsed++, 1000);
    this.projectService.syncProjectCommits(this.projectId, this.selectedDays).subscribe({
      next: (res) => {
        clearInterval(this.syncTimer);
        this.syncing = false;
        const newCommits = res?.results?.[0]?.new_commits ?? '?';
        this.syncResult = `Selesai: ${newCommits} commit baru disinkronkan (${this.syncElapsed}s)`;
        this.loadData();
        setTimeout(() => this.syncResult = '', 8000);
      },
      error: (err) => {
        clearInterval(this.syncTimer);
        this.syncing = false;
        this.syncError = true;
        this.syncResult = 'Sinkronisasi gagal: ' + (err?.error?.error || 'Terjadi kesalahan');
        setTimeout(() => { this.syncResult = ''; this.syncError = false; }, 8000);
      }
    });
  }

  getBarWidth(commits: number): number {
    if (!this.data?.contributors?.length) return 0;
    const max = Math.max(...this.data.contributors.map((c: any) => c.total_commits));
    return max > 0 ? (commits / max) * 100 : 0;
  }
}
