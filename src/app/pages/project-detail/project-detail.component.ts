import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule, MatTableModule, MatSelectModule, FormsModule
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

        @if (syncing) {
          <mat-progress-bar mode="indeterminate" color="accent" style="margin-bottom:12px;border-radius:4px"></mat-progress-bar>
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
            <div class="table-scroll">
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
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }

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

    @media (max-width: 768px) {
      .detail { max-width: 100%; }
      .page-header { gap: 10px; margin-bottom: 16px; }
      .header-actions { width: 100%; justify-content: flex-end; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
      .sn { font-size: 20px; }
      td, th { padding: 8px 10px !important; font-size: 12px !important; }
      .mat-column-rank, .mat-column-first_commit, .mat-column-last_commit { display: none !important; }
      .commit-bar { display: none; }
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    .sync-banner { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1565c0; color: #fff; padding: 12px 24px; border-radius: 6px; display: flex; align-items: center; gap: 10px; z-index: 99999; box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-size: 14px; white-space: nowrap; }
    .sync-banner.success { background: #2e7d32; }
    .sync-banner.fail { background: #c62828; }
    @keyframes spin2 { to { transform: rotate(360deg); } }
    .sync-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin2 0.8s linear infinite; flex-shrink: 0; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  data: any = null;
  loading = false;
  syncing = false;
  syncMsg = '';
  syncDone = false;
  syncFail = false;
  selectedDays = 30;
  projectId = 0;
  columns = ['rank', 'name', 'commits', 'last_commit', 'first_commit', 'actions'];

  constructor(private route: ActivatedRoute, private projectService: ProjectService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) {}

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
    this.syncDone = false;
    this.syncFail = false;
    this.syncMsg = 'Menyinkronkan commits dari GitLab...';
    this.cdr.detectChanges();
    this.projectService.syncProjectCommits(this.projectId, this.selectedDays).subscribe({
      next: (res) => {
        this.syncing = false;
        this.syncDone = true;
        const newCommits = res?.results?.[0]?.new_commits ?? '?';
        this.syncMsg = `Selesai: ${newCommits} commit baru disinkronkan`;
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

  getBarWidth(commits: number): number {
    if (!this.data?.contributors?.length) return 0;
    const max = Math.max(...this.data.contributors.map((c: any) => c.total_commits));
    return max > 0 ? (commits / max) * 100 : 0;
  }
}
