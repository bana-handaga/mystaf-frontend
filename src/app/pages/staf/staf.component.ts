import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-staf',
  standalone: true,
  imports: [
    RouterLink, MatTableModule, MatSortModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, FormsModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Daftar Staf Programmer</mat-card-title>
        <mat-card-subtitle>Total: {{ totalCount }} staf &nbsp;|&nbsp; Periode: {{ selectedDays }} hari terakhir</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Cari nama / username</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Ketik untuk mencari...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="period-field">
            <mat-label>Periode</mat-label>
            <mat-select [(ngModel)]="selectedDays" (ngModelChange)="loadData()">
              <mat-option [value]="7">7 Hari</mat-option>
              <mat-option [value]="14">14 Hari</mat-option>
              <mat-option [value]="30">30 Hari</mat-option>
              <mat-option [value]="90">90 Hari</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        @if (loading) {
          <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <div class="table-scroll">
          <table mat-table [dataSource]="staffList" matSort (matSortChange)="onSort($event)" class="full-width">
            <ng-container matColumnDef="no">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let s; let i = index">{{ i + 1 }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Nama</th>
              <td mat-cell *matCellDef="let s">{{ s.first_name }} {{ s.last_name }}</td>
            </ng-container>
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="username">Username</th>
              <td mat-cell *matCellDef="let s">{{ s.username }}</td>
            </ng-container>
            <ng-container matColumnDef="gitlab">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="gitlab_username">GitLab</th>
              <td mat-cell *matCellDef="let s">{{ s.gitlab_username || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="email">Email</th>
              <td mat-cell *matCellDef="let s">{{ s.email }}</td>
            </ng-container>
            <ng-container matColumnDef="activity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="activity" class="center">Total Aktivitas</th>
              <td mat-cell *matCellDef="let s" class="center">
                <span class="activity-badge" [class.high]="s.total_activity >= 50" [class.mid]="s.total_activity >= 10 && s.total_activity < 50" [class.low]="s.total_activity < 10">
                  {{ s.total_activity }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="commits">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="commits" class="center">Commits</th>
              <td mat-cell *matCellDef="let s" class="center">{{ s.total_commits }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="center">Aksi</th>
              <td mat-cell *matCellDef="let s" class="center">
                <button mat-icon-button color="primary" [routerLink]="['/staf', s.id]" title="Lihat Detail">
                  <mat-icon>bar_chart</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (staffList.length === 0) {
            <div class="empty">Tidak ada staf ditemukan.</div>
          }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .toolbar { display: flex; gap: 12px; margin: 16px 0 8px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 180px; }
    .period-field { width: 130px; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .full-width { width: 100%; border-radius: 8px; overflow: hidden; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty { text-align: center; padding: 32px; color: #999; }
    .center { text-align: center !important; }

    table { border-collapse: collapse; }
    th { background: #1976d2 !important; color: white !important; font-weight: 600 !important; font-size: 13px !important; }
    th.mat-sort-header-sorted { color: #fff !important; }
    .mat-sort-header-arrow { color: white !important; }
    td { font-size: 13px; color: #333; border-bottom: 1px solid #f0f0f0 !important; }
    .table-row:hover { background: #e3f2fd !important; cursor: pointer; }
    .table-row:nth-child(even) { background: #fafafa; }

    .activity-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-weight: 700; font-size: 13px; }
    .activity-badge.high { background: #e8f5e9; color: #2e7d32; }
    .activity-badge.mid  { background: #fff3e0; color: #e65100; }
    .activity-badge.low  { background: #fce4ec; color: #c62828; }

    mat-card { border-radius: 12px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; }

    @media (max-width: 768px) {
      mat-card { border-radius: 0 !important; margin: 0 -16px; }
      .mat-column-no, .mat-column-email, .mat-column-gitlab { display: none !important; }
      td, th { padding: 8px 10px !important; font-size: 12px !important; }
      .activity-badge { padding: 2px 6px; font-size: 12px; }
    }
  `]
})
export class StafComponent implements OnInit {
  staffList: any[] = [];
  displayedColumns = ['no', 'name', 'username', 'gitlab', 'email', 'activity', 'commits', 'actions'];
  loading = false;
  totalCount = 0;
  searchQuery = '';
  selectedDays = 30;
  private searchTimer: any;
  private sortField = 'activity';
  private sortDir = 'desc';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    let params = new HttpParams()
      .set('days', this.selectedDays)
      .set('order_by', this.sortField)
      .set('order_dir', this.sortDir);
    if (this.searchQuery) params = params.set('search', this.searchQuery);
    this.http.get<any>('https://api.dsti-ums.id/api/auth/staff/', { params }).subscribe({
      next: (data) => {
        this.staffList = data.results ?? data;
        this.totalCount = data.count ?? this.staffList.length;
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
    this.sortField = sort.active || 'activity';
    this.sortDir = sort.direction || 'desc';
    this.loadData();
  }
}
