import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  API_URL = 'http://api.uconduit.ncite.mx/public/';

  constructor() { }
}
