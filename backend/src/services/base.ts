export interface IService {
  init(): Promise<void>;
  dispose(): Promise<void>;
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
}