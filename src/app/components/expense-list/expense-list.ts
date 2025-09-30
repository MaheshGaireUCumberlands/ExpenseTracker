import { Component, OnInit, Inject, PLATFORM_ID, inject, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExpenseStore } from '../../store/expense.store';
import { Expense } from '../../models/expense.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.html',
  styleUrls: ['./expense-list.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule
  ]
})
export class ExpenseListComponent implements OnInit {
  displayedColumns = ['date', 'title', 'category', 'amount', 'actions'];
  dataSource = new MatTableDataSource<Expense>([]);
  
  // Inject the NgRx Signal Store
  private store = inject(ExpenseStore);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Reactive data from store
  expenses = this.store.filteredExpenses;
  total = this.store.totalExpenses;
  isLoading = this.store.isLoading;
  error = this.store.error;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Update table data source when expenses change - must be in constructor for proper injection context
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const expenses = this.expenses();
        this.dataSource.data = expenses;
      });
    }
  }

  ngOnInit(): void {
    // Only load data on the client side to prevent SSR errors
    if (isPlatformBrowser(this.platformId)) {
      this.store.loadExpenses();
    }
  }

  applyFilter(value: string) {
    this.store.setSearchFilter(value.trim());
  }

  edit(e: Expense) {
    this.router.navigate(['/edit', e.id]);
  }

  async delete(id: number | undefined) {
    if (!id) return;
    if (!confirm('Delete expense?')) return;
    
    try {
      await this.store.deleteExpense(id);
      this.snackBar.open('Deleted', 'Close', { duration: 1500 });
    } catch (error) {
      this.snackBar.open('Error deleting expense', 'Close', { duration: 3000 });
    }
  }
}
