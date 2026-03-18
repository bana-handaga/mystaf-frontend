import { Component, OnInit, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';

/* ── Dialog Component ── */
@Component({
  selector: 'app-commit-detail-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDividerModule, RouterLink, MatDialogModule, MatTooltipModule],
  template: `
    <div class="dialog-header">
      <div class="dialog-title-row">
        <mat-icon class="title-icon">commit</mat-icon>
        <span class="dialog-title">Detail Commit</span>
      </div>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-divider></mat-divider>

    <div class="dialog-body">

      <!-- Commit Message (full) -->
      <div class="section">
        <div class="section-label">
          <mat-icon>message</mat-icon> Pesan Commit
        </div>
        <pre class="commit-message">{{ data.message }}</pre>
      </div>

      <mat-divider></mat-divider>

      <!-- Meta info grid -->
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Hash</span>
          <code class="hash-full">{{ data.commit_hash }}</code>
        </div>
        <div class="meta-item">
          <span class="meta-label">Waktu</span>
          <span class="meta-value">{{ data.committed_at }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Author</span>
          <div class="author-wrap">
            <div class="author-avatar">{{ data.author_name.charAt(0).toUpperCase() }}</div>
            <div>
              <div class="author-name">{{ data.author_name }}</div>
              <div class="author-user">&#64;{{ data.author_username }}</div>
            </div>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-label">Proyek</span>
          <a class="project-link" [routerLink]="['/projects', data.project_id]" mat-dialog-close>
            <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle">folder</mat-icon>
            {{ data.project_name }}
          </a>
        </div>
        @if (data.additions > 0 || data.deletions > 0) {
          <div class="meta-item">
            <span class="meta-label">Perubahan</span>
            <span>
              <span class="add">+{{ data.additions }} baris</span>
              &nbsp;
              <span class="del">-{{ data.deletions }} baris</span>
            </span>
          </div>
        }
      </div>
    </div>

    <mat-divider></mat-divider>

    <div class="dialog-actions">
      @if (data.staf_id) {
        <button mat-stroked-button color="primary" [routerLink]="['/staf', data.staf_id]" mat-dialog-close>
          <mat-icon>person</mat-icon> Profil Staf
        </button>
      }
      <a mat-raised-button color="primary"
         [href]="data.project_web_url + '/-/commit/' + data.commit_hash"
         target="_blank">
        <mat-icon>open_in_new</mat-icon> Buka di GitLab
      </a>
    </div>
  `,
  styles: [`
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; }
    .dialog-title-row { display: flex; align-items: center; gap: 8px; }
    .title-icon { color: #1976d2; }
    .dialog-title { font-size: 18px; font-weight: 600; color: #1a237e; }
    .close-btn { color: #999; }

    .dialog-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }

    .section-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .section-label mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .commit-message {
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #222;
      background: #f8f9ff;
      border: 1px solid #e0e4f0;
      border-left: 4px solid #1976d2;
      border-radius: 6px;
      padding: 14px 16px;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }

    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
    .meta-value { font-size: 13px; color: #333; }

    .hash-full { font-family: monospace; font-size: 12px; background: #f0f4ff; color: #1565c0; padding: 3px 8px; border-radius: 4px; word-break: break-all; }

    .author-wrap { display: flex; align-items: center; gap: 8px; }
    .author-avatar { width: 28px; height: 28px; border-radius: 50%; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .author-name { font-weight: 500; font-size: 13px; }
    .author-user { font-size: 11px; color: #999; }

    .project-link { color: #388e3c; text-decoration: none; font-size: 13px; display: flex; align-items: center; gap: 4px; }
    .project-link:hover { text-decoration: underline; }

    .add { color: #2e7d32; font-weight: 600; font-size: 13px; }
    .del { color: #c62828; font-weight: 600; font-size: 13px; }

    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; }

    @media (max-width: 480px) {
      .meta-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CommitDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}

/* ── Main Component ── */
@Component({
  selector: 'app-commit-messages',
  standalone: true,
  imports: [
    RouterLink, SlicePipe, MatCardModule, MatTableModule, MatSortModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule, MatDialogModule, FormsModule
  ],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Commit Messages</h2>
          <p class="subtitle">Daftar commit staf beserta pesan commit di GitLab UMS</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-field">
            <mat-label>Periode</mat-label>
            <mat-select [(ngModel)]="filters.days" (ngModelChange)="loadData()">
              <mat-option [value]="7">7 Hari</mat-option>
              <mat-option [value]="14">14 Hari</mat-option>
              <mat-option [value]="30">30 Hari</mat-option>
              <mat-option [value]="90">90 Hari</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Stats -->
      @if (!loading && commits.length > 0) {
        <div class="stats-row">
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si commit">commit</mat-icon>
              <div><span class="sn">{{ commits.length }}</span><span class="sl">Total Commits</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si people">people</mat-icon>
              <div><span class="sn">{{ uniqueAuthors }}</span><span class="sl">Staf Aktif</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si folder">folder</mat-icon>
              <div><span class="sn">{{ uniqueProjects }}</span><span class="sl">Proyek</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si additions">add_circle</mat-icon>
              <div><span class="sn">{{ totalAdditions }}</span><span class="sl">Baris Ditambah</span></div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Filter + Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Daftar Commit</mat-card-title>
          <mat-card-subtitle>{{ commits.length }} commit dalam {{ filters.days }} hari terakhir &nbsp;·&nbsp; klik baris untuk detail</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="filter-search">
              <mat-label>Cari pesan / nama / username</mat-label>
              <input matInput [(ngModel)]="filters.search" (ngModelChange)="onSearch()" placeholder="Ketik untuk mencari...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          @if (loading) {
            <div class="loading-center">
              <mat-spinner></mat-spinner>
              <p>Memuat data commit...</p>
            </div>
          } @else {
            <div class="table-scroll">
            <table mat-table [dataSource]="commits" matSort (matSortChange)="onSort($event)" class="full-width">

              <ng-container matColumnDef="no">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let c; let i = index">{{ i + 1 }}</td>
              </ng-container>

              <ng-container matColumnDef="hash">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="hash">Hash</th>
                <td mat-cell *matCellDef="let c">
                  <code class="hash-code">{{ c.commit_hash }}</code>
                </td>
              </ng-container>

              <ng-container matColumnDef="author">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="author">Author</th>
                <td mat-cell *matCellDef="let c">
                  <div class="author-wrap">
                    <div class="author-avatar">{{ c.author_name.charAt(0).toUpperCase() }}</div>
                    <div>
                      <div class="author-name">{{ c.author_name }}</div>
                      <div class="author-user">&#64;{{ c.author_username }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="message">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="message">Pesan Commit</th>
                <td mat-cell *matCellDef="let c">
                  <span class="msg-preview">
                    {{ c.message | slice:0:90 }}{{ c.message?.length > 90 ? '...' : '' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="project">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="project">Proyek</th>
                <td mat-cell *matCellDef="let c">
                  <span class="project-name">
                    <mat-icon style="font-size:13px;width:13px;height:13px;vertical-align:middle">folder</mat-icon>
                    {{ c.project_name }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="diff">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="diff" class="center">+/-</th>
                <td mat-cell *matCellDef="let c" class="center">
                  @if (c.additions > 0 || c.deletions > 0) {
                    <span class="add">+{{ c.additions }}</span>
                    <span class="del"> -{{ c.deletions }}</span>
                  } @else {
                    <span class="na">-</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="committed_at">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="committed_at">Waktu</th>
                <td mat-cell *matCellDef="let c">
                  <span class="time">{{ c.committed_at }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  class="table-row" (click)="openDetail(row)"></tr>
            </table>
            </div>

            @if (commits.length === 0) {
              <div class="empty">
                <mat-icon>commit</mat-icon>
                <h3>Belum ada data commit</h3>
                <p>Pastikan proyek sudah di-sync di menu Proyek / Apps.</p>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .period-field { width: 130px; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px !important; }
    .si { font-size: 32px; width: 32px; height: 32px; color: #1976d2; }
    .si.people { color: #7b1fa2; }
    .si.folder { color: #388e3c; }
    .si.additions { color: #2e7d32; }
    .sn { display: block; font-size: 26px; font-weight: 700; line-height: 1; }
    .sl { display: block; font-size: 12px; color: #666; margin-top: 4px; }

    .table-card { border-radius: 12px !important; }
    .filter-bar { margin: 8px 0 12px; }
    .filter-search { width: 100%; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .full-width { width: 100%; }
    .center { text-align: center !important; }

    th { background: #1976d2 !important; color: white !important; font-weight: 600 !important; font-size: 13px !important; }
    th.mat-sort-header-sorted { color: #fff !important; }
    .mat-sort-header-arrow { color: white !important; }
    td { font-size: 13px; border-bottom: 1px solid #f0f0f0 !important; vertical-align: middle; padding: 10px 16px !important; }
    .table-row { cursor: pointer; }
    .table-row:hover { background: #e3f2fd !important; }
    .table-row:nth-child(even) { background: #fafafa; }
    .table-row:nth-child(even):hover { background: #e3f2fd !important; }

    .hash-code { font-family: monospace; font-size: 12px; background: #f0f4ff; color: #1565c0; padding: 2px 6px; border-radius: 4px; }

    .author-wrap { display: flex; align-items: center; gap: 8px; }
    .author-avatar { width: 28px; height: 28px; border-radius: 50%; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .author-name { font-weight: 500; font-size: 13px; white-space: nowrap; }
    .author-user { font-size: 11px; color: #999; }

    .msg-preview { color: #333; font-size: 13px; line-height: 1.4; }
    .project-name { color: #388e3c; font-size: 12px; display: flex; align-items: center; gap: 2px; }

    .add { color: #2e7d32; font-weight: 600; font-size: 12px; }
    .del { color: #c62828; font-weight: 600; font-size: 12px; }
    .na { color: #bbb; font-size: 12px; }
    .time { font-size: 12px; color: #888; white-space: nowrap; }

    .loading-center { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; color: #666; }
    .empty { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #999; gap: 8px; text-align: center; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty h3 { margin: 0; color: #666; }
    .empty p { margin: 0; }

    @media (max-width: 768px) {
      .page { max-width: 100%; }
      .page-title { font-size: 18px; }
      .header-actions { width: 100%; }
      .period-field { flex: 1; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
      .sn { font-size: 20px; }
      .table-card { border-radius: 0 !important; margin: 0 -16px; }
      .mat-column-no, .mat-column-hash, .mat-column-diff, .mat-column-committed_at { display: none !important; }
      td, th { padding: 8px 10px !important; font-size: 12px !important; }
      .author-avatar { display: none; }
    }
  `]
})
export class CommitMessagesComponent implements OnInit {
  commits: any[] = [];
  private allCommits: any[] = [];
  displayedColumns = ['no', 'hash', 'author', 'message', 'project', 'diff', 'committed_at'];
  loading = false;
  filters = { days: 30, search: '' };
  private searchTimer: any;

  get uniqueAuthors() { return new Set(this.allCommits.map(c => c.author_username)).size; }
  get uniqueProjects() { return new Set(this.allCommits.map(c => c.project_id)).size; }
  get totalAdditions() { return this.allCommits.reduce((s, c) => s + (c.additions || 0), 0); }

  constructor(private projectService: ProjectService, private dialog: MatDialog) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.projectService.getCommits(this.filters).subscribe({
      next: (data) => {
        this.allCommits = data.results ?? [];
        this.commits = [...this.allCommits];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadData(), 400);
  }

  onSort(sort: Sort) {
    if (!sort.active || !sort.direction) {
      this.commits = [...this.allCommits];
      return;
    }
    const dir = sort.direction === 'asc' ? 1 : -1;
    this.commits = [...this.allCommits].sort((a, b) => {
      switch (sort.active) {
        case 'hash':         return a.commit_hash.localeCompare(b.commit_hash) * dir;
        case 'author':       return a.author_name.localeCompare(b.author_name) * dir;
        case 'message':      return (a.message || '').localeCompare(b.message || '') * dir;
        case 'project':      return a.project_name.localeCompare(b.project_name) * dir;
        case 'diff':         return ((a.additions + a.deletions) - (b.additions + b.deletions)) * dir;
        case 'committed_at': return (a.committed_at > b.committed_at ? 1 : -1) * dir;
        default: return 0;
      }
    });
  }

  openDetail(commit: any) {
    this.dialog.open(CommitDetailDialogComponent, {
      data: commit,
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
  }
}
