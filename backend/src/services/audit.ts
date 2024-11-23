import type { SupabaseClient } from '@supabase/supabase-js';
import type { IService } from './base';
import { logger } from '../utils/logger';
import { AppError } from '../errors/types';

interface AuditConfig {
  client: SupabaseClient;
}

interface AuditEvent {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  error?: string;
}

export class AuditService implements IService {
  private client: SupabaseClient;

  constructor(config: AuditConfig) {
    this.client = config.client;
  }

  async init(): Promise<void> {
    try {
      // Verify table exists
      const { error } = await this.client.from('audit_logs').select('id').limit(1);

      if (error) {
        throw error;
      }

      logger.info('Audit service initialized');
    } catch (error) {
      logger.error('Failed to initialize audit service', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // No cleanup needed
  }

  /**
   * Log an audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const { error } = await this.client.from('audit_logs').insert({
        user_id: event.userId,
        action: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId,
        details: event.details,
        ip: event.ip,
        user_agent: event.userAgent,
        status: event.status,
        error: event.error,
      });

      if (error) {
        throw error;
      }

      // Log high-risk events
      if (this.isHighRiskEvent(event)) {
        logger.warn('High-risk audit event', event);
      }
    } catch (error) {
      logger.error('Error logging audit event', { error, event });
      throw AppError.auditError('Failed to log audit event', error);
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
      resourceType?: string;
      status?: 'success' | 'failure';
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      let query = this.client
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.action) {
        query = query.eq('action', options.action);
      }

      if (options?.resourceType) {
        query = query.eq('resource_type', options.resourceType);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting user audit logs', { error, userId, options });
      throw AppError.auditError('Failed to get user audit logs', error);
    }
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceLogs(
    resourceType: string,
    resourceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
      status?: 'success' | 'failure';
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      let query = this.client
        .from('audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.action) {
        query = query.eq('action', options.action);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting resource audit logs', {
        error,
        resourceType,
        resourceId,
        options,
      });
      throw AppError.auditError('Failed to get resource audit logs', error);
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(options?: {
    startDate?: Date;
    endDate?: Date;
    severity?: 'low' | 'medium' | 'high';
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      let query = this.client
        .from('audit_logs')
        .select('*')
        .eq('status', 'failure')
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.severity) {
        const highRiskActions = this.getHighRiskActions();
        const mediumRiskActions = this.getMediumRiskActions();

        switch (options.severity) {
          case 'high':
            query = query.in('action', highRiskActions);
            break;
          case 'medium':
            query = query.in('action', mediumRiskActions);
            break;
          case 'low':
            query = query.not('action', 'in', [...highRiskActions, ...mediumRiskActions]);
            break;
        }
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting security events', { error, options });
      throw AppError.auditError('Failed to get security events', error);
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    resourceType?: string;
  }): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
    topResources: { resourceType: string; count: number }[];
    topErrors: { error: string; count: number }[];
  }> {
    try {
      let baseQuery = this.client.from('audit_logs').select('*');

      if (options?.startDate) {
        baseQuery = baseQuery.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        baseQuery = baseQuery.lte('created_at', options.endDate.toISOString());
      }

      if (options?.userId) {
        baseQuery = baseQuery.eq('user_id', options.userId);
      }

      if (options?.resourceType) {
        baseQuery = baseQuery.eq('resource_type', options.resourceType);
      }

      // Get total events
      const { count: totalEvents } = await baseQuery.count();

      // Get successful events
      const { count: successfulEvents } = await baseQuery.eq('status', 'success').count();

      // Get failed events
      const { count: failedEvents } = await baseQuery.eq('status', 'failure').count();

      // Get unique users
      const { count: uniqueUsers } = await baseQuery
        .select('user_id')
        .not('user_id', 'is', null)
        .limit(1);

      // Get top actions
      const { data: topActions } = await baseQuery
        .select('action')
        .not('action', 'is', null)
        .limit(10);

      const actionCounts = topActions?.reduce(
        (acc, { action }) => {
          acc[action] = (acc[action] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>
      );

      // Get top resources
      const { data: topResources } = await baseQuery
        .select('resource_type')
        .not('resource_type', 'is', null)
        .limit(10);

      const resourceCounts = topResources?.reduce(
        (acc, { resource_type }) => {
          acc[resource_type] = (acc[resource_type] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>
      );

      // Get top errors
      const { data: topErrors } = await baseQuery
        .select('error')
        .not('error', 'is', null)
        .limit(10);

      const errorCounts = topErrors?.reduce(
        (acc, { error }) => {
          acc[error] = (acc[error] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalEvents: totalEvents || 0,
        successfulEvents: successfulEvents || 0,
        failedEvents: failedEvents || 0,
        uniqueUsers: uniqueUsers || 0,
        topActions: Object.entries(actionCounts || {})
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count),
        topResources: Object.entries(resourceCounts || {})
          .map(([resourceType, count]) => ({ resourceType, count }))
          .sort((a, b) => b.count - a.count),
        topErrors: Object.entries(errorCounts || {})
          .map(([error, count]) => ({ error, count }))
          .sort((a, b) => b.count - a.count),
      };
    } catch (error) {
      logger.error('Error getting audit statistics', { error, options });
      throw AppError.auditError('Failed to get audit statistics', error);
    }
  }

  /**
   * Check if an event is high risk
   */
  private isHighRiskEvent(event: AuditEvent): boolean {
    // Check if action is high risk
    if (this.getHighRiskActions().includes(event.action)) {
      return true;
    }

    // Check if there are multiple failures
    if (event.status === 'failure') {
      return true;
    }

    // Check for suspicious patterns
    if (event.details) {
      // Check for unusual IP addresses
      if (event.ip && this.isUnusualIP(event.ip)) {
        return true;
      }

      // Check for unusual user agents
      if (event.userAgent && this.isUnusualUserAgent(event.userAgent)) {
        return true;
      }

      // Check for sensitive data access
      if (this.containsSensitiveData(event.details)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get high risk actions
   */
  private getHighRiskActions(): string[] {
    return [
      'delete_user',
      'update_user_role',
      'reset_password',
      'update_security_settings',
      'delete_child',
      'update_subscription',
      'update_payment_info',
      'bulk_delete',
      'export_data',
      'import_data',
      'update_system_settings',
    ];
  }

  /**
   * Get medium risk actions
   */
  private getMediumRiskActions(): string[] {
    return [
      'create_user',
      'update_user',
      'create_child',
      'update_child',
      'create_activity',
      'update_activity',
      'create_milestone',
      'update_milestone',
      'upload_media',
      'delete_media',
    ];
  }

  /**
   * Check if an IP address is unusual
   */
  private isUnusualIP(ip: string): boolean {
    // Check if IP is from known malicious ranges
    const maliciousRanges = [
      '0.0.0.0/8',
      '10.0.0.0/8',
      '100.64.0.0/10',
      '127.0.0.0/8',
      '169.254.0.0/16',
      '172.16.0.0/12',
      '192.0.0.0/24',
      '192.0.2.0/24',
      '192.88.99.0/24',
      '192.168.0.0/16',
      '198.18.0.0/15',
      '198.51.100.0/24',
      '203.0.113.0/24',
      '224.0.0.0/4',
      '240.0.0.0/4',
      '255.255.255.255/32',
    ];

    return maliciousRanges.some(range => this.isIPInRange(ip, range));
  }

  /**
   * Check if an IP is in a range
   */
  private isIPInRange(ip: string, range: string): boolean {
    const [rangeIP, bits] = range.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1);
    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(rangeIP);

    return (ipNum & mask) === (rangeNum & mask);
  }

  /**
   * Convert IP to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  }

  /**
   * Check if a user agent is unusual
   */
  private isUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /postman/i,
      /python/i,
      /java/i,
      /node/i,
      /php/i,
      /ruby/i,
      /go-http/i,
      /burp/i,
      /nikto/i,
      /nmap/i,
      /sqlmap/i,
      /w3af/i,
      /acunetix/i,
      /nessus/i,
      /metasploit/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check if data contains sensitive information
   */
  private containsSensitiveData(data: Record<string, any>): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /credit.*card/i,
      /card.*number/i,
      /cvv/i,
      /ssn/i,
      /social.*security/i,
      /bank.*account/i,
      /routing.*number/i,
      /passport/i,
      /license/i,
      /medical/i,
      /health/i,
      /diagnosis/i,
      /treatment/i,
    ];

    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return sensitivePatterns.some(pattern => pattern.test(value));
      }

      if (Array.isArray(value)) {
        return value.some(checkValue);
      }

      if (value && typeof value === 'object') {
        return Object.keys(value).some(key => sensitivePatterns.some(pattern => pattern.test(key)));
      }

      return false;
    };

    return checkValue(data);
  }
}
