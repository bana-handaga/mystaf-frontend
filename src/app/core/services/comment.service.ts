import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'https://api.dsti-ums.id/api/gitlab';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private http: HttpClient) {}

  getComments(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k]) params = params.set(k, filters[k]); });
    return this.http.get<any>(`${API}/comments/`, { params });
  }

  getStats(days = 30): Observable<any> {
    return this.http.get<any>(`${API}/comments/stats/`, { params: new HttpParams().set('days', days) });
  }

  sync(days = 30, project_id = ''): Observable<any> {
    const body: any = { days };
    if (project_id) body.project_id = project_id;
    return this.http.post<any>(`${API}/comments/sync/`, body);
  }
}
