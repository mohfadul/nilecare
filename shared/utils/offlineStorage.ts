/**
 * Offline Storage Utility
 * 
 * Handles offline-first data storage and synchronization
 * For healthcare facilities with intermittent internet connectivity
 * 
 * Features:
 * - Local data persistence
 * - Change tracking
 * - Conflict detection
 * - Priority-based sync
 */

export interface OfflineChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  synced: boolean;
  retryCount: number;
}

export interface OfflineQueue {
  facilityId: string;
  changes: OfflineChange[];
  lastSyncAttempt?: Date;
  nextSyncAt?: Date;
}

/**
 * Offline Storage Manager
 * Manages local storage for offline-first functionality
 */
export class OfflineStorageManager {
  private storageKey: string;

  constructor(facilityId: string) {
    this.storageKey = `offline_queue_${facilityId}`;
  }

  /**
   * Add change to offline queue
   */
  async addChange(change: Omit<OfflineChange, 'id' | 'synced' | 'retryCount'>): Promise<string> {
    const queue = await this.getQueue();
    
    const newChange: OfflineChange = {
      ...change,
      id: this.generateId(),
      synced: false,
      retryCount: 0
    };

    queue.changes.push(newChange);
    await this.saveQueue(queue);

    return newChange.id;
  }

  /**
   * Get offline queue
   */
  async getQueue(): Promise<OfflineQueue> {
    try {
      // In browser environment, use IndexedDB
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        return await this.getFromIndexedDB();
      }

      // In Node.js, use file system or database
      return await this.getFromFileSystem();
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return {
        facilityId: this.storageKey.split('_')[2],
        changes: []
      };
    }
  }

  /**
   * Save queue
   */
  async saveQueue(queue: OfflineQueue): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        await this.saveToIndexedDB(queue);
      } else {
        await this.saveToFileSystem(queue);
      }
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Get pending changes (not synced)
   */
  async getPendingChanges(): Promise<OfflineChange[]> {
    const queue = await this.getQueue();
    return queue.changes.filter(c => !c.synced);
  }

  /**
   * Mark change as synced
   */
  async markAsSynced(changeId: string): Promise<void> {
    const queue = await this.getQueue();
    const change = queue.changes.find(c => c.id === changeId);
    
    if (change) {
      change.synced = true;
      await this.saveQueue(queue);
    }
  }

  /**
   * Mark change as failed (increment retry count)
   */
  async markAsFailed(changeId: string): Promise<void> {
    const queue = await this.getQueue();
    const change = queue.changes.find(c => c.id === changeId);
    
    if (change) {
      change.retryCount++;
      await this.saveQueue(queue);
    }
  }

  /**
   * Remove synced changes older than retention period
   */
  async cleanupSyncedChanges(retentionDays: number = 7): Promise<number> {
    const queue = await this.getQueue();
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const originalLength = queue.changes.length;
    queue.changes = queue.changes.filter(c => 
      !c.synced || new Date(c.timestamp) > cutoffDate
    );
    
    const removed = originalLength - queue.changes.length;
    
    if (removed > 0) {
      await this.saveQueue(queue);
    }

    return removed;
  }

  /**
   * Get queue statistics
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
    byPriority: Record<'high' | 'medium' | 'low', number>;
    oldestPending?: Date;
  }> {
    const queue = await this.getQueue();
    
    const pending = queue.changes.filter(c => !c.synced);
    const synced = queue.changes.filter(c => c.synced);
    const failed = queue.changes.filter(c => c.retryCount > 3);

    const byPriority = {
      high: pending.filter(c => c.priority === 'high').length,
      medium: pending.filter(c => c.priority === 'medium').length,
      low: pending.filter(c => c.priority === 'low').length
    };

    const oldestPending = pending.length > 0
      ? new Date(Math.min(...pending.map(c => new Date(c.timestamp).getTime())))
      : undefined;

    return {
      total: queue.changes.length,
      pending: pending.length,
      synced: synced.length,
      failed: failed.length,
      byPriority,
      oldestPending
    };
  }

  /**
   * IndexedDB operations (browser)
   */
  private async getFromIndexedDB(): Promise<OfflineQueue> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NileCareOfflineDB', 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineQueue'], 'readonly');
        const store = transaction.objectStore('offlineQueue');
        const getRequest = store.get(this.storageKey);

        getRequest.onsuccess = () => {
          resolve(getRequest.result || {
            facilityId: this.storageKey.split('_')[2],
            changes: []
          });
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'facilityId' });
        }
      };
    });
  }

  /**
   * Save to IndexedDB
   */
  private async saveToIndexedDB(queue: OfflineQueue): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NileCareOfflineDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineQueue'], 'readwrite');
        const store = transaction.objectStore('offlineQueue');
        const putRequest = store.put(queue);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * File system operations (Node.js)
   */
  private async getFromFileSystem(): Promise<OfflineQueue> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'offline', `${this.storageKey}.json`);
      
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - return empty queue
        return {
          facilityId: this.storageKey.split('_')[2],
          changes: []
        };
      }
      throw error;
    }
  }

  /**
   * Save to file system
   */
  private async saveToFileSystem(queue: OfflineQueue): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    const dir = path.join(process.cwd(), 'data', 'offline');
    const filePath = path.join(dir, `${this.storageKey}.json`);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, JSON.stringify(queue, null, 2), 'utf8');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Priority determination for offline changes
 */
export function determineChangePriority(
  entityType: string,
  operation: 'create' | 'update' | 'delete'
): 'high' | 'medium' | 'low' {
  // High priority: Critical clinical data
  const highPriorityEntities = ['medication', 'diagnostic', 'encounter', 'alert', 'vital-signs'];
  if (highPriorityEntities.includes(entityType)) {
    return 'high';
  }

  // Medium priority: Important clinical documentation
  const mediumPriorityEntities = ['soap-note', 'progress-note', 'problem-list'];
  if (mediumPriorityEntities.includes(entityType)) {
    return 'medium';
  }

  // Low priority: Administrative data
  return 'low';
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof window !== 'undefined' && 'navigator' in window) {
    return navigator.onLine;
  }
  // In Node.js, assume online (server environment)
  return true;
}

/**
 * Network status monitoring
 */
export class NetworkStatusMonitor {
  private listeners: Array<(online: boolean) => void> = [];
  private isOnline: boolean = true;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize network monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        console.log('✅ Network connection restored');
        this.isOnline = true;
        this.notifyListeners(true);
      });

      window.addEventListener('offline', () => {
        console.log('⚠️  Network connection lost - switching to offline mode');
        this.isOnline = false;
        this.notifyListeners(false);
      });
    }
  }

  /**
   * Add listener for network status changes
   */
  addListener(callback: (online: boolean) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (online: boolean) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(online);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Get current status
   */
  getStatus(): boolean {
    return this.isOnline;
  }
}

export default {
  OfflineStorageManager,
  determineChangePriority,
  isOnline,
  NetworkStatusMonitor
};

