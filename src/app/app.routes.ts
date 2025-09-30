import { Routes } from '@angular/router';
import { ExpenseListComponent } from './components/expense-list/expense-list';
import { ExpenseFormComponent } from './components/expense-form/expense-form';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';

export const routes: Routes = [
  { path: '', redirectTo: 'expenses', pathMatch: 'full' },
  { path: 'expenses', component: ExpenseListComponent },
  { path: 'add', component: ExpenseFormComponent },
  { path: 'edit/:id', component: ExpenseFormComponent },
  { path: 'summary', component: ExpenseSummaryComponent },
];
