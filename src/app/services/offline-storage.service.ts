import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Expense } from '../models/expense.model';

export interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  expense?: Expense;
  expenseId?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEYS = {
    EXPENSES: 'expenses_offline',
    PENDING_ACTIONS: 'pending_actions_offline',
    LAST_SYNC: 'last_sync_timestamp'
  };

  constructor() {
    // Initialize offline storage if on browser
    if (this.isBrowser()) {
      this.initializeOfflineStorage();
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private initializeOfflineStorage(): void {
    // Ensure storage keys exist
    if (!localStorage.getItem(this.STORAGE_KEYS.EXPENSES)) {
      localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.PENDING_ACTIONS)) {
      localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify([]));
    }
  }

  // Expense CRUD operations for offline storage
  getOfflineExpenses(): Expense[] {
    if (!this.isBrowser()) return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.EXPENSES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading offline expenses:', error);
      return [];
    }
  }

  saveOfflineExpenses(expenses: Expense[]): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      this.updateLastSyncTime();
    } catch (error) {
      console.error('Error saving offline expenses:', error);
    }
  }

  addOfflineExpense(expense: Expense): void {
    if (!this.isBrowser()) return;
    
    const expenses = this.getOfflineExpenses();
    const newExpense = {
      ...expense,
      id: expense.id || this.generateTempId()
    };
    
    expenses.push(newExpense);
    this.saveOfflineExpenses(expenses);
    
    // Queue the action for sync
    this.queueAction({
      id: this.generateActionId(),
      type: 'add',
      expense: newExpense,
      timestamp: Date.now()
    });
  }

  updateOfflineExpense(expense: Expense): void {
    if (!this.isBrowser() || !expense.id) return;
    
    const expenses = this.getOfflineExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    
    if (index !== -1) {
      expenses[index] = expense;
      this.saveOfflineExpenses(expenses);
      
      // Queue the action for sync
      this.queueAction({
        id: this.generateActionId(),
        type: 'update',
        expense,
        timestamp: Date.now()
      });
    }
  }

  deleteOfflineExpense(id: number): void {
    if (!this.isBrowser()) return;
    
    const expenses = this.getOfflineExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== id);
    
    if (filteredExpenses.length !== expenses.length) {
      this.saveOfflineExpenses(filteredExpenses);
      
      // Queue the action for sync
      this.queueAction({
        id: this.generateActionId(),
        type: 'delete',
        expenseId: id,
        timestamp: Date.now()
      });
    }
  }

  // Pending actions management
  getPendingActions(): OfflineAction[] {
    if (!this.isBrowser()) return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PENDING_ACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading pending actions:', error);
      return [];
    }
  }

  private queueAction(action: OfflineAction): void {
    if (!this.isBrowser()) return;
    
    const actions = this.getPendingActions();
    actions.push(action);
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(actions));
    } catch (error) {
      console.error('Error queueing offline action:', error);
    }
  }

  clearPendingActions(): void {
    if (!this.isBrowser()) return;
    
    localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify([]));
  }

  removePendingAction(actionId: string): void {
    if (!this.isBrowser()) return;
    
    const actions = this.getPendingActions();
    const filteredActions = actions.filter(a => a.id !== actionId);
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(filteredActions));
    } catch (error) {
      console.error('Error removing pending action:', error);
    }
  }

  // Sync management
  getLastSyncTime(): number {
    if (!this.isBrowser()) return 0;
    
    const stored = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
    return stored ? parseInt(stored, 10) : 0;
  }

  private updateLastSyncTime(): void {
    if (!this.isBrowser()) return;
    
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  }

  // Utility methods
  private generateTempId(): number {
    // Generate negative IDs for temporary offline records
    return -Math.floor(Math.random() * 1000000);
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Data export/import for backup
  exportOfflineData(): string {
    if (!this.isBrowser()) return '{}';
    
    const data = {
      expenses: this.getOfflineExpenses(),
      pendingActions: this.getPendingActions(),
      lastSync: this.getLastSyncTime(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  importOfflineData(jsonData: string): boolean {
    if (!this.isBrowser()) return false;
    
    try {
      const data = JSON.parse(jsonData);
      
      if (data.expenses) {
        this.saveOfflineExpenses(data.expenses);
      }
      
      if (data.pendingActions) {
        localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(data.pendingActions));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing offline data:', error);
      return false;
    }
  }

  // Clear all offline data
  clearAllOfflineData(): void {
    if (!this.isBrowser()) return;
    
    localStorage.removeItem(this.STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(this.STORAGE_KEYS.PENDING_ACTIONS);
    localStorage.removeItem(this.STORAGE_KEYS.LAST_SYNC);
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isBrowser()) return { used: 0, available: 0, percentage: 0 };
    
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          totalSize += localStorage[key].length;
        }
      }
      
      // Rough estimate of localStorage limit (5MB typically)
      const estimatedLimit = 5 * 1024 * 1024;
      const percentage = (totalSize / estimatedLimit) * 100;
      
      return {
        used: totalSize,
        available: estimatedLimit - totalSize,
        percentage: Math.min(percentage, 100)
      };
    } catch (error) {
      console.error('Error calculating storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}