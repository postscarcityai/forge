import { 
  AIProvider, 
  AIServiceType, 
  SelectionCriteria, 
  ProviderStatus,
  ProviderConfig 
} from './types'

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map()
  private configs: Map<string, ProviderConfig> = new Map()
  private status: Map<string, ProviderStatus> = new Map()

  /**
   * Register a provider in the registry
   */
  register(provider: AIProvider, config: ProviderConfig): void {
    if (this.providers.has(provider.name)) {
      console.warn(`Provider ${provider.name} is already registered. Overwriting.`)
    }
    
    this.providers.set(provider.name, provider)
    this.configs.set(provider.name, config)
    
    // Initialize status
    this.status.set(provider.name, {
      provider: provider.name,
      available: true,
      lastChecked: new Date()
    })
    
    console.log(`✅ Registered provider: ${provider.name}`)
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): AIProvider | null {
    return this.providers.get(name) || null
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get providers that support a specific service type
   */
  getProvidersForService(serviceType: AIServiceType): AIProvider[] {
    return Array.from(this.providers.values()).filter(provider =>
      provider.supportedServices.includes(serviceType)
    )
  }

  /**
   * Get the best provider for a service based on selection criteria
   */
  getBestProvider(
    serviceType: AIServiceType,
    criteria: SelectionCriteria = {}
  ): AIProvider | null {
    // If specific provider requested, return it
    if (criteria.provider) {
      const provider = this.getProvider(criteria.provider)
      if (provider && provider.supportedServices.includes(serviceType)) {
        return provider
      }
      console.warn(`Requested provider ${criteria.provider} not found or doesn't support ${serviceType}`)
    }

    // Get all providers that support this service
    const availableProviders = this.getProvidersForService(serviceType)
    if (availableProviders.length === 0) {
      return null
    }

    // For now, return the first available provider
    // TODO: Implement ranking based on criteria (budget, speed, quality)
    return this.rankProviders(availableProviders, criteria)[0] || null
  }

  /**
   * Rank providers based on selection criteria
   */
  private rankProviders(providers: AIProvider[], criteria: SelectionCriteria): AIProvider[] {
    // Simple ranking for now - just return providers in order of availability
    return providers.filter(provider => {
      const status = this.status.get(provider.name)
      return status?.available !== false
    })
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(name: string): boolean {
    const status = this.status.get(name)
    return status?.available !== false
  }

  /**
   * Update provider status
   */
  updateProviderStatus(name: string, status: Partial<ProviderStatus>): void {
    const currentStatus = this.status.get(name)
    if (currentStatus) {
      this.status.set(name, {
        ...currentStatus,
        ...status,
        lastChecked: new Date()
      })
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(name: string): ProviderStatus | null {
    return this.status.get(name) || null
  }

  /**
   * Get all provider statuses
   */
  getAllProviderStatus(): ProviderStatus[] {
    return Array.from(this.status.values())
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(name: string): ProviderConfig | null {
    return this.configs.get(name) || null
  }

  /**
   * List all registered provider names
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Remove a provider from registry
   */
  unregister(name: string): boolean {
    const hasProvider = this.providers.has(name)
    this.providers.delete(name)
    this.configs.delete(name)
    this.status.delete(name)
    
    if (hasProvider) {
      console.log(`🗑️ Unregistered provider: ${name}`)
    }
    
    return hasProvider
  }

  /**
   * Check health of all providers
   */
  async checkProviderHealth(): Promise<ProviderStatus[]> {
    const healthChecks = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        const start = Date.now()
        
        // For now, just check if provider exists and has required methods
        const isHealthy = typeof provider.authenticate === 'function' &&
                         provider.supportedServices.length > 0
        
        const responseTime = Date.now() - start
        
        const status: ProviderStatus = {
          provider: name,
          available: isHealthy,
          responseTime,
          errorRate: 0,
          lastChecked: new Date()
        }
        
        this.updateProviderStatus(name, status)
        return status
      } catch (error) {
        const status: ProviderStatus = {
          provider: name,
          available: false,
          responseTime: 0,
          errorRate: 100,
          lastChecked: new Date()
        }
        
        this.updateProviderStatus(name, status)
        return status
      }
    })

    return Promise.all(healthChecks)
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    totalProviders: number
    availableProviders: number
    servicesCovered: AIServiceType[]
  } {
    const totalProviders = this.providers.size
    const availableProviders = Array.from(this.status.values())
      .filter(status => status.available).length
    
    const servicesCovered = Array.from(
      new Set(
        Array.from(this.providers.values())
          .flatMap(provider => provider.supportedServices)
      )
    )

    return {
      totalProviders,
      availableProviders,
      servicesCovered
    }
  }
}

// Global registry instance
export const providerRegistry = new ProviderRegistry() 