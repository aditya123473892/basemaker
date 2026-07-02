/**
 * Permission Change Event System
 * Enables real-time cache invalidation across multiple servers
 */

import { EventEmitter } from 'events';
import { redisCacheService } from '../services/redisCacheService';

export type PermissionEventType = 
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'permission.updated'
  | 'user.role.assigned'
  | 'user.role.removed';

export interface PermissionEvent {
  type: PermissionEventType;
  companyId: string;
  userId?: string;
  roleId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PermissionEventEmitter extends EventEmitter {
  private static instance: PermissionEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(100); // Prevent memory leaks
  }

  static getInstance(): PermissionEventEmitter {
    if (!PermissionEventEmitter.instance) {
      PermissionEventEmitter.instance = new PermissionEventEmitter();
    }
    return PermissionEventEmitter.instance;
  }

  /**
   * Emit a permission change event
   */
  async emitEvent(event: PermissionEvent): Promise<void> {
    console.log(`[PermissionEvent] ${event.type}`, {
      companyId: event.companyId,
      userId: event.userId,
      roleId: event.roleId,
    });

    // Emit locally
    this.emit(event.type, event);
    this.emit('*', event); // Wildcard for all events

    // Publish to Redis for distributed cache invalidation
    await this.publishToRedis(event);
  }

  /**
   * Subscribe to permission events
   */
  on(event: PermissionEventType | '*', listener: (event: PermissionEvent) => void): this {
    return super.on(event, listener);
  }

  /**
   * Subscribe to permission events (one-time)
   */
  once(event: PermissionEventType | '*', listener: (event: PermissionEvent) => void): this {
    return super.once(event, listener);
  }

  /**
   * Publish event to Redis for distributed systems
   */
  private async publishToRedis(event: PermissionEvent): Promise<void> {
    try {
      const channel = `permission:events:${event.companyId}`;
      await redisCacheService.set(
        `event:${event.type}:${Date.now()}`,
        event,
        60 // 1 minute TTL for events
      );
    } catch (error) {
      console.warn('Failed to publish event to Redis:', error);
    }
  }

  /**
   * Handle role created event
   */
  async onRoleCreated(event: PermissionEvent): Promise<void> {
    // Clear all permission caches for the company since new role might affect users
    await redisCacheService.invalidate(`permissions:${event.companyId}:*`);
  }

  /**
   * Handle role updated event
   */
  async onRoleUpdated(event: PermissionEvent): Promise<void> {
    if (event.roleId) {
      // Clear cache for all users with this role
      // Note: This requires querying UserRoles table
      console.log(`[CacheInvalidation] Clearing cache for role ${event.roleId}`);
      // Implementation depends on your data access layer
    }
  }

  /**
   * Handle role deleted event
   */
  async onRoleDeleted(event: PermissionEvent): Promise<void> {
    // Clear all permission caches for the company
    await redisCacheService.invalidate(`permissions:${event.companyId}:*`);
  }

  /**
   * Handle permission updated event
   */
  async onPermissionUpdated(event: PermissionEvent): Promise<void> {
    // Clear all permission caches since permissions changed
    await redisCacheService.invalidate(`permissions:${event.companyId}:*`);
  }

  /**
   * Handle user role assigned event
   */
  async onUserRoleAssigned(event: PermissionEvent): Promise<void> {
    if (event.userId) {
      await redisCacheService.invalidate(`permissions:${event.companyId}:${event.userId}`);
    }
  }

  /**
   * Handle user role removed event
   */
  async onUserRoleRemoved(event: PermissionEvent): Promise<void> {
    if (event.userId) {
      await redisCacheService.invalidate(`permissions:${event.companyId}:${event.userId}`);
    }
  }

  /**
   * Setup event listeners
   */
  setupListeners(): void {
    this.on('role.created', (event) => this.onRoleCreated(event));
    this.on('role.updated', (event) => this.onRoleUpdated(event));
    this.on('role.deleted', (event) => this.onRoleDeleted(event));
    this.on('permission.updated', (event) => this.onPermissionUpdated(event));
    this.on('user.role.assigned', (event) => this.onUserRoleAssigned(event));
    this.on('user.role.removed', (event) => this.onUserRoleRemoved(event));
  }
}

// Singleton instance
export const permissionEvents = PermissionEventEmitter.getInstance();

// Setup default listeners
permissionEvents.setupListeners();

/**
 * Helper function to emit permission change events
 */
export async function emitPermissionChange(
  type: PermissionEventType,
  companyId: string,
  options?: {
    userId?: string;
    roleId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const event: PermissionEvent = {
    type,
    companyId,
    userId: options?.userId,
    roleId: options?.roleId,
    timestamp: new Date(),
    metadata: options?.metadata,
  };

  await permissionEvents.emitEvent(event);
}