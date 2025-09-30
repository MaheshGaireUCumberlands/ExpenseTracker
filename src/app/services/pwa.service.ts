import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, interval } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private swUpdate = inject(SwUpdate);
  private swPush = inject(SwPush);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // PWA installation and update states
  private deferredPrompt: any = null;
  private isInstallable = new BehaviorSubject<boolean>(false);
  private isOnline = new BehaviorSubject<boolean>(navigator.onLine);
  private updateAvailable = new BehaviorSubject<boolean>(false);

  // Public observables
  isInstallable$ = this.isInstallable.asObservable();
  isOnline$ = this.isOnline.asObservable();
  updateAvailable$ = this.updateAvailable.asObservable();

  constructor() {
    this.initializePwaFeatures();
    this.setupUpdateChecks();
    this.setupNetworkStatusTracking();
    this.setupInstallPrompt();
  }

  private initializePwaFeatures(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker not supported');
      return;
    }

    // Check for updates
    this.swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable.next(true);
        this.showUpdateNotification();
      });

    // Handle unrecoverable state
    this.swUpdate.unrecoverable.subscribe(event => {
      this.showErrorNotification(
        'App update failed. Please reload the page.',
        'RELOAD'
      ).onAction().subscribe(() => {
        document.location.reload();
      });
    });
  }

  private setupUpdateChecks(): void {
    if (!this.swUpdate.isEnabled) return;

    // Check for updates every 6 hours
    interval(6 * 60 * 60 * 1000)
      .pipe(switchMap(() => this.swUpdate.checkForUpdate()))
      .subscribe();
  }

  private setupNetworkStatusTracking(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('online', () => {
        this.isOnline.next(true);
        this.showNotification('Back online! 🌐', 'DISMISS', 3000);
      });

      window.addEventListener('offline', () => {
        this.isOnline.next(false);
        this.showNotification('You are offline. Some features may be limited.', 'OK', 5000);
      });
    }
  }

  private setupInstallPrompt(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.isInstallable.next(true);
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.isInstallable.next(false);
        this.showNotification('Expense Tracker installed successfully! 🎉', 'GREAT', 3000);
      });
    }
  }

  // Public methods
  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.isInstallable.next(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  }

  async updateApp(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;

    try {
      await this.swUpdate.activateUpdate();
      this.updateAvailable.next(false);
      document.location.reload();
    } catch (error) {
      console.error('Error updating app:', error);
      this.showErrorNotification('Failed to update app. Please try again.');
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) return false;

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  // Utility methods for notifications
  private showUpdateNotification(): void {
    const snackBarRef = this.snackBar.open(
      'New version available! 🚀',
      'UPDATE',
      {
        duration: 0,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['update-notification']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.updateApp();
    });
  }

  private showNotification(message: string, action = 'OK', duration = 3000) {
    return this.snackBar.open(message, action, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private showErrorNotification(message: string, action = 'OK') {
    return this.snackBar.open(message, action, {
      duration: 0,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-notification']
    });
  }

  // Getters for current state
  get isAppInstallable(): boolean {
    return this.isInstallable.value;
  }

  get isAppOnline(): boolean {
    return this.isOnline.value;
  }

  get hasUpdateAvailable(): boolean {
    return this.updateAvailable.value;
  }

  // Push notification support (for future enhancements)
  get isPushNotificationSupported(): boolean {
    return this.swPush.isEnabled;
  }

  async requestPushNotificationPermission(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting push notification permission:', error);
      return false;
    }
  }
}