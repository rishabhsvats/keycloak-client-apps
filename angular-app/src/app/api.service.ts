import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getPublicHealth() {
    return this.http.get<Record<string, unknown>>('/api/public/health');
  }

  getPublicInfo() {
    return this.http.get<Record<string, unknown>>('/api/public/info');
  }

  getSecuredMe() {
    return this.http.get<Record<string, unknown>>('/api/secured/me');
  }

  getSecuredData() {
    return this.http.get<Record<string, unknown>>('/api/secured/data');
  }

  getSecuredToken() {
    return this.http.get<Record<string, unknown>>('/api/secured/token');
  }
}
