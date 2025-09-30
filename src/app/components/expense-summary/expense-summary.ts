import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, effect } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ExpenseStore } from '../../store/expense.store';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-summary',
  templateUrl: './expense-summary.html',
  styleUrls: ['./expense-summary.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule
  ]
})
export class ExpenseSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  
  // Inject the NgRx Signal Store
  private store = inject(ExpenseStore);
  
  // Reactive data from store
  totalExpenses = this.store.totalExpenses;
  monthlyExpenses = this.store.monthlyExpenses;
  expensesByCategory = this.store.expensesByCategory;
  isLoading = this.store.isLoading;
  error = this.store.error;
  
  // Chart data computed from store
  pieData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{ data: [] }]
  };
  
  get debugInfo(): string {
    try {
      const categories = this.expensesByCategory();
      return `Categories: ${categories.length} | Total: $${this.totalExpenses()}`;
    } catch (e) {
      return 'Debug info error';
    }
  }

  ngOnInit(): void {
    // Load expenses and set up reactive updates
    this.store.loadExpenses();
    this.updateChartData();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.createChart();
      this.setupReactiveUpdates();
    }, 100);
  }

  private createChart(): void {
    if (this.chartCanvas?.nativeElement) {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'pie',
          data: this.pieData,
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }
  }

  private setupReactiveUpdates(): void {
    // Watch for changes in expense data and update chart
    effect(() => {
      const categories = this.expensesByCategory();
      this.updateChartData();
      this.updateChart();
    });
  }

  private updateChart(): void {
    if (this.chart) {
      this.chart.data = this.pieData;
      this.chart.update();
    }
  }

  private updateChartData(): void {
    const categories = this.expensesByCategory();
    
    if (categories.length > 0) {
      this.pieData = {
        labels: categories.map(c => c.category),
        datasets: [{
          data: categories.map(c => c.amount),
          backgroundColor: this.generateColors(categories.length)
        }]
      };
    } else {
      // Fallback data when no expenses
      this.pieData = {
        labels: ['No expenses yet'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E0E0E0']
        }]
      };
    }
  }

  private generateColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    return colors.slice(0, count);
  }

  hasChartData(): boolean {
    return !!(this.pieData?.labels && this.pieData.labels.length > 0);
  }

}
