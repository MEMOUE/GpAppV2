import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor() { }


  private searchCriteria = new BehaviorSubject<any>(null);
  searchCriteria$ = this.searchCriteria.asObservable();

  setSearchCriteria(criteria: any) {
    this.searchCriteria.next(criteria);
  }
}
