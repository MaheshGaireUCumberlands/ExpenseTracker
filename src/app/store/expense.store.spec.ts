import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { ExpenseStore } from './expense.store';
import { ExpenseService } from '../services/expense.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { PwaService } from '../services/pwa.service';
import { Expense } from '../models/expense.model';

describe('ExpenseStore (Simplified)', () => {
  let store: InstanceType<typeof ExpenseStore>;
  let httpTestingController: HttpTestingController;
  let expenseService: ExpenseService;
  let offlineStorageService: jasmine.SpyObj<OfflineStorageService>;
  let pwaService: jasmine.SpyObj<PwaService>;

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

  beforeEach(() => {
    const offlineStorageSpy = jasmine.createSpyObj('OfflineStorageService', [
      'getOfflineExpenses',
      'saveOfflineExpenses',
      'addOfflineExpense',
      'updateOfflineExpense',
      'deleteOfflineExpense',
      'getPendingActions',
      'removePendingAction',
      'exportOfflineData',
      'importOfflineData'
    ]);

    // Set up default returns for offline storage
    offlineStorageSpy.getPendingActions.and.returnValue([]);
    offlineStorageSpy.getOfflineExpenses.and.returnValue([]);
    offlineStorageSpy.saveOfflineExpenses.and.returnValue(undefined);
    offlineStorageSpy.addOfflineExpense.and.returnValue(undefined);
    offlineStorageSpy.updateOfflineExpense.and.returnValue(undefined);
    offlineStorageSpy.deleteOfflineExpense.and.returnValue(undefined);

    const pwaServiceSpy = jasmine.createSpyObj('PwaService', [], {
      isAppOnline: true
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ExpenseService,
        { provide: OfflineStorageService, useValue: offlineStorageSpy },
        { provide: PwaService, useValue: pwaServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    store = TestBed.inject(ExpenseStore);
    httpTestingController = TestBed.inject(HttpTestingController);
    expenseService = TestBed.inject(ExpenseService);
    offlineStorageService = TestBed.inject(OfflineStorageService) as jasmine.SpyObj<OfflineStorageService>;
    pwaService = TestBed.inject(PwaService) as jasmine.SpyObj<PwaService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      expect(store.expenses()).toEqual([]);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.totalExpenses()).toBe(0);
      expect(store.expensesByCategory()).toEqual([]);
    });
  });

  describe('Basic Operations', () => {
    it('should load expenses from API', async () => {
      // Arrange
      offlineStorageService.getPendingActions.and.returnValue([]);

      // Act
      const loadPromise = store.loadExpenses();
      
      // Assert loading state
      expect(store.isLoading()).toBe(true);

      // Mock HTTP response
      const req = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      expect(req.request.method).toBe('GET');
      req.flush(mockExpenses);

      await loadPromise;

      // Assert final state
      expect(store.isLoading()).toBe(false);
      expect(store.expenses()).toEqual(mockExpenses);
    });

    it('should calculate total expenses correctly', async () => {
      // Set up store with test data
      const loadPromise = store.loadExpenses();
      const req = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      req.flush(mockExpenses);

      await loadPromise;

      expect(store.totalExpenses()).toBe(130.50);
    });

    it('should group expenses by category', async () => {
      // Set up store with test data
      const loadPromise = store.loadExpenses();
      const req = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      req.flush(mockExpenses);

      await loadPromise;

      const categories = store.expensesByCategory();
      expect(categories).toEqual([
        { category: 'Food', amount: 85.50 },
        { category: 'Transportation', amount: 45.00 }
      ]);
    });

    it('should handle loading errors gracefully', async () => {
      const loadPromise = store.loadExpenses();
      
      const req = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      req.error(new ProgressEvent('Network error'));

      await loadPromise;

      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeTruthy();
    });
  });

  describe('Data Management', () => {
    it('should add new expense', async () => {
      const newExpense: Omit<Expense, 'id'> = {
        title: 'Coffee',
        amount: 4.50,
        category: 'Food',
        date: '2025-09-30',
        notes: 'Morning coffee'
      };

      const addedExpense: Expense = { ...newExpense, id: 3 };

      const addPromise = store.addExpense(newExpense);
      
      const req = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newExpense);
      req.flush(addedExpense);

      await addPromise;

      expect(store.expenses()).toContain(addedExpense);
    });

    it('should update existing expense', async () => {
      // First load some expenses
      store.loadExpenses();
      const loadReq = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      loadReq.flush(mockExpenses);

      const updatedExpense: Expense = {
        ...mockExpenses[0],
        amount: 100.00
      };

      const updatePromise = store.updateExpense(updatedExpense);
      
      const req = httpTestingController.expectOne(`http://localhost:3000/api/expenses/${updatedExpense.id}`);
      expect(req.request.method).toBe('PUT');
      req.flush(updatedExpense);

      await updatePromise;

      const expenses = store.expenses();
      const foundExpense = expenses.find(e => e.id === updatedExpense.id);
      expect(foundExpense?.amount).toBe(100.00);
    });

    it('should delete expense', async () => {
      // First load some expenses
      store.loadExpenses();
      const loadReq = httpTestingController.expectOne('http://localhost:3000/api/expenses');
      loadReq.flush(mockExpenses);

      const expenseToDelete = mockExpenses[0];

      const deletePromise = store.deleteExpense(expenseToDelete.id!);
      
      const req = httpTestingController.expectOne(`http://localhost:3000/api/expenses/${expenseToDelete.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      await deletePromise;

      const expenses = store.expenses();
      expect(expenses).not.toContain(expenseToDelete);
    });
  });
});