import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../core/services/comment.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    RouterLink, SlicePipe, MatCardModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatTooltipModule, FormsModule
  ],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Aktivitas Komentar</h2>
          <p class="subtitle">Monitor komentar staf pada Issue GitLab UMS</p>
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
          <button mat-raised-button color="accent" (click)="sync()" [disabled]="syncing">
            <mat-icon>sync</mat-icon> {{ syncing ? 'Sync...' : 'Sync Komentar' }}
          </button>
        </div>
      </div>

      <!-- Stats Overview -->
      @if (!loading && comments.length > 0) {
        <div class="stats-row">
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si">comment</mat-icon>
              <div><span class="sn">{{ totalComments }}</span><span class="sl">Total Komentar</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si people">people</mat-icon>
              <div><span class="sn">{{ uniqueAuthors }}</span><span class="sl">Komentator Unik</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si issue">bug_report</mat-icon>
              <div><span class="sn">{{ uniqueIssues }}</span><span class="sl">Issue Aktif</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="si folder">folder</mat-icon>
              <div><span class="sn">{{ uniqueProjects }}</span><span class="sl">Proyek</span></div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Filters + Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Daftar Komentar</mat-card-title>
          <mat-card-subtitle>{{ totalComments }} komentar dalam {{ filters.days }} hari terakhir</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>

          <!-- Filter bar -->
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="filter-search">
              <mat-label>Cari issue / komentar / username</mat-label>
              <input matInput [(ngModel)]="filters.search" (ngModelChange)="onSearch()" placeholder="Ketik untuk mencari...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-state">
              <mat-label>Status Issue</mat-label>
              <mat-select [(ngModel)]="filters.issue_state" (ngModelChange)="loadData()">
                <mat-option value="">Semua</mat-option>
                <mat-option value="opened">Opened</mat-option>
                <mat-option value="closed">Closed</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-type">
              <mat-label>Tipe</mat-label>
              <mat-select [(ngModel)]="filters.comment_type" (ngModelChange)="loadData()">
                <mat-option value="">Semua</mat-option>
                <mat-option value="issue">Issue</mat-option>
                <mat-option value="commit">Commit</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          @if (loading) {
            <div class="loading-center">
              <mat-spinner></mat-spinner>
              <p>Memuat komentar...</p>
            </div>
          } @else {
            <div class="table-scroll">
            <table mat-table [dataSource]="comments" matSort (matSortChange)="onSort($event)" class="full-width">

              <!-- No -->
              <ng-container matColumnDef="no">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let c; let i = index">{{ i + 1 }}</td>
              </ng-container>

              <!-- Topik / Thread -->
              <ng-container matColumnDef="topic">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="topic">Topik / Thread</th>
                <td mat-cell *matCellDef="let c">
                  <div class="topic-wrap">
                    @if (c.comment_type === 'issue') {
                      <span class="type-badge issue-badge"><mat-icon style="font-size:11px;width:11px;height:11px">bug_report</mat-icon> Issue</span>
                      <span class="issue-num">#{{ c.issue_iid }}</span>
                      <a [href]="c.issue_url" target="_blank" class="issue-title" [matTooltip]="c.issue_title">
                        {{ c.issue_title | slice:0:55 }}{{ c.issue_title?.length > 55 ? '...' : '' }}
                      </a>
                      <span class="state-badge" [class.opened]="c.issue_state === 'opened'" [class.closed]="c.issue_state === 'closed'">
                        {{ c.issue_state }}
                      </span>
                    } @else {
                      <span class="type-badge commit-badge"><mat-icon style="font-size:11px;width:11px;height:11px">commit</mat-icon> Commit</span>
                      <a [href]="c.commit_url" target="_blank" class="issue-title" [matTooltip]="c.commit_message">
                        <code class="commit-sha">{{ c.commit_sha }}</code>
                        {{ c.commit_message | slice:0:45 }}{{ c.commit_message?.length > 45 ? '...' : '' }}
                      </a>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- Proyek -->
              <ng-container matColumnDef="project">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="project">Proyek</th>
                <td mat-cell *matCellDef="let c">
                  <a class="project-link" [routerLink]="['/projects', c.project_id]">
                    <mat-icon style="font-size:13px;width:13px;height:13px;vertical-align:middle">folder</mat-icon>
                    {{ c.project_name }}
                  </a>
                </td>
              </ng-container>

              <!-- Komentator -->
              <ng-container matColumnDef="author">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="author">Komentator</th>
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

              <!-- Isi Komentar -->
              <ng-container matColumnDef="body">
                <th mat-header-cell *matHeaderCellDef>Komentar</th>
                <td mat-cell *matCellDef="let c">
                  <span class="body-preview" [matTooltip]="c.body">
                    {{ c.body | slice:0:80 }}{{ c.body.length > 80 ? '...' : '' }}
                  </span>
                </td>
              </ng-container>

              <!-- Waktu -->
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="created_at">Waktu</th>
                <td mat-cell *matCellDef="let c">
                  <span class="time">{{ c.created_at }}</span>
                </td>
              </ng-container>

              <!-- Aksi -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="center">Aksi</th>
                <td mat-cell *matCellDef="let c" class="center">
                  <a mat-icon-button [href]="c.issue_url" target="_blank" title="Buka Issue di GitLab">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                  @if (c.staf_id) {
                    <button mat-icon-button color="primary" [routerLink]="['/staf', c.staf_id]" title="Profil Staf">
                      <mat-icon>person</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
            </table>

            @if (comments.length === 0) {
              <div class="empty">
                <mat-icon>chat_bubble_outline</mat-icon>
                <h3>Belum ada data komentar</h3>
                <p>Klik "Sync Komentar" untuk mengambil data dari GitLab.</p>
                <button mat-raised-button color="primary" (click)="sync()">
                  <mat-icon>sync</mat-icon> Sync Sekarang
                </button>
              </div>
            }
            </div>
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
    .si { font-size: 32px; width: 32px; height: 32px; color: #7b1fa2; }
    .si.people { color: #1976d2; }
    .si.issue { color: #f57c00; }
    .si.folder { color: #388e3c; }
    .sn { display: block; font-size: 26px; font-weight: 700; line-height: 1; }
    .sl { display: block; font-size: 12px; color: #666; margin-top: 4px; }

    .table-card { border-radius: 12px !important; }
    .filter-bar { display: flex; gap: 12px; margin: 8px 0 12px; flex-wrap: wrap; }
    .filter-search { flex: 1; min-width: 200px; }
    .filter-state { width: 150px; }
    .filter-type { width: 130px; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .full-width { width: 100%; }
    .center { text-align: center !important; }

    th { background: #1a237e !important; color: white !important; font-weight: 600 !important; font-size: 13px !important; }
    .mat-sort-header-arrow { color: white !important; }
    th.mat-sort-header-sorted { color: #fff !important; }
    td { font-size: 13px; border-bottom: 1px solid #f0f0f0 !important; vertical-align: middle; padding: 10px 16px !important; }
    .table-row:hover { background: #ede7f6 !important; cursor: default; }
    .table-row:nth-child(even) { background: #fafafa; }

    .topic-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .issue-num { font-weight: 700; color: #7b1fa2; font-size: 12px; white-space: nowrap; }
    .issue-title { color: #1976d2; text-decoration: none; font-size: 13px; }
    .issue-title:hover { text-decoration: underline; }
    .state-badge { font-size: 10px; padding: 1px 7px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
    .state-badge.opened { background: #e8f5e9; color: #2e7d32; }
    .state-badge.closed { background: #fce4ec; color: #c62828; }
    .type-badge { display: inline-flex; align-items: center; gap: 2px; font-size: 10px; padding: 1px 6px; border-radius: 8px; font-weight: 700; white-space: nowrap; }
    .issue-badge { background: #e3f2fd; color: #1565c0; }
    .commit-badge { background: #f3e5f5; color: #6a1b9a; }
    .commit-sha { font-family: monospace; font-size: 11px; background: #f5f5f5; padding: 1px 4px; border-radius: 3px; margin-right: 4px; color: #555; }

    .project-link { color: #388e3c; text-decoration: none; font-size: 12px; display: flex; align-items: center; gap: 2px; }
    .project-link:hover { text-decoration: underline; }

    .author-wrap { display: flex; align-items: center; gap: 8px; }
    .author-avatar { width: 28px; height: 28px; border-radius: 50%; background: #7b1fa2; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .author-name { font-weight: 500; font-size: 13px; }
    .author-user { font-size: 11px; color: #999; }

    .body-preview { color: #555; font-size: 12px; line-height: 1.4; }
    .time { font-size: 12px; color: #888; white-space: nowrap; }

    .loading-center { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; color: #666; }
    .empty { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #999; gap: 8px; text-align: center; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty h3 { margin: 0; color: #666; }
    .empty p { margin: 0; }

    @media (max-width: 768px) {
      .page { max-width: 100%; }
      .page-title { font-size: 18px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
      .sn { font-size: 20px; }
      .header-actions { width: 100%; justify-content: space-between; }
      .period-field { flex: 1; }
      .filter-state, .filter-type { flex: 1; min-width: 120px; }
      .table-card { border-radius: 0 !important; margin: 0 -16px; }
      .mat-column-no, .mat-column-body, .mat-column-created_at { display: none !important; }
      td, th { padding: 8px 10px !important; font-size: 12px !important; }
      .author-avatar { display: none; }
      .topic-wrap { flex-wrap: nowrap; overflow: hidden; }
      .issue-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; display: inline-block; }
    }
  `]
})
export class CommentsComponent implements OnInit {
  comments: any[] = [];
  private allComments: any[] = [];
  displayedColumns = ['no', 'topic', 'project', 'author', 'body', 'created_at', 'actions'];
  loading = false;
  syncing = false;
  filters = { days: 30, search: '', issue_state: '', comment_type: '' };
  private searchTimer: any;

  get totalComments() { return this.allComments.length; }
  get uniqueAuthors() { return new Set(this.allComments.map(c => c.author_username)).size; }
  get uniqueIssues() { return new Set(this.allComments.map(c => c.project_name + '#' + c.issue_iid)).size; }
  get uniqueProjects() { return new Set(this.allComments.map(c => c.project_id)).size; }

  constructor(private commentService: CommentService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.commentService.getComments(this.filters).subscribe({
      next: (data) => {
        this.allComments = data.results ?? [];
        this.comments = [...this.allComments];
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
      this.comments = [...this.allComments];
      return;
    }
    const dir = sort.direction === 'asc' ? 1 : -1;
    this.comments = [...this.allComments].sort((a, b) => {
      switch (sort.active) {
        case 'topic':
          const at = a.comment_type === 'issue' ? (a.issue_title || '') : (a.commit_message || '');
          const bt = b.comment_type === 'issue' ? (b.issue_title || '') : (b.commit_message || '');
          return at.localeCompare(bt) * dir;
        case 'project': return a.project_name.localeCompare(b.project_name) * dir;
        case 'author':  return a.author_name.localeCompare(b.author_name) * dir;
        case 'created_at': return (a.created_at > b.created_at ? 1 : -1) * dir;
        default: return 0;
      }
    });
  }

  sync() {
    this.syncing = true;
    this.commentService.sync(this.filters.days).subscribe({
      next: () => { this.syncing = false; this.loadData(); },
      error: () => this.syncing = false
    });
  }
}
