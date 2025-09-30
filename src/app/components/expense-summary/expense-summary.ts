import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
import { Chart, ChartData } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-summary',
  templateUrl: './expense-summary.html',
  styleUrls: ['./expense-summary.scss'],
  imports: [
    CommonModule,
    MatCardModule
  ]
})
export class ExpenseSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  pieData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{ data: [] }]
  };
  
  get debugInfo(): string {
    try {
      const labels = this.pieData?.labels || [];
      const data = this.pieData?.datasets?.[0]?.data || [];
      return `Labels: ${labels.join(', ')} | Data: ${data.join(', ')}`;
    } catch (e) {
      return 'Debug info error';
    }
  }

  constructor(private svc: ExpenseService) {}

  ngOnInit(): void {
    // Initialize with default data first
    this.setDefaultData();
    this.loadExpenseData();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.createChart();
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

  private updateChart(): void {
    if (this.chart) {
      this.chart.data = this.pieData;
      this.chart.update();
    }
  }

  private setDefaultData(): void {
    console.log('Setting default chart data');
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
    console.log('Default chart data set:', this.pieData);
  }

  hasChartData(): boolean {
    return !!(this.pieData?.labels && this.pieData.labels.length > 0);
  }

  private loadExpenseData(): void {
    // Try to load from API, fallback to default data
    this.svc.getExpenses().subscribe({
      next: (list: Expense[]) => {
        if (list && list.length > 0) {
          const map = new Map<string, number>();
          list.forEach((e: Expense) => map.set(e.category, (map.get(e.category) || 0) + (e.amount || 0)));
          
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
          this.updateChart();
        } else {
          this.setDefaultData();
        }
      },
      error: (error: any) => {
        console.warn('Could not connect to API, using default data:', error);
        this.setDefaultData();
      }
    });
  }
}
