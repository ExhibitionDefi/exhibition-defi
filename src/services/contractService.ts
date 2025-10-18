import { ExhibitionFormatters } from '../utils/exFormatters'

export class ContractService {
  static async estimateGas(
    contract: any,
    functionName: string,
    args: any[],
    overrides: any = {}
  ) {
    try {
      return await contract.estimateGas[functionName](...args, overrides)
    } catch (error) {
      console.error(`Gas estimation failed for ${functionName}:`, error)
      throw error
    }
  }

  static async simulateTransaction(
    contract: any,
    functionName: string,
    args: any[],
    overrides: any = {}
  ) {
    try {
      return await contract.callStatic[functionName](...args, overrides)
    } catch (error) {
      const errorMessage = ExhibitionFormatters.parseContractError(error)
      throw new Error(`Transaction simulation failed: ${errorMessage}`)
    }
  }

  static prepareTransactionOptions(gasLimit?: bigint, gasPrice?: bigint) {
    const options: any = {}
    
    if (gasLimit) {
      options.gasLimit = gasLimit
    }
    
    if (gasPrice) {
      options.gasPrice = gasPrice
    }
    
    return options
  }

  static async validateProjectCreation(_formData: any) {
    try {

      return true
    } catch (error) {
      console.error('Project validation failed:', error)
      throw error
    }
  }  

  static async prepareProjectParams(formData: any, decimals: { project: number; contribution: number }) {
    try {
      return ExhibitionFormatters.prepareProjectCreationParams(formData, decimals)
    } catch (error) {
      console.error('Parameter preparation failed:', error)
      throw error
    }
  }

  static parseError(error: any): string {
    const result = ExhibitionFormatters.parseContractError(error)
    return result.message // Extract the message string from the object
  }

  static debugParams(formData: any, params: any, contributionDecimals: number) {
    // Simple debug logging since debugContractParams doesn't exist
    console.log('Debug Contract Params:', {
      formData,
      params,
      contributionDecimals,
      timestamp: new Date().toISOString()
    })
  }
}