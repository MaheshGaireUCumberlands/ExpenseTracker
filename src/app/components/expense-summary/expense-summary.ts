import { Component, OnInit } from '@angular/core';
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
  pieOptions: ChartOptions<'pie'> = { responsive: true };

  constructor(private svc: ExpenseService) {}

  ngOnInit(): void {
    this.svc.getExpenses().subscribe(list => {
      const map = new Map<string, number>();
      list.forEach(e => map.set(e.category, (map.get(e.category) || 0) + (e.amount || 0)));
      this.pieData.labels = Array.from(map.keys());
      this.pieData.datasets[0].data = Array.from(map.values());
    });
  }
}
