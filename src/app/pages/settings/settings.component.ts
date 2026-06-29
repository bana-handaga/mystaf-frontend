import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';

interface GitLabConfig {
  id: number;
  url: string;
  token_masked: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiagnosticResult {
  status: 'ok' | 'error';
  gitlab_url?: string;
  gitlab_version?: any;
  project_count_db?: number;
  commit_count_db?: number;
  message?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="settings-page">
      <h2 class="page-title">Pengaturan</h2>

      <!-- Kartu Konfigurasi GitLab -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-icon">settings_ethernet</mat-icon>
          <mat-card-title>Konfigurasi GitLab</mat-card-title>
          <mat-card-subtitle>URL server dan Personal Access Token untuk sinkronisasi data</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (loadError) {
            <div class="alert alert-error">
              <mat-icon>error_outline</mat-icon>
              <span>{{ loadError }}</span>
            </div>
          }

          @if (loading) {
            <div class="center-spin"><mat-spinner diameter="36"></mat-spinner></div>
          }

          @if (!loading && !loadError) {
            <div class="current-info">
              <div class="info-row">
                <mat-icon class="info-icon">link</mat-icon>
                <div>
                  <div class="info-label">URL GitLab Saat Ini</div>
                  <div class="info-value">{{ config?.url || '-' }}</div>
                </div>
              </div>
              <div class="info-row">
                <mat-icon class="info-icon">vpn_key</mat-icon>
                <div>
                  <div class="info-label">Token Saat Ini</div>
                  <div class="info-value mono">{{ config?.token_masked || '-' }}</div>
                </div>
              </div>
              @if (config?.updated_at) {
                <div class="info-row">
                  <mat-icon class="info-icon">update</mat-icon>
                  <div>
                    <div class="info-label">Terakhir Diperbarui</div>
                    <div class="info-value">{{ config!.updated_at | date:'d MMM y, HH:mm' : undefined : 'id' }}</div>
                  </div>
                </div>
              }
            </div>

            <mat-divider class="divider"></mat-divider>

            <h3 class="form-title">Perbarui Konfigurasi</h3>

            <div class="form-fields">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>GitLab URL</mat-label>
                <mat-icon matPrefix>link</mat-icon>
                <input matInput [(ngModel)]="form.url" placeholder="https://gitlab.ums.ac.id" />
                <mat-hint>Kosongkan jika tidak ingin mengubah URL</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Personal Access Token Baru</mat-label>
                <mat-icon matPrefix>vpn_key</mat-icon>
                <input matInput [(ngModel)]="form.token"
                  [type]="showToken ? 'text' : 'password'"
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx" />
                <button matSuffix mat-icon-button type="button" (click)="showToken = !showToken">
                  <mat-icon>{{ showToken ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>Kosongkan jika tidak ingin mengubah token</mat-hint>
              </mat-form-field>
            </div>

            @if (saveError) {
              <div class="alert alert-error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ saveError }}</span>
              </div>
            }
            @if (saveSuccess) {
              <div class="alert alert-success">
                <mat-icon>check_circle_outline</mat-icon>
                <span>Konfigurasi berhasil disimpan.</span>
              </div>
            }
          }
        </mat-card-content>

        @if (!loading && !loadError) {
          <mat-card-actions align="end">
            <button mat-stroked-button (click)="loadConfig()" [disabled]="saving">
              <mat-icon>refresh</mat-icon> Muat Ulang
            </button>
            <button mat-raised-button color="primary" (click)="save()"
              [disabled]="saving || (!form.url && !form.token)">
              @if (saving) {
                <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
              } @else {
                <mat-icon>save</mat-icon>
              }
              Simpan
            </button>
          </mat-card-actions>
        }
      </mat-card>

      <!-- Kartu Test Koneksi -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-icon">wifi_tethering</mat-icon>
          <mat-card-title>Test Koneksi GitLab</mat-card-title>
          <mat-card-subtitle>Verifikasi bahwa token dan URL aktif berfungsi</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (diagnostic) {
            <div class="alert" [class.alert-success]="diagnostic.status === 'ok'" [class.alert-error]="diagnostic.status === 'error'">
              <mat-icon>{{ diagnostic.status === 'ok' ? 'check_circle_outline' : 'error_outline' }}</mat-icon>
              <div class="diag-content">
                @if (diagnostic.status === 'ok') {
                  <div><strong>Koneksi berhasil!</strong></div>
                  <div class="diag-detail">URL: {{ diagnostic.gitlab_url }}</div>
                  <div class="diag-detail">GitLab v{{ diagnostic.gitlab_version?.[0] }}</div>
                  <div class="diag-detail">{{ diagnostic.project_count_db }} proyek · {{ diagnostic.commit_count_db }} commit di DB</div>
                } @else {
                  <div><strong>Koneksi gagal</strong></div>
                  <div class="diag-detail">{{ diagnostic.message }}</div>
                }
              </div>
            </div>
          }
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-raised-button color="accent" (click)="testConnection()" [disabled]="testing">
            @if (testing) {
              <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
            } @else {
              <mat-icon>network_check</mat-icon>
            }
            Test Koneksi
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-page { max-width: 680px; }
    .page-title { margin: 0 0 24px; font-size: 24px; font-weight: 500; }
    .settings-card { margin-bottom: 20px; border-radius: 10px !important; }

    .card-icon { background: #e3f2fd; color: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .center-spin { display: flex; justify-content: center; padding: 32px; }

    .current-info { display: flex; flex-direction: column; gap: 14px; padding: 8px 0 4px; }
    .info-row { display: flex; align-items: flex-start; gap: 12px; }
    .info-icon { color: #888; margin-top: 2px; }
    .info-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; color: #222; margin-top: 2px; }
    .info-value.mono { font-family: monospace; letter-spacing: 1px; }

    .divider { margin: 20px 0 16px !important; }
    .form-title { margin: 0 0 16px; font-size: 15px; font-weight: 500; color: #333; }
    .form-fields { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }

    .alert { display: flex; align-items: flex-start; gap: 10px; border-radius: 6px; padding: 12px 14px; font-size: 14px; margin-top: 12px; }
    .alert-error { background: #fdecea; border: 1px solid #f44336; color: #b71c1c; }
    .alert-error mat-icon { color: #f44336; flex-shrink: 0; }
    .alert-success { background: #e8f5e9; border: 1px solid #4caf50; color: #1b5e20; }
    .alert-success mat-icon { color: #4caf50; flex-shrink: 0; }

    .diag-content { display: flex; flex-direction: column; gap: 2px; }
    .diag-detail { font-size: 13px; opacity: 0.85; }

    .btn-spinner { display: inline-block; margin-right: 6px; }
    mat-card-actions { padding: 8px 16px 12px !important; gap: 8px; display: flex; }
  `]
})
export class SettingsComponent implements OnInit {
  private apiUrl = `${environment.apiBase}/api/gitlab`;

  config: GitLabConfig | null = null;
  loading = false;
  loadError = '';
  saving = false;
  saveError = '';
  saveSuccess = false;
  testing = false;
  diagnostic: DiagnosticResult | null = null;
  showToken = false;

  form = { url: '', token: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadConfig(); }

  loadConfig() {
    this.loading = true;
    this.loadError = '';
    this.http.get<GitLabConfig>(`${this.apiUrl}/config/`).subscribe({
      next: (data) => {
        this.config = data;
        this.form.url = data.url;
        this.form.token = '';
        this.loading = false;
      },
      error: (err) => {
        this.loadError = err?.error?.detail || 'Gagal memuat konfigurasi GitLab.';
        this.loading = false;
      }
    });
  }

  save() {
    const payload: any = {};
    if (this.form.url) payload['url'] = this.form.url;
    if (this.form.token) payload['private_token'] = this.form.token;

    if (!Object.keys(payload).length) return;

    this.saving = true;
    this.saveError = '';
    this.saveSuccess = false;
    this.http.patch<GitLabConfig>(`${this.apiUrl}/config/`, payload).subscribe({
      next: (data) => {
        this.config = data;
        this.form.token = '';
        this.saving = false;
        this.saveSuccess = true;
        this.diagnostic = null;
        setTimeout(() => this.saveSuccess = false, 4000);
      },
      error: (err) => {
        this.saveError = err?.error?.detail || JSON.stringify(err?.error) || 'Gagal menyimpan.';
        this.saving = false;
      }
    });
  }

  testConnection() {
    this.testing = true;
    this.diagnostic = null;
    this.http.get<DiagnosticResult>(`${this.apiUrl}/diagnostic/`).subscribe({
      next: (data) => { this.diagnostic = data; this.testing = false; },
      error: (err) => {
        this.diagnostic = { status: 'error', message: err?.error?.message || err?.error?.detail || 'Gagal menghubungi server.' };
        this.testing = false;
      }
    });
  }
}
