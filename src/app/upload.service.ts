import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  SERVER_URL = 'http://localhost:3000/upload';

  constructor(private httpClient: HttpClient) {
  }

  public upload(formData) {
    return this.httpClient.post<any>(this.SERVER_URL, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
