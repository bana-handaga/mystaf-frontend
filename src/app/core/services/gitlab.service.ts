import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivitySummary {
  staf: { id: number; name: string; username: string; gitlab_username: string; role: string };
  period_days: number;
  total_commits: number;
  total_push_events: number;
  total_merge_requests: number;
  total_issues: number;
  total_comments: number;
  active_projects: string[];
  daily_activity: { date: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class GitlabService {
  private apiUrl = 'https://api.dsti-ums.id/api/gitlab';

  constructor(private http: HttpClient) {}

  getTeamSummary(days: number = 30): Observable<ActivitySummary[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ActivitySummary[]>(`${this.apiUrl}/summary/team/`, { params });
  }

  getStafSummary(stafId: number, days: number = 30): Observable<ActivitySummary> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ActivitySummary>(`${this.apiUrl}/summary/${stafId}/`, { params });
  }

  syncAll(days: number = 30): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync/`, { days });
  }

  syncStaf(stafId: number, days: number = 30): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync/${stafId}/`, { days });
  }

  getActivities(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => { httpParams = httpParams.set(k, params[k]); });
    }
    return this.http.get<any[]>(`${this.apiUrl}/activities/`, { params: httpParams });
  }
}
