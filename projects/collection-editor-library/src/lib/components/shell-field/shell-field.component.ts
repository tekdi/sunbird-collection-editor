import { Component, ElementRef, HostListener, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import * as _ from 'lodash-es';
import { ShellService } from '../../services/shell/shell.service';

@Component({
  selector: 'lib-shell-field',
  templateUrl: './shell-field.component.html',
  styleUrls: ['./shell-field.component.scss']
})
export class ShellFieldComponent implements OnInit, OnChanges, OnDestroy {
  @Input() field: any;
  // owned by lib-meta-form, which merges its value into the form data
  @Input() formControlRef: UntypedFormControl;
  @Input() disabled = false;
  @ViewChild('control') controlRef: ElementRef;

  public readonly pageSize = 5;
  public readonly panelMaxHeight = 240;
  public panelStyle: any = {};
  public dropUp = false;
  public shells: any[] = [];
  public totalCount = 0;
  public selectedShell: any;
  public searchText = '';
  public isOpen = false;
  public isLoading = false;
  private searchInput$ = new Subject<string>();
  private page$ = new Subject<{ query: string, offset: number }>();
  private onComponentDestroy$ = new Subject<void>();
  private selectedShellSubscription: Subscription;
  private reposition = () => this.ngZone.run(() => this.updatePanelPosition());

  constructor(private shellService: ShellService, private elementRef: ElementRef, private ngZone: NgZone) { }

  ngOnInit() {
    // offset 0 replaces the list, any other offset appends; switchMap drops stale responses
    this.page$.pipe(
      tap(() => this.isLoading = true),
      switchMap(page => this.shellService.search({ query: page.query, limit: this.pageSize, offset: page.offset }).pipe(
        map(res => ({ page, res })),
        catchError(() => of({ page, res: { count: 0, content: [] } }))
      )),
      takeUntil(this.onComponentDestroy$)
    ).subscribe(({ page, res }) => {
      this.isLoading = false;
      this.totalCount = res.count;
      this.shells = page.offset === 0 ? res.content : _.uniqBy([...this.shells, ...res.content], 'identifier');
      if (!this.selectedShell && this.shellId) {
        this.selectedShell = _.find(this.shells, { identifier: this.shellId });
      }
    });

    this.searchInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.onComponentDestroy$)
    ).subscribe(query => this.page$.next({ query, offset: 0 }));

    this.loadSelectedShell();
  }

  // meta-form creates a new control whenever its form config is rebuilt (framework load, node switch)
  ngOnChanges(changes: SimpleChanges) {
    if (changes['formControlRef'] && !changes['formControlRef'].firstChange) {
      this.close();
      this.loadSelectedShell();
    }
  }

  get shellId(): string {
    return this.formControlRef && this.formControlRef.value;
  }

  // step 1: resolve the prefilled identifier to show it as selected, step 2: load the first page
  loadSelectedShell() {
    if (this.selectedShellSubscription) {
      this.selectedShellSubscription.unsubscribe();
    }
    const shellId = this.shellId;
    if (_.isEmpty(shellId)) {
      this.selectedShell = undefined;
      this.loadFirstPage();
      return;
    }
    if (_.get(this.selectedShell, 'identifier') === shellId) {
      this.loadFirstPage();
      return;
    }
    this.selectedShell = _.find(this.shells, { identifier: shellId });
    if (this.selectedShell) {
      this.loadFirstPage();
      return;
    }
    this.selectedShellSubscription = this.shellService.search({ identifier: shellId, limit: 1, offset: 0 }).pipe(
      catchError(() => of({ count: 0, content: [] })),
      takeUntil(this.onComponentDestroy$)
    ).subscribe(res => {
      // the selection may already have been resolved from the list in the meantime
      this.selectedShell = this.selectedShell || _.first(res.content);
      this.loadFirstPage();
    });
  }

  loadFirstPage() {
    this.page$.next({ query: this.searchText, offset: 0 });
  }

  // selected shell is pinned on top of the list (when not searching), without duplicating it from the API pages
  get displayShells() {
    if (!this.selectedShell || this.searchText) {
      return this.shells;
    }
    return [this.selectedShell, ..._.reject(this.shells, { identifier: this.selectedShell.identifier })];
  }

  get hasMore() {
    return this.shells.length < this.totalCount;
  }

  onScroll() {
    if (this.isLoading || !this.hasMore) {
      return;
    }
    this.page$.next({ query: this.searchText, offset: this.shells.length });
  }

  onSearch(text: string) {
    this.searchText = text;
    this.open();
    this.searchInput$.next(text);
  }

  open() {
    if (this.disabled || this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.updatePanelPosition();
    // capture phase so scrolling of any ancestor container (not just window) keeps the panel attached
    window.addEventListener('scroll', this.reposition, true);
    window.addEventListener('resize', this.reposition);
  }

  // open below the input, or above it when there is not enough room below in the viewport
  updatePanelPosition() {
    if (!this.controlRef) {
      return;
    }
    const rect = this.controlRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    this.dropUp = spaceBelow < this.panelMaxHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.min(this.panelMaxHeight, (this.dropUp ? spaceAbove : spaceBelow) - 8);
    this.panelStyle = {
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      'max-height': `${Math.max(maxHeight, 80)}px`,
      top: this.dropUp ? 'auto' : `${rect.bottom}px`,
      bottom: this.dropUp ? `${window.innerHeight - rect.top}px` : 'auto'
    };
  }

  selectShell(shell: any) {
    this.selectedShell = shell;
    this.formControlRef.markAsTouched();
    this.formControlRef.setValue(shell.identifier);
    this.formControlRef.markAsDirty();
    this.close();
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.selectedShell = undefined;
    this.formControlRef.setValue('');
    this.formControlRef.markAsDirty();
    this.formControlRef.markAsTouched();
    this.close();
  }

  close() {
    this.isOpen = false;
    this.removePositionListeners();
    if (this.searchText) {
      this.searchText = '';
      this.searchInput$.next('');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  trackByIdentifier(index: number, shell: any) {
    return shell.identifier;
  }

  removePositionListeners() {
    window.removeEventListener('scroll', this.reposition, true);
    window.removeEventListener('resize', this.reposition);
  }

  ngOnDestroy() {
    this.removePositionListeners();
    this.onComponentDestroy$.next();
    this.onComponentDestroy$.complete();
  }
}
