import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-pwa-controls',
  template: `
    <div class="pwa-controls">
      <!-- Network Status -->
      <div class="network-status" [class.offline]="!pwaService.isAppOnline">
        <mat-icon [matTooltip]="pwaService.isAppOnline ? 'Online' : 'Offline'">
          {{ pwaService.isAppOnline ? 'wifi' : 'wifi_off' }}
        </mat-icon>
        <span class="status-text">
          {{ pwaService.isAppOnline ? 'Online' : 'Offline' }}
        </span>
      </div>

      <!-- Install Button -->
      @if (pwaService.isAppInstallable) {
        <button
          mat-mini-fab
          color="primary"
          matTooltip="Install App"
          (click)="installApp()"
          class="install-button">
          <mat-icon>get_app</mat-icon>
        </button>
      }

      <!-- Update Button -->
      @if (pwaService.hasUpdateAvailable) {
        <button
          mat-mini-fab
          color="accent"
          matTooltip="Update Available"
          (click)="updateApp()"
          class="update-button">
          <mat-icon>system_update</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .pwa-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 1000;
    }

    .network-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 20px;
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;

      &.offline {
        background: rgba(244, 67, 54, 0.1);
        color: #f44336;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .install-button, .update-button {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .update-button {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .pwa-controls {
        top: 10px;
        right: 10px;
        gap: 8px;
      }

      .status-text {
        display: none;
      }
    }
  `],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class PwaControlsComponent {
  pwaService = inject(PwaService);

  async installApp(): Promise<void> {
    const installed = await this.pwaService.installApp();
    if (!installed) {
      console.log('App installation was cancelled or failed');
    }
  }

  async updateApp(): Promise<void> {
    await this.pwaService.updateApp();
  }
}