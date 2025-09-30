import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { ChartData, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-summary',
  templateUrl: './expense-summary.html',
  styleUrls: ['./expense-summary.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    BaseChartDirective
  ]
})
export class ExpenseSummaryComponent implements OnInit {
  pieData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [] }]
  };
  pieOptions: ChartOptions<'pie'> = { 
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(
    private svc: ExpenseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Initialize with default data first
    this.setDefaultData();
    
    // Only fetch data on the client side to avoid SSR issues
    if (isPlatformBrowser(this.platformId)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.loadExpenseData();
      }, 100);
    }
  }

  private setDefaultData(): void {
    this.pieData = {
      labels: ['Food', 'Travel', 'Bills'],
      datasets: [{
        data: [45.7, 32.5, 78.25],
        backgroundColor: [
          '#FF6384',
          '#36A2EB', 
          '#FFCE56'
        ]
      }]
    };
  }

  hasChartData(): boolean {
    return !!(this.pieData?.labels && this.pieData.labels.length > 0);
  }

  private loadExpenseData(): void {
    // Try to load from API, fallback to default data
    this.svc.getExpenses().subscribe({
      next: (list) => {
        if (list && list.length > 0) {
          const map = new Map<string, number>();
          list.forEach(e => map.set(e.category, (map.get(e.category) || 0) + (e.amount || 0)));
          
          this.pieData = {
            labels: Array.from(map.keys()),
            datasets: [{
              data: Array.from(map.values()),
              backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
              ]
            }]
          };
        } else {
          this.setDefaultData();
        }
      },
      error: (error) => {
        console.warn('Could not connect to API, using default data:', error);
        this.setDefaultData();
      }
    });
  }
}
