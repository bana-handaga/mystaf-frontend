import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://172.16.64.196:8888/api/gitlab';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private http: HttpClient) {}

  getProjects(days = 30, search = ''): Observable<any> {
    let params = new HttpParams().set('days', days);
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${API}/projects/`, { params });
  }

  getProjectDetail(id: number, days = 30): Observable<any> {
    const params = new HttpParams().set('days', days);
    return this.http.get<any>(`${API}/projects/${id}/`, { params });
  }

  syncProjects(): Observable<any> {
    return this.http.post(`${API}/projects/sync/`, {});
  }

  syncProjectCommits(id: number, days = 30): Observable<any> {
    return this.http.post(`${API}/projects/${id}/sync/`, { days });
  }

  getCommits(filters: { days?: number; search?: string; project_id?: string; staf_id?: string } = {}): Observable<any> {
    let params = new HttpParams().set('days', filters.days ?? 30);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.project_id) params = params.set('project_id', filters.project_id);
    if (filters.staf_id) params = params.set('staf_id', filters.staf_id);
    return this.http.get<any>(`${API}/commits/`, { params });
  }
}
