import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';

const CAT_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  fix:      { label: 'Bug Fix',    icon: 'bug_report',      color: '#c62828', bg: '#fce4ec' },
  feature:  { label: 'Fitur',      icon: 'add_circle',      color: '#1565c0', bg: '#e3f2fd' },
  refactor: { label: 'Refactor',   icon: 'autorenew',       color: '#6a1b9a', bg: '#f3e5f5' },
  docs:     { label: 'Docs',       icon: 'description',     color: '#00695c', bg: '#e0f2f1' },
  config:   { label: 'Config',     icon: 'settings',        color: '#e65100', bg: '#fff3e0' },
  test:     { label: 'Testing',    icon: 'science',         color: '#2e7d32', bg: '#e8f5e9' },
  remove:   { label: 'Hapus',      icon: 'delete_outline',  color: '#b71c1c', bg: '#ffebee' },
  merge:    { label: 'Merge',      icon: 'merge',           color: '#0277bd', bg: '#e1f5fe' },
  other:    { label: 'Lainnya',    icon: 'more_horiz',      color: '#757575', bg: '#f5f5f5' },
};

const CAT_KEYS = ['fix', 'feature', 'refactor', 'docs', 'config', 'test', 'remove', 'merge', 'other'];

@Component({
  selector: 'app-commit-analysis',
  standalone: true,
  imports: [
    RouterLink, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule,
    MatTableModule, MatTooltipModule, MatExpansionModule, FormsModule
  ],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Commit Analisis</h2>
          <p class="subtitle">Klasifikasi aktivitas staf berdasarkan pesan commit GitLab</p>
        </div>
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
        <div class="loading-center"><mat-spinner></mat-spinner><p>Menganalisis commit...</p></div>
      }

      @if (!loading && data) {

        <!-- Category Legend + Distribution -->
        <mat-card class="dist-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>pie_chart</mat-icon> Distribusi Aktivitas
            </mat-card-title>
            <mat-card-subtitle>{{ data.total_commits }} commit dianalisis selama {{ selectedDays }} hari terakhir</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="cat-grid">
              @for (cat of catKeys; track cat) {
                <div class="cat-item" [matTooltip]="catMeta[cat].label + ': ' + (data.category_totals[cat] || 0) + ' commit'">
                  <div class="cat-icon-wrap" [style.background]="catMeta[cat].bg">
                    <mat-icon [style.color]="catMeta[cat].color">{{ catMeta[cat].icon }}</mat-icon>
                  </div>
                  <div class="cat-info">
                    <span class="cat-label">{{ catMeta[cat].label }}</span>
                    <span class="cat-count" [style.color]="catMeta[cat].color">{{ data.category_totals[cat] || 0 }}</span>
                  </div>
                  <div class="cat-bar-wrap">
                    <div class="cat-bar"
                         [style.width.%]="pct(data.category_totals[cat])"
                         [style.background]="catMeta[cat].color">
                    </div>
                  </div>
                  <span class="cat-pct">{{ pct(data.category_totals[cat]) | number:'1.0-0' }}%</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Per-staf analysis -->
        <div class="section-title">
          <mat-icon>people</mat-icon> Analisis Per Staf
        </div>

        <mat-accordion class="staf-accordion">
          @for (staf of data.by_staf; track staf.staf_username) {
            <mat-expansion-panel class="staf-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <div class="panel-title-inner">
                    <div class="avatar" [style.background]="dominantColor(staf)">
                      {{ staf.staf_name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="staf-name">{{ staf.staf_name }}</div>
                      <div class="staf-user">&#64;{{ staf.staf_username }}</div>
                    </div>
                  </div>
                </mat-panel-title>
                <mat-panel-description>
                  <div class="panel-desc">
                    <span class="total-badge">{{ staf.total }} commit</span>
                    <span class="projects-badge">{{ staf.projects }} proyek</span>
                    <span class="dominant-badge"
                          [style.background]="catMeta[dominant(staf)].bg"
                          [style.color]="catMeta[dominant(staf)].color">
                      <mat-icon style="font-size:12px;width:12px;height:12px">{{ catMeta[dominant(staf)].icon }}</mat-icon>
                      {{ catMeta[dominant(staf)].label }}
                    </span>
                  </div>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <!-- Staf category bar chart -->
              <div class="staf-detail">
                <div class="staf-bars">
                  @for (cat of catKeys; track cat) {
                    @if (staf.categories[cat] > 0) {
                      <div class="sbar-row">
                        <div class="sbar-label">
                          <mat-icon style="font-size:14px;width:14px;height:14px" [style.color]="catMeta[cat].color">{{ catMeta[cat].icon }}</mat-icon>
                          <span>{{ catMeta[cat].label }}</span>
                        </div>
                        <div class="sbar-track">
                          <div class="sbar-fill"
                               [style.width.%]="stafPct(staf, cat)"
                               [style.background]="catMeta[cat].color">
                          </div>
                        </div>
                        <span class="sbar-val">{{ staf.categories[cat] }}</span>
                        <span class="sbar-pct">{{ stafPct(staf, cat) | number:'1.0-0' }}%</span>
                      </div>
                    }
                  }
                </div>

                <!-- Projects breakdown -->
                <div class="proj-title">Proyek yang terlibat:</div>
                <div class="proj-list">
                  @for (proj of projectsOf(staf.staf_username); track proj.project_id) {
                    <div class="proj-item">
                      <a class="proj-link" [routerLink]="['/projects', proj.project_id]">
                        <mat-icon style="font-size:13px;width:13px;height:13px">folder</mat-icon>
                        {{ proj.project_name }}
                      </a>
                      <span class="proj-commits">{{ proj.total }} commit</span>
                      <span class="proj-dominant"
                            [style.background]="catMeta[proj.dominant].bg"
                            [style.color]="catMeta[proj.dominant].color">
                        {{ catMeta[proj.dominant].label }}
                      </span>
                    </div>
                  }
                </div>

                @if (staf.staf_id) {
                  <div style="margin-top:12px">
                    <button mat-stroked-button color="primary" [routerLink]="['/staf', staf.staf_id]">
                      <mat-icon>bar_chart</mat-icon> Lihat Detail Staf
                    </button>
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        @if (data.by_staf.length === 0) {
          <div class="empty">
            <mat-icon>analytics</mat-icon>
            <h3>Belum ada data commit untuk dianalisis</h3>
            <p>Pastikan proyek sudah di-sync di menu Proyek / Apps.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .period-field { width: 130px; }
    .loading-center { display: flex; flex-direction: column; align-items: center; padding: 64px; gap: 16px; color: #666; }

    /* Category distribution */
    .dist-card { border-radius: 12px !important; margin-bottom: 24px; }
    .dist-card mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 16px; }
    .cat-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .cat-item { display: grid; grid-template-columns: 48px 110px 1fr 40px; align-items: center; gap: 12px; }
    .cat-icon-wrap { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .cat-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .cat-info { display: flex; flex-direction: column; }
    .cat-label { font-size: 13px; font-weight: 500; color: #333; }
    .cat-count { font-size: 18px; font-weight: 700; line-height: 1; }
    .cat-bar-wrap { height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; }
    .cat-bar { height: 100%; border-radius: 5px; transition: width 0.4s ease; }
    .cat-pct { font-size: 12px; color: #888; text-align: right; white-space: nowrap; }

    /* Section title */
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 500; margin-bottom: 16px; color: #333; }

    /* Accordion */
    .staf-accordion { display: flex; flex-direction: column; gap: 8px; }
    .staf-panel { border-radius: 10px !important; box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; }
    .panel-title-inner { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
    .staf-name { font-weight: 600; font-size: 14px; }
    .staf-user { font-size: 11px; color: #999; }

    .panel-desc { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .total-badge { font-size: 12px; font-weight: 700; color: #1976d2; background: #e3f2fd; padding: 2px 8px; border-radius: 10px; }
    .projects-badge { font-size: 12px; color: #666; background: #f5f5f5; padding: 2px 8px; border-radius: 10px; }
    .dominant-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

    /* Staf detail inside panel */
    .staf-detail { padding: 8px 0 4px; }
    .staf-bars { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .sbar-row { display: grid; grid-template-columns: 120px 1fr 32px 40px; align-items: center; gap: 10px; }
    .sbar-label { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #555; }
    .sbar-track { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .sbar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .sbar-val { font-size: 12px; font-weight: 700; color: #333; text-align: right; }
    .sbar-pct { font-size: 11px; color: #999; text-align: right; }

    .proj-title { font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .proj-list { display: flex; flex-direction: column; gap: 6px; }
    .proj-item { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: #fafafa; border-radius: 8px; flex-wrap: wrap; }
    .proj-link { display: flex; align-items: center; gap: 4px; color: #388e3c; text-decoration: none; font-size: 13px; font-weight: 500; flex: 1; }
    .proj-link:hover { text-decoration: underline; }
    .proj-commits { font-size: 12px; color: #666; white-space: nowrap; }
    .proj-dominant { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 8px; white-space: nowrap; }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 64px; color: #999; gap: 8px; text-align: center; }
    .empty mat-icon { font-size: 64px; width: 64px; height: 64px; }
    .empty h3 { margin: 0; color: #666; }
    .empty p { margin: 0; }

    @media (max-width: 768px) {
      .page { max-width: 100%; }
      .page-title { font-size: 18px; }
      .cat-item { grid-template-columns: 40px 90px 1fr 36px; gap: 8px; }
      .cat-count { font-size: 15px; }
      .sbar-row { grid-template-columns: 90px 1fr 28px 34px; gap: 6px; }
      .panel-desc { display: none; }
    }
  `]
})
export class CommitAnalysisComponent implements OnInit {
  data: any = null;
  loading = false;
  selectedDays = 30;
  catKeys = CAT_KEYS;
  catMeta = CAT_META;

  constructor(private projectService: ProjectService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.projectService.getCommitAnalysis({ days: this.selectedDays }).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  pct(count: number): number {
    if (!this.data?.total_commits) return 0;
    return Math.round((count / this.data.total_commits) * 100);
  }

  stafPct(staf: any, cat: string): number {
    if (!staf.total) return 0;
    return Math.round((staf.categories[cat] / staf.total) * 100);
  }

  dominant(staf: any): string {
    return CAT_KEYS.reduce((a, b) => staf.categories[a] >= staf.categories[b] ? a : b);
  }

  dominantColor(staf: any): string {
    return CAT_META[this.dominant(staf)].color;
  }

  projectsOf(username: string): any[] {
    return (this.data?.by_staf_project ?? []).filter((p: any) => p.staf_username === username);
  }
}
