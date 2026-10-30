import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash-es';

export interface ShellSearchResult {
  count: number;
  content: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ShellService {
  constructor(private httpClient: HttpClient) { }

  /**
   * Search Live shells of the current channel.
   * identifier -> exact lookup, query -> name search, neither -> plain paginated list
   */
  search(options: { query?: string, identifier?: string, limit?: number, offset?: number }): Observable<ShellSearchResult> {
    const url = localStorage.getItem('shellFindURL');
    if (!url) {
      console.error('shellFindURL is not set in localStorage');
      return of({ count: 0, content: [] });
    }
    const filters: any = {
      status: ['Live'],
      primaryCategory: ['Shell'],
      IL_FUNC_OBJECT_TYPE: ['Collection'],
      channel: localStorage.getItem('channelId'),
      framework: localStorage.getItem('frameworkId')
    };
    if (options.identifier) {
      filters.identifier = [options.identifier];
    }
    const request: any = {
      filters,
      sort_by: { lastUpdatedOn: 'desc' },
      limit: options.limit || 5,
      offset: options.offset || 0
    };
    if (!_.isEmpty(_.trim(options.query))) {
      request.query = _.trim(options.query);
    }
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      headers = headers.set('tenantid', tenantId);
    }
    return this.httpClient.post(url, { request }, { headers }).pipe(
      map((res: any) => ({
        count: _.get(res, 'result.count', 0),
        content: _.get(res, 'result.content', [])
      }))
    );
  }
}
