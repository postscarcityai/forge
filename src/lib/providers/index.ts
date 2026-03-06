// Provider registry initialization and exports
import { providerRegistry } from './registry'
import { FalProvider } from './fal'
import { getProviderConfig } from '@/config/providers'

// Initialize providers
let initialized = false

export async function initializeProviders(): Promise<void> {
  if (initialized) {
    return
  }

  console.log('🚀 Initializing AI providers...')

  try {
    // Initialize Fal.ai provider
    const falProvider = new FalProvider()
    const falConfig = getProviderConfig('fal')
    
    if (falConfig) {
      // Authenticate the provider
      await falProvider.authenticate({ apiKey: undefined }) // Will use env var
      
      // Register in registry
      providerRegistry.register(falProvider, falConfig)
    } else {
      console.warn('⚠️ Fal.ai configuration not found')
    }

    // TODO: Initialize other providers as they are implemented
    // const pixVerseProvider = new PixVerseProvider()
    // const replicateProvider = new ReplicateProvider()
    // const elevenLabsProvider = new ElevenLabsProvider()

    initialized = true
    
    // Log initialization status
    const stats = providerRegistry.getStats()
    console.log(`✅ Provider initialization complete:`)
    console.log(`   • ${stats.totalProviders} providers registered`)
    console.log(`   • ${stats.availableProviders} providers available`)
    console.log(`   • Services: ${stats.servicesCovered.join(', ')}`)
    
  } catch (error) {
    console.error('❌ Provider initialization failed:', error)
    throw error
  }
}

// Export registry and key functions
export { providerRegistry } from './registry'
export { FalProvider } from './fal'
export * from './types'

// Helper function to get a provider
export function getProvider(name: string) {
  return providerRegistry.getProvider(name)
}

// Helper function to get providers for a service
export function getProvidersForService(serviceType: any) {
  return providerRegistry.getProvidersForService(serviceType)
}

// Helper function to get the best provider
export function getBestProvider(serviceType: any, criteria?: any) {
  return providerRegistry.getBestProvider(serviceType, criteria)
}

// Auto-initialize when module is imported (server-side only)
if (typeof window === 'undefined') {
  initializeProviders().catch(error => {
    console.error('❌ Auto-initialization failed:', error)
  })
} 