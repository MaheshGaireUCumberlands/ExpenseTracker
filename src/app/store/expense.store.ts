import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Expense } from '../models/expense.model';
import { ExpenseService } from '../services/expense.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { PwaService } from '../services/pwa.service';

interface ExpenseFilter {
  searchText: string;
  category: string | null;
}

export const ExpenseStore = signalStore(
  { providedIn: 'root' },
  
  // State management with offline support
  withState({
    expenses: [] as Expense[],
    isLoading: false,
    error: null as string | null,
    filter: { searchText: '', category: null } as ExpenseFilter,
    isOfflineMode: false,
    pendingSync: 0,
    lastSyncTime: null as Date | null,
  }),
  
  // Computed values (reactive derived state)
  withComputed((store) => ({
    // Total expenses
    totalExpenses: computed(() => 
      store.expenses().reduce((sum: number, expense: Expense) => sum + (expense.amount || 0), 0)
    ),
    
    // Expenses by category for chart
    expensesByCategory: computed(() => {
      const categoryMap = new Map<string, number>();
      store.expenses().forEach((expense: Expense) => {
        const category = expense.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (expense.amount || 0));
      });
      return Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount
      }));
    }),
    
    // Filtered expenses
    filteredExpenses: computed(() => {
      let filtered = store.expenses();
      const filter = store.filter();
      
      // Apply text filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase();
        filtered = filtered.filter((expense: Expense) => 
          expense.title?.toLowerCase().includes(searchText) ||
          expense.category?.toLowerCase().includes(searchText) ||
          expense.notes?.toLowerCase().includes(searchText)
        );
      }
      
      // Apply category filter
      if (filter.category) {
        filtered = filtered.filter((expense: Expense) => expense.category === filter.category);
      }
      
      // Sort by date (newest first)
      return filtered.sort((a: Expense, b: Expense) => 
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
    }),
    
    // Monthly expenses
    monthlyExpenses: computed(() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      return store.expenses()
        .filter((expense: Expense) => {
          const expenseDate = new Date(expense.date || 0);
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, expense: Expense) => sum + (expense.amount || 0), 0);
    }),
  })),
  
  // Methods (actions) with offline support
  withMethods((store) => {
    const expenseService = inject(ExpenseService);
    const offlineStorage = inject(OfflineStorageService);
    const pwaService = inject(PwaService);
    
    return {
      // Load all expenses with offline support
      async loadExpenses() {
        patchState(store, { isLoading: true, error: null });
        
        try {
          if (pwaService.isAppOnline) {
            // Try to load from API first
            const expenses = await expenseService.getExpenses().toPromise();
            const validExpenses = expenses || [];
            
            // Save to offline storage
            offlineStorage.saveOfflineExpenses(validExpenses);
            patchState(store, { 
              expenses: validExpenses,
              isOfflineMode: false,
              lastSyncTime: new Date()
            });
            
            // Sync any pending offline actions
            await this.syncPendingActions();
          } else {
            // Load from offline storage
            const offlineExpenses = offlineStorage.getOfflineExpenses();
            patchState(store, { 
              expenses: offlineExpenses,
              isOfflineMode: true,
              error: 'Working offline - changes will sync when online'
            });
          }
        } catch (error) {
          // Fallback to offline storage
          const offlineExpenses = offlineStorage.getOfflineExpenses();
          patchState(store, { 
            expenses: offlineExpenses,
            isOfflineMode: true,
            error: 'Using offline data - will sync when connection is restored'
          });
          console.error('Error loading expenses, using offline data:', error);
        } finally {
          patchState(store, { isLoading: false });
          this.updatePendingCount();
        }
      },
      
      // Add new expense with offline support
      async addExpense(expense: Omit<Expense, 'id'>) {
        patchState(store, { isLoading: true, error: null });
        
        try {
          if (pwaService.isAppOnline) {
            // Online: save to API
            const newExpense = await expenseService.addExpense(expense as Expense).toPromise();
            if (newExpense) {
              patchState(store, { 
                expenses: [...store.expenses(), newExpense] 
              });
              offlineStorage.saveOfflineExpenses(store.expenses());
            }
          } else {
            // Offline: save locally
            const tempExpense = { ...expense, id: Date.now() * -1 } as Expense;
            offlineStorage.addOfflineExpense(tempExpense);
            patchState(store, { 
              expenses: [...store.expenses(), tempExpense],
              isOfflineMode: true
            });
            this.updatePendingCount();
          }
        } catch (error) {
          patchState(store, { error: 'Failed to add expense. Please try again.' });
          console.error('Error adding expense:', error);
        } finally {
          patchState(store, { isLoading: false });
        }
      },
      
      // Update expense with offline support
      async updateExpense(expense: Expense) {
        patchState(store, { isLoading: true, error: null });
        
        try {
          if (pwaService.isAppOnline) {
            // Online: update via API
            const updatedExpense = await expenseService.updateExpense(expense).toPromise();
            if (updatedExpense) {
              patchState(store, { 
                expenses: store.expenses().map(e => 
                  e.id === expense.id ? updatedExpense : e
                )
              });
              offlineStorage.saveOfflineExpenses(store.expenses());
            }
          } else {
            // Offline: update locally
            offlineStorage.updateOfflineExpense(expense);
            patchState(store, { 
              expenses: store.expenses().map(e => 
                e.id === expense.id ? expense : e
              ),
              isOfflineMode: true
            });
            this.updatePendingCount();
          }
        } catch (error) {
          patchState(store, { error: 'Failed to update expense. Please try again.' });
          console.error('Error updating expense:', error);
        } finally {
          patchState(store, { isLoading: false });
        }
      },
      
      // Delete expense with offline support
      async deleteExpense(id: number) {
        patchState(store, { isLoading: true, error: null });
        
        try {
          if (pwaService.isAppOnline) {
            // Online: delete via API
            await expenseService.deleteExpense(id).toPromise();
            patchState(store, { 
              expenses: store.expenses().filter(e => e.id !== id) 
            });
            offlineStorage.saveOfflineExpenses(store.expenses());
          } else {
            // Offline: delete locally
            offlineStorage.deleteOfflineExpense(id);
            patchState(store, { 
              expenses: store.expenses().filter(e => e.id !== id),
              isOfflineMode: true
            });
            this.updatePendingCount();
          }
        } catch (error) {
          patchState(store, { error: 'Failed to delete expense. Please try again.' });
          console.error('Error deleting expense:', error);
        } finally {
          patchState(store, { isLoading: false });
        }
      },
      
      // Filter methods
      setSearchFilter(searchText: string) {
        patchState(store, {
          filter: { ...store.filter(), searchText }
        });
      },
      
      setCategoryFilter(category: string | null) {
        patchState(store, {
          filter: { ...store.filter(), category }
        });
      },
      
      clearFilters() {
        patchState(store, {
          filter: { searchText: '', category: null }
        });
      },
    
      // Error handling
      clearError() {
        patchState(store, { error: null });
      },
      
      // Reset store
      reset() {
        patchState(store, {
          expenses: [],
          isLoading: false,
          error: null,
          filter: { searchText: '', category: null },
          isOfflineMode: false,
          pendingSync: 0,
          lastSyncTime: null
        });
      },

      // Offline sync methods
      async syncPendingActions() {
        if (!pwaService.isAppOnline) return;

        const pendingActions = offlineStorage.getPendingActions();
        if (pendingActions.length === 0) return;

        patchState(store, { isLoading: true });

        for (const action of pendingActions) {
          try {
            switch (action.type) {
              case 'add':
                if (action.expense) {
                  await expenseService.addExpense(action.expense).toPromise();
                }
                break;
              case 'update':
                if (action.expense) {
                  await expenseService.updateExpense(action.expense).toPromise();
                }
                break;
              case 'delete':
                if (action.expenseId) {
                  await expenseService.deleteExpense(action.expenseId).toPromise();
                }
                break;
            }
            offlineStorage.removePendingAction(action.id);
          } catch (error) {
            console.error(`Failed to sync action ${action.id}:`, error);
          }
        }

        this.updatePendingCount();
        patchState(store, { isLoading: false });
      },

      updatePendingCount() {
        const pendingCount = offlineStorage.getPendingActions().length;
        patchState(store, { pendingSync: pendingCount });
      },

      // Force sync
      async forcSync() {
        await this.loadExpenses();
      },

      // Export/Import for backup
      exportData(): string {
        return offlineStorage.exportOfflineData();
      },

      importData(jsonData: string): boolean {
        const success = offlineStorage.importOfflineData(jsonData);
        if (success) {
          this.loadExpenses();
        }
        return success;
      }
    };
  })
);