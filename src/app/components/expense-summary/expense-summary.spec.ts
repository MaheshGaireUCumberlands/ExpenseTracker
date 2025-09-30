import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { ExpenseSummaryComponent } from './expense-summary';
import { ExpenseStore } from '../../store/expense.store';
import { Expense } from '../../models/expense.model';

describe('ExpenseSummaryComponent (Simple)', () => {
  let component: ExpenseSummaryComponent;
  let fixture: ComponentFixture<ExpenseSummaryComponent>;
  let mockExpenseStore: jasmine.SpyObj<any>;

  const mockExpenses: Expense[] = [
    {
      id: 1,
      title: 'Groceries',
      amount: 85.50,
      category: 'Food',
      date: '2025-09-30',
      notes: 'Weekly shopping'
    },
    {
      id: 2,
      title: 'Gas',
      amount: 45.00,
      category: 'Transportation',
      date: '2025-09-29',
      notes: 'Fill up tank'
    }
  ];

  const mockExpensesByCategory = [
    { category: 'Food', amount: 85.50 },
    { category: 'Transportation', amount: 45.00 }
  ];

  beforeEach(async () => {
    // Create spy object for ExpenseStore
    mockExpenseStore = jasmine.createSpyObj('ExpenseStore', ['loadExpenses'], {
      totalExpenses: jasmine.createSpy().and.returnValue(130.50),
      monthlyExpenses: jasmine.createSpy().and.returnValue(130.50),
      expensesByCategory: jasmine.createSpy().and.returnValue(mockExpensesByCategory),
      isLoading: jasmine.createSpy().and.returnValue(false),
      error: jasmine.createSpy().and.returnValue(null)
    });

    // Mock Chart.js
    (window as any).Chart = jasmine.createSpy('Chart').and.returnValue({
      data: {},
      update: jasmine.createSpy('update'),
      destroy: jasmine.createSpy('destroy')
    });

    await TestBed.configureTestingModule({
      imports: [
        ExpenseSummaryComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExpenseStore, useValue: mockExpenseStore },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseSummaryComponent);
    component = fixture.componentInstance;
  });

  describe('Component Basics', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load expenses on init', () => {
      fixture.detectChanges();
      expect(mockExpenseStore.loadExpenses).toHaveBeenCalled();
    });

    it('should display summary statistics', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('$130.50');
      expect(compiled.textContent).toContain('Total Expenses');
      expect(compiled.textContent).toContain('This Month');
    });
  });

  describe('Chart Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create chart with correct configuration', () => {
      component.ngAfterViewInit();
      expect(component['chart']).toBeDefined();
    });

    it('should generate colors for chart data', () => {
      const colors = component['generateColors'](3);
      expect(colors.length).toBe(3);
      expect(colors[0]).toBe('#FF6384');
      expect(colors[1]).toBe('#36A2EB');
      expect(colors[2]).toBe('#FFCE56');
    });

    it('should handle empty expense data', () => {
      mockExpenseStore.expensesByCategory.and.returnValue([]);
      component['updateChartData']();
      
      expect(component.pieData.labels).toEqual(['No expenses yet']);
      expect(component.pieData.datasets[0].data).toEqual([1]);
    });

    it('should create chart data from expenses', () => {
      mockExpenseStore.expensesByCategory.and.returnValue(mockExpensesByCategory);
      component['updateChartData']();
      
      expect(component.pieData.labels).toEqual(['Food', 'Transportation']);
      expect(component.pieData.datasets[0].data).toEqual([85.50, 45.00]);
    });
  });

  describe('Debug Information', () => {
    it('should display debug information', () => {
      mockExpenseStore.expensesByCategory.and.returnValue(mockExpensesByCategory);
      mockExpenseStore.totalExpenses.and.returnValue(130.50);
      
      fixture.detectChanges();
      
      const debugInfo = component.debugInfo;
      expect(debugInfo).toContain('Categories: 2');
      expect(debugInfo).toContain('Total: $130.5');
    });
  });

  describe('Layout Elements', () => {
    it('should have responsive chart container', () => {
      fixture.detectChanges();
      const chartContainer = fixture.nativeElement.querySelector('.chart-container');
      expect(chartContainer).toBeTruthy();
    });

    it('should handle small screen layouts', () => {
      fixture.detectChanges();
      const summaryStats = fixture.nativeElement.querySelector('.summary-stats');
      expect(summaryStats).toBeTruthy();
    });
  });
});