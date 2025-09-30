import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Expense } from '../../models/expense.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.html',
  styleUrls: ['./expense-form.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class ExpenseFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

  constructor(
    private fb: FormBuilder,
    private svc: ExpenseService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().slice(0,10), Validators.required],
      category: ['Other', Validators.required],
      notes: ['']
    });

    const param = this.route.snapshot.paramMap.get('id');
    if (param && isPlatformBrowser(this.platformId)) {
      this.id = +param;
      this.svc.getExpense(this.id).subscribe({
        next: (e) => {
          this.form.patchValue({ ...e, date: e.date?.slice(0,10) });
        },
        error: (error) => {
          console.warn('Could not load expense for editing:', error);
        }
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const payload: Expense = this.form.value;

    if (this.id) {
      payload.id = this.id;
      this.svc.updateExpense(payload).subscribe({
        next: () => {
          this.snackBar.open('Updated', 'Close', { duration: 1400 });
          this.router.navigate(['/expenses']);
        },
        error: (error) => {
          console.error('Error updating expense:', error);
          this.snackBar.open('Error updating expense', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.svc.addExpense(payload).subscribe({
        next: () => {
          this.snackBar.open('Saved', 'Close', { duration: 1400 });
          this.router.navigate(['/expenses']);
        },
        error: (error) => {
          console.error('Error saving expense:', error);
          this.snackBar.open('Error saving expense', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
