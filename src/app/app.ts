import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule, MatMenuModule, MatDividerModule
  ],
  template: `
    @if (authService.isLoggedIn) {
      <mat-sidenav-container class="sidenav-container">

        <!-- Sidebar (desktop only) -->
        @if (!isMobile) {
          <mat-sidenav mode="side" opened class="sidenav">
            <mat-toolbar color="primary">
              <span>MyStaf</span>
            </mat-toolbar>
            <mat-nav-list>
              <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
                <mat-icon matListItemIcon>dashboard</mat-icon>
                <span matListItemTitle>Dashboard</span>
              </a>
              <a mat-list-item routerLink="/staf" routerLinkActive="active-link">
                <mat-icon matListItemIcon>people</mat-icon>
                <span matListItemTitle>Staf</span>
              </a>
              <a mat-list-item routerLink="/projects" routerLinkActive="active-link">
                <mat-icon matListItemIcon>folder_open</mat-icon>
                <span matListItemTitle>Proyek / Apps</span>
              </a>
              <a mat-list-item routerLink="/commits" routerLinkActive="active-link">
                <mat-icon matListItemIcon>commit</mat-icon>
                <span matListItemTitle>Commit Message</span>
              </a>
              <a mat-list-item routerLink="/commit-analysis" routerLinkActive="active-link">
                <mat-icon matListItemIcon>analytics</mat-icon>
                <span matListItemTitle>Commit Analisis</span>
              </a>
              <a mat-list-item routerLink="/comments" routerLinkActive="active-link">
                <mat-icon matListItemIcon>chat</mat-icon>
                <span matListItemTitle>Komentar</span>
              </a>
            </mat-nav-list>
          </mat-sidenav>
        }

        <mat-sidenav-content class="main-content">
          <!-- Top Toolbar -->
          <mat-toolbar color="primary" class="top-toolbar">
            @if (isMobile) {
              <span class="app-brand">MyStaf</span>
            } @else {
              <span>{{ pageTitle }}</span>
            }
            <span class="spacer"></span>
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
              <div class="user-avatar">{{ (authService.currentUser?.first_name || authService.currentUser?.username || '?').charAt(0).toUpperCase() }}</div>
              @if (!isMobile) {
                <span class="user-name">{{ authService.currentUser?.first_name || authService.currentUser?.username }}</span>
              }
              @if (!isMobile) {
                <mat-icon>arrow_drop_down</mat-icon>
              }
            </button>
            <mat-menu #userMenu="matMenu" xPosition="before">
              <div class="menu-header">
                <div class="menu-avatar">{{ (authService.currentUser?.first_name || authService.currentUser?.username || '?').charAt(0).toUpperCase() }}</div>
                <div>
                  <div class="menu-fullname">{{ authService.currentUser?.first_name }} {{ authService.currentUser?.last_name }}</div>
                  <div class="menu-username">&#64;{{ authService.currentUser?.username }}</div>
                </div>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item routerLink="/profile">
                <mat-icon>account_circle</mat-icon> Profil Saya
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()" class="logout-item">
                <mat-icon>logout</mat-icon> Logout
              </button>
            </mat-menu>
          </mat-toolbar>

          <!-- Page content -->
          <div class="content-area" [class.mobile-content]="isMobile">
            <router-outlet></router-outlet>
          </div>

          <!-- Bottom Tab Bar (mobile only) -->
          @if (isMobile) {
            <nav class="bottom-nav">
              <a routerLink="/dashboard" routerLinkActive="tab-active" class="tab-item">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a routerLink="/staf" routerLinkActive="tab-active" class="tab-item">
                <mat-icon>people</mat-icon>
                <span>Staf</span>
              </a>
              <a routerLink="/projects" routerLinkActive="tab-active" class="tab-item">
                <mat-icon>folder_open</mat-icon>
                <span>Proyek</span>
              </a>
              <a routerLink="/commits" routerLinkActive="tab-active" class="tab-item">
                <mat-icon>commit</mat-icon>
                <span>Commit</span>
              </a>
              <a routerLink="/commit-analysis" routerLinkActive="tab-active" class="tab-item">
                <mat-icon>analytics</mat-icon>
                <span>Analisis</span>
              </a>
              <a routerLink="/comments" routerLinkActive="tab-active" class="tab-item">
                <mat-icon>chat</mat-icon>
                <span>Komentar</span>
              </a>
            </nav>
          }
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .sidenav-container { height: 100vh; }

    /* ── Sidebar (desktop) ── */
    .sidenav {
      width: 240px;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #1a237e 0%, #283593 40%, #1565c0 100%) !important;
    }
    .sidenav mat-toolbar {
      min-height: 64px;
      background: transparent !important;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    mat-nav-list { padding-top: 12px !important; }
    mat-nav-list a {
      color: rgba(242,242,242,0.95) !important;
      margin: 2px 8px;
      border-radius: 8px;
      transition: background 0.2s, color 0.2s;
    }
    mat-nav-list a .mdc-list-item__primary-text,
    mat-nav-list a .mat-mdc-list-item-unscoped-content,
    mat-nav-list a span[matlistitemtitle],
    mat-nav-list a span { color: #f2f2f2 !important; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.12) !important; }
    mat-nav-list a:hover .mdc-list-item__primary-text,
    mat-nav-list a:hover span { color: #ffffff !important; }
    mat-nav-list mat-icon { color: rgba(242,242,242,0.85) !important; }
    .active-link {
      background: rgba(255,255,255,0.18) !important;
      font-weight: 600;
    }
    .active-link .mdc-list-item__primary-text,
    .active-link span { color: #ffffff !important; }
    .active-link mat-icon { color: white !important; }

    /* ── Main content ── */
    .main-content { display: flex; flex-direction: column; height: 100vh; }
    .top-toolbar { position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
    .content-area { padding: 24px; flex: 1; overflow-y: auto; background: #f0f2f5; }
    .content-area.mobile-content { padding: 16px; padding-bottom: 80px; }
    .spacer { flex: 1; }

    /* ── Top toolbar user button ── */
    .app-brand { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
    .user-btn { display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 8px; color: white !important; border-radius: 24px !important; padding: 4px 12px 4px 4px !important; min-width: 0 !important; white-space: nowrap; }
    .user-btn:hover { background: rgba(255,255,255,0.15) !important; }
    .user-btn .mat-button-wrapper,
    .user-btn .mdc-button__label { display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 8px; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.25); color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .user-name { font-size: 14px; font-weight: 500; line-height: 32px; white-space: nowrap; }

    /* ── Dropdown menu ── */
    .menu-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
    .menu-avatar { width: 40px; height: 40px; border-radius: 50%; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .menu-fullname { font-weight: 600; font-size: 14px; }
    .menu-username { font-size: 12px; color: #888; }
    .logout-item { color: #c62828 !important; }
    .logout-item mat-icon { color: #c62828 !important; }

    /* ── Bottom Tab Bar (mobile) ── */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: #fff;
      display: flex;
      align-items: stretch;
      border-top: 1px solid #e0e0e0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
      z-index: 200;
    }
    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      text-decoration: none;
      color: #9e9e9e;
      font-size: 9px;
      font-weight: 500;
      transition: color 0.2s;
      -webkit-tap-highlight-color: transparent;
      padding: 0 2px;
    }
    .tab-item mat-icon { font-size: 20px; width: 20px; height: 20px; transition: color 0.2s; }
    .tab-item.tab-active { color: #1976d2; }
    .tab-item.tab-active mat-icon { color: #1976d2; }
    .tab-item:active { background: rgba(25,118,210,0.06); }
  `]
})
export class App implements OnInit, OnDestroy {
  pageTitle = 'Dashboard';
  isMobile = false;
  private bpSub!: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.bpSub = this.breakpointObserver
      .observe([Breakpoints.Handset, '(max-width: 768px)'])
      .subscribe(result => { this.isMobile = result.matches; });

    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('dashboard')) this.pageTitle = 'Dashboard';
      else if (url.includes('commit-analysis')) this.pageTitle = 'Commit Analisis';
      else if (url.includes('commits')) this.pageTitle = 'Commit Message';
      else if (url.includes('comments')) this.pageTitle = 'Komentar';
      else if (url.includes('projects')) this.pageTitle = 'Proyek / Apps';
      else if (url.includes('staf')) this.pageTitle = 'Staf';
      else if (url.includes('profile')) this.pageTitle = 'Profil Saya';
    });
  }

  ngOnDestroy() { this.bpSub?.unsubscribe(); }

  logout() { this.authService.logout(); }
}
