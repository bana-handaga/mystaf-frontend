import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-laporan',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSelectModule, MatChipsModule,
    MatExpansionModule, FormsModule
  ],
  template: `
    <!-- Print header (visible only when printing) -->
    <div class="print-header">
      <h1>Laporan Aktivitas Staf Programmer</h1>
      <p>Periode {{ selectedDays }} hari terakhir &nbsp;|&nbsp; Dicetak: {{ printDate }}</p>
    </div>

    <!-- Screen controls (hidden on print) -->
    <div class="screen-only">
      <div class="page-header">
        <div>
          <h2 class="page-title">Laporan untuk Pimpinan</h2>
          <p class="subtitle">Ringkasan aktivitas staf programmer berdasarkan analisis commit dan aktivitas GitLab</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-field">
            <mat-label>Periode</mat-label>
            <mat-select [(ngModel)]="selectedDays" (ngModelChange)="loadReport()">
              <mat-option [value]="7">7 Hari</mat-option>
              <mat-option [value]="14">14 Hari</mat-option>
              <mat-option [value]="30">30 Hari</mat-option>
              <mat-option [value]="90">90 Hari</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="print()" [disabled]="loading">
            <mat-icon>print</mat-icon> Cetak / PDF
          </button>
        </div>
      </div>
    </div>

    @if (loading) {
      <div class="loading-center">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Menganalisis data aktivitas...</p>
      </div>
    }

    @if (report && !loading) {

      <!-- Team Summary Card -->
      <mat-card class="summary-card">
        <mat-card-content>
          <div class="summary-grid">
            <div class="summary-item">
              <mat-icon class="si blue">people</mat-icon>
              <span class="sv">{{ report.total_staff }}</span>
              <span class="sl">Total Staf</span>
            </div>
            <div class="summary-item">
              <mat-icon class="si green">person_check</mat-icon>
              <span class="sv">{{ report.active_staff }}</span>
              <span class="sl">Staf Aktif</span>
            </div>
            <div class="summary-item">
              <mat-icon class="si orange">commit</mat-icon>
              <span class="sv">{{ report.total_commits }}</span>
              <span class="sl">Total Commit</span>
            </div>
            <div class="summary-item">
              <mat-icon class="si purple">trending_up</mat-icon>
              <span class="sv">{{ report.days }} Hari</span>
              <span class="sl">Periode Analisis</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Team Topics & Keywords -->
      <div class="two-col">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title><mat-icon>category</mat-icon> Topik Teknis Tim</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (report.team_topics.length === 0) {
              <p class="no-data">Belum ada data.</p>
            } @else {
              <div class="topic-list">
                @for (t of report.team_topics; track t.topic) {
                  <div class="topic-row">
                    <span class="topic-name">{{ t.topic }}</span>
                    <div class="topic-bar-wrap">
                      <div class="topic-bar" [style.width.%]="getTopicWidth(t.hits, report.team_topics)"></div>
                    </div>
                    <span class="topic-hits">{{ t.hits }}</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title><mat-icon>label</mat-icon> Kata Kunci Populer</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (report.team_keywords.length === 0) {
              <p class="no-data">Belum ada data.</p>
            } @else {
              <div class="keyword-cloud">
                @for (kw of report.team_keywords; track kw.word) {
                  <span class="kw-chip" [style.font-size.px]="getKwSize(kw.count, report.team_keywords)">
                    {{ kw.word }}
                    <span class="kw-count">{{ kw.count }}</span>
                  </span>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Per-staff reports -->
      <h3 class="section-title">Detail Aktivitas per Staf</h3>

      @for (staf of report.staff_reports; track staf.staf_id) {
        <mat-card class="staf-card" [class.inactive]="staf.total_activity === 0">

          <!-- Staff header (always visible) -->
          <div class="staf-header">
            <div class="avatar" [class.inactive-av]="staf.total_activity === 0">
              {{ staf.staf_name.charAt(0).toUpperCase() }}
            </div>
            <div class="staf-meta">
              <div class="staf-name">{{ staf.staf_name }}</div>
              <div class="staf-sub">{{ staf.gitlab_username || staf.staf_username }}</div>
            </div>
            <div class="staf-stats">
              <span class="badge blue">{{ staf.total_commits }} commit</span>
              @if (staf.total_push) { <span class="badge teal">{{ staf.total_push }} push</span> }
              @if (staf.total_mr) { <span class="badge green">{{ staf.total_mr }} MR</span> }
              @if (staf.total_issues) { <span class="badge orange">{{ staf.total_issues }} issue</span> }
              @if (staf.total_activity === 0) { <span class="badge grey">Tidak Ada Aktivitas</span> }
            </div>
          </div>

          @if (staf.total_activity > 0) {
            <!-- Narrative -->
            <div class="narrative">{{ staf.narrative }}</div>

            <div class="staf-body">
              <!-- Activity breakdown -->
              @if (staf.category_breakdown.length > 0) {
                <div class="breakdown">
                  <div class="breakdown-title">Jenis Aktivitas</div>
                  @for (cat of staf.category_breakdown; track cat.category) {
                    <div class="cat-row">
                      <span class="cat-label">{{ cat.label }}</span>
                      <span class="cat-count">{{ cat.count }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Topics -->
              @if (staf.topics.length > 0) {
                <div class="topics-section">
                  <div class="breakdown-title">Bidang Teknis</div>
                  <div class="topic-chips">
                    @for (t of staf.topics.slice(0,5); track t.topic) {
                      <span class="topic-chip">{{ t.topic }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Projects -->
              @if (staf.projects.length > 0) {
                <div class="projects-section">
                  <div class="breakdown-title">Proyek Terlibat</div>
                  <div class="proj-chips">
                    @for (p of staf.projects; track p) {
                      <span class="proj-chip">{{ p }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </mat-card>
      }

      <!-- Print footer -->
      <div class="print-footer">
        <p>Laporan dibuat otomatis oleh sistem MyStaf &mdash; {{ printDate }}</p>
      </div>
    }
  `,
  styles: [`
    /* ── Layout ── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-title { margin: 0; font-size: 22px; font-weight: 500; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 13px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .period-field { width: 130px; }
    .loading-center { display: flex; flex-direction: column; align-items: center; padding: 64px; gap: 16px; color: #666; }
    .section-title { margin: 24px 0 12px; font-size: 16px; font-weight: 600; color: #333; }

    /* ── Summary card ── */
    .summary-card { margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 8px 0; }
    .summary-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .si { font-size: 32px; width: 32px; height: 32px; }
    .si.blue { color: #1976d2; }
    .si.green { color: #388e3c; }
    .si.orange { color: #f57c00; }
    .si.purple { color: #7b1fa2; }
    .sv { font-size: 26px; font-weight: 700; line-height: 1; }
    .sl { font-size: 11px; color: #888; }

    /* ── Two-column ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-card mat-card-title { font-size: 14px; display: flex; align-items: center; gap: 6px; }
    .info-card mat-card-title mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .no-data { color: #aaa; font-style: italic; font-size: 13px; padding: 8px 0; }

    /* ── Topic bar ── */
    .topic-list { display: flex; flex-direction: column; gap: 6px; }
    .topic-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .topic-name { min-width: 140px; color: #333; }
    .topic-bar-wrap { flex: 1; background: #e3f2fd; border-radius: 4px; height: 10px; overflow: hidden; }
    .topic-bar { height: 10px; background: #1976d2; border-radius: 4px; }
    .topic-hits { min-width: 24px; text-align: right; color: #555; font-weight: 600; }

    /* ── Keyword cloud ── */
    .keyword-cloud { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; }
    .kw-chip { background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
    .kw-count { font-size: 10px; opacity: 0.7; margin-left: 3px; }

    /* ── Staff card ── */
    .staf-card { margin-bottom: 16px; }
    .staf-card.inactive { opacity: 0.6; }
    .staf-header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px; flex-wrap: wrap; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
    .avatar.inactive-av { background: #bdbdbd; }
    .staf-meta { flex: 1; min-width: 120px; }
    .staf-name { font-weight: 600; font-size: 15px; }
    .staf-sub { font-size: 12px; color: #888; }
    .staf-stats { display: flex; flex-wrap: wrap; gap: 6px; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge.blue { background: #e3f2fd; color: #1565c0; }
    .badge.teal { background: #e0f7fa; color: #006064; }
    .badge.green { background: #e8f5e9; color: #2e7d32; }
    .badge.orange { background: #fff3e0; color: #e65100; }
    .badge.grey { background: #f5f5f5; color: #9e9e9e; }

    .narrative { padding: 0 16px 12px; font-size: 14px; line-height: 1.7; color: #444; background: #f9fbe7; border-left: 3px solid #aed581; margin: 0 16px 12px; border-radius: 4px; padding: 10px 14px; }

    .staf-body { display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; padding: 0 16px 16px; }
    .breakdown, .topics-section, .projects-section { }
    .breakdown-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .cat-row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; padding: 1px 0; }
    .cat-label { color: #444; }
    .cat-count { font-weight: 700; color: #1976d2; min-width: 24px; text-align: right; }
    .topic-chips, .proj-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .topic-chip { background: #ede7f6; color: #4527a0; font-size: 12px; padding: 3px 8px; border-radius: 10px; }
    .proj-chip { background: #e3f2fd; color: #0d47a1; font-size: 12px; padding: 3px 8px; border-radius: 10px; }

    /* ── Print ── */
    .print-header { display: none; }
    .print-footer { display: none; }

    @media print {
      .screen-only { display: none !important; }
      .print-header { display: block; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      .print-header h1 { margin: 0; font-size: 18px; }
      .print-header p { margin: 4px 0 0; color: #555; }
      .print-footer { display: block; text-align: center; margin-top: 24px; color: #888; font-size: 12px; }
      .two-col { grid-template-columns: 1fr 1fr; }
      .summary-grid { grid-template-columns: repeat(4, 1fr); }
      .staf-card { page-break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd; }
      mat-expansion-panel-header { display: none; }
    }

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .two-col { grid-template-columns: 1fr; }
      .staf-body { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 8px; }
      .header-actions { width: 100%; justify-content: space-between; }
    }
  `]
})
export class LaporanComponent implements OnInit {
  report: any = null;
  loading = false;
  selectedDays = 30;
  printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadReport(); }

  loadReport() {
    this.loading = true;
    this.report = null;
    const params = new HttpParams().set('days', this.selectedDays);
    this.http.get<any>(`${environment.apiBase}/api/gitlab/reports/`, { params }).subscribe({
      next: (data) => { this.report = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  print() {
    this.printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    window.print();
  }

  getTopicWidth(hits: number, topics: any[]): number {
    const max = Math.max(...topics.map(t => t.hits), 1);
    return (hits / max) * 100;
  }

  getKwSize(count: number, keywords: any[]): number {
    const max = Math.max(...keywords.map(k => k.count), 1);
    return 11 + Math.round((count / max) * 8);
  }
}
