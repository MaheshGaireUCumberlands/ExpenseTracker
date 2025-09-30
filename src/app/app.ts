import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PwaControlsComponent } from './components/pwa-controls/pwa-controls';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PwaControlsComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Advanced Expense Tracker');
  private pwaService = inject(PwaService);

  ngOnInit(): void {
    // PWA service will automatically initialize
    console.log('PWA features initialized');
  }
}
