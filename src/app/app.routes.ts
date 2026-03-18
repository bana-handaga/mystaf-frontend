import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'staf',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/staf/staf.component').then(m => m.StafComponent)
  },
  {
    path: 'staf/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/staf-detail/staf-detail.component').then(m => m.StafDetailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'projects/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: 'comments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/comments/comments.component').then(m => m.CommentsComponent)
  },
  {
    path: 'commits',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/commit-messages/commit-messages.component').then(m => m.CommitMessagesComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
