import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
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
  total = 0;

  constructor(
    private svc: ExpenseService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.svc.getExpenses().subscribe(list => {
      list.sort((a,b) => +new Date(b.date) - +new Date(a.date));
      this.dataSource.data = list;
      this.total = list.reduce((s, e) => s + (e.amount || 0), 0);
    });
  }

  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  edit(e: Expense) {
    this.router.navigate(['/edit', e.id]);
  }

  delete(id: number | undefined) {
    if (!id) return;
    if (!confirm('Delete expense?')) return;
    this.svc.deleteExpense(id).subscribe(() => {
      this.snackBar.open('Deleted', 'Close', { duration: 1500 });
      this.load();
    });
  }
}
