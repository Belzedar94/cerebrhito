export interface ServiceStatus {
  status: 'up' | 'down';
  version?: string;
  error?: string;
  [key: string]: any;
}

export interface IService {
  init(): Promise<void>;
  dispose(): Promise<void>;
  testConnection(): Promise<boolean>;
  getDetailedStatus(): Promise<ServiceStatus>;
  getName(): string;
  getVersion(): string;
}

export abstract class BaseService implements IService {
  protected name: string;
  protected version: string;

  constructor(name: string, version = '1.0.0') {
    this.name = name;
    this.version = version;
  }

  abstract init(): Promise<void>;
  abstract dispose(): Promise<void>;

  /**
   * Basic connection test
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.init();
      return true;
    } catch (error) {
      logger.error(`Connection test failed for ${this.name}`, error);
      return false;
    }
  }

  /**
   * Get detailed status of the service
   */
  async getDetailedStatus(): Promise<ServiceStatus> {
    try {
      const isConnected = await this.testConnection();
      return {
        status: isConnected ? 'up' : 'down',
        version: this.version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to get status for ${this.name}`, error);
      return {
        status: 'down',
        version: this.version,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get service version
   */
  getVersion(): string {
    return this.version;
  }
}

export class ServiceLocator {
  private static instance: ServiceLocator;
  private services: Map<string, IService> = new Map();

  private constructor() {}

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  register(name: string, service: IService): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.services.set(name, service);
  }

  get<T extends IService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  async initializeAll(): Promise<void> {
    for (const service of this.services.values()) {
      await service.init();
    }
  }

  async disposeAll(): Promise<void> {
    for (const service of this.services.values()) {
      await service.dispose();
    }
    this.services.clear();
  }

  /**
   * Get basic health status of all services
   */
  async getHealthStatus(): Promise<{ [key: string]: 'up' | 'down' }> {
    const status: { [key: string]: 'up' | 'down' } = {};
    for (const [name, service] of this.services.entries()) {
      try {
        status[name] = await service.testConnection() ? 'up' : 'down';
      } catch (error) {
        status[name] = 'down';
      }
    }
    return status;
  }

  /**
   * Get detailed status of all services
   */
  async getDetailedStatus(): Promise<{ [key: string]: ServiceStatus }> {
    const status: { [key: string]: ServiceStatus } = {};
    for (const [name, service] of this.services.entries()) {
      try {
        status[name] = await service.getDetailedStatus();
      } catch (error) {
        status[name] = {
          status: 'down',
          version: service.getVersion(),
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    return status;
  }

  /**
   * Get list of registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if a specific service is registered
   */
  hasService(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get service instance if it exists and is initialized
   */
  getInitializedService<T extends IService>(name: string): Promise<T> {
    const service = this.get<T>(name);
    return service.init().then(() => service);
  }
}