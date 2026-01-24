// Gemini AI Photo Analysis
// Analyzes vehicle photos to detect condition and issues

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { 
  AIPhotoAnalysis, 
  AIAnalysisSummary, 
  VehicleCondition, 
  VehicleSize,
  DetectedIssue,
  SuggestedAddon 
} from '@/types/booking-photos'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Analyze a single vehicle photo with Gemini
 */
export async function analyzeVehiclePhoto(
  imageBase64: string,
  photoType: 'exterior' | 'interior' | 'problem_area',
  vehicleType?: VehicleSize
): Promise<AIPhotoAnalysis> {
  // Try latest models first: gemini-flash-3-preview (latest), then gemini-2.5-flash, then fallbacks
  // gemini-flash-3-preview is the newest model (as of 2024)
  let model = genAI.getGenerativeModel({ model: 'gemini-flash-3-preview' })

  const prompt = `You are an expert auto detailing professional analyzing a vehicle photo for condition assessment.

Photo Type: ${photoType}
${vehicleType ? `Expected Vehicle Type: ${vehicleType}` : ''}

Analyze this ${photoType} photo and provide a detailed assessment in JSON format:

{
  "vehicle_visible": boolean,
  "condition_assessment": "lightly_dirty" | "moderately_dirty" | "heavily_soiled" | "extreme",
  "detected_issues": ["pet_hair", "food_stains", "mud", etc.],
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your assessment",
  "vehicle_size_detected": "sedan" | "suv" | "truck" | "van" (if visible)
}

Condition Definitions:
- lightly_dirty: Normal daily use, light dust, minor dirt
- moderately_dirty: Noticeable dirt, some stains, pet hair present
- heavily_soiled: Heavy dirt buildup, multiple stains, strong odors visible
- extreme: Extreme cases - sand, flood damage, heavy pet accidents, disaster cleanup

Possible Issues to Detect:
- pet_hair: Visible pet hair on seats/floor
- food_stains: Food or drink stains
- mud: Mud on floor mats or seats
- dirt_buildup: Heavy dirt accumulation
- oxidation: Paint oxidation (exterior)
- swirl_marks: Paint swirls (exterior)
- water_spots: Water spots on paint/glass
- tree_sap: Tree sap on paint
- bird_droppings: Bird droppings
- salt_residue: Salt buildup (winter)
- heavy_grime: General heavy grime

Be conservative with condition assessment - err on the side of caution.
Respond ONLY with valid JSON, no other text.`

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      }
    ])

    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response (sometimes Gemini wraps it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }
    
    const analysis = JSON.parse(jsonMatch[0]) as AIPhotoAnalysis
    
    // Validate response structure
    if (!analysis.condition_assessment || !Array.isArray(analysis.detected_issues)) {
      throw new Error('Invalid analysis structure')
    }
    
    return analysis
  } catch (error: any) {
    console.error('Gemini AI analysis error:', error)
    
    // Try fallback models in order: gemini-2.5-flash -> gemini-1.5-pro -> gemini-pro
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      const fallbackModels = [
        'gemini-2.5-flash',
        'gemini-1.5-pro',
        'gemini-pro'
      ]
      
      for (const modelName of fallbackModels) {
        try {
          console.warn(`Trying fallback model: ${modelName}`)
          const fallbackModel = genAI.getGenerativeModel({ model: modelName })
          const result = await fallbackModel.generateContent([
            prompt,
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
              }
            }
          ])

          const response = await result.response
          const text = response.text()
          
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            throw new Error('No valid JSON found in response')
          }
          
          const analysis = JSON.parse(jsonMatch[0]) as AIPhotoAnalysis
          
          if (!analysis.condition_assessment || !Array.isArray(analysis.detected_issues)) {
            throw new Error('Invalid analysis structure')
          }
          
          console.log(`Successfully used fallback model: ${modelName}`)
          return analysis
        } catch (fallbackError: any) {
          console.warn(`${modelName} also failed:`, fallbackError.message)
          // Continue to next fallback
          continue
        }
      }
      
      // All models failed
      throw new Error(`AI analysis failed: No available models found. Please check your API key and model availability.`)
    }
    
    // Provide helpful error messages based on error type
    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      throw new Error(`AI analysis failed: Invalid API key. Please check your GEMINI_API_KEY environment variable.`)
    }
    
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Analyze multiple photos and generate comprehensive summary
 */
export async function analyzeBookingPhotos(
  photos: Array<{ base64: string, type: 'exterior' | 'interior' | 'problem_area' }>,
  vehicleType?: VehicleSize
): Promise<AIAnalysisSummary> {
  // Analyze each photo
  const analyses = await Promise.all(
    photos.map(photo => analyzeVehiclePhoto(photo.base64, photo.type, vehicleType))
  )

  // Aggregate results
  const allIssues = analyses.flatMap(a => a.detected_issues)
  const uniqueIssues = [...new Set(allIssues)] as DetectedIssue[]
  
  // Determine overall condition (take the worst case)
  const conditionSeverity: Record<VehicleCondition, number> = {
    lightly_dirty: 1,
    moderately_dirty: 2,
    heavily_soiled: 3,
    extreme: 4
  }
  
  const worstCondition = analyses.reduce((worst, analysis) => {
    const currentSeverity = conditionSeverity[analysis.condition_assessment]
    const worstSeverity = conditionSeverity[worst]
    return currentSeverity > worstSeverity ? analysis.condition_assessment : worst
  }, 'lightly_dirty' as VehicleCondition)

  // Check if vehicle size matches across photos
  const detectedSizes = analyses
    .filter(a => a.vehicle_size_detected)
    .map(a => a.vehicle_size_detected!)
  
  const vehicleSizeMatch = !vehicleType || detectedSizes.every(size => size === vehicleType)
  const detectedSize = detectedSizes[0] // Use first detected size

  // Calculate average confidence
  const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length

  // Get pricing adjustment based on condition
  const pricingAdjustments: Record<VehicleCondition, number> = {
    lightly_dirty: 0,
    moderately_dirty: 15,
    heavily_soiled: 25,
    extreme: 40
  }

  return {
    overall_condition: worstCondition,
    vehicle_size_match: vehicleSizeMatch,
    vehicle_size_detected: detectedSize,
    primary_issues: uniqueIssues.slice(0, 5), // Top 5 issues
    recommended_pricing_tier: worstCondition,
    pricing_adjustment: pricingAdjustments[worstCondition],
    photos_analyzed: photos.length,
    confidence: Math.round(avgConfidence * 100) / 100,
    timestamp: new Date().toISOString()
  }
}

/**
 * Map detected issues to suggested add-ons
 */
export function generateAddonSuggestions(
  detectedIssues: DetectedIssue[],
  availableAddons: Array<{ id: string, name: string, keywords?: string[] }>
): SuggestedAddon[] {
  // Issue to addon mapping
  const issueToAddonMap: Record<DetectedIssue, { keywords: string[], priority: 'high' | 'medium' | 'low' }> = {
    pet_hair: { keywords: ['pet', 'hair', 'removal'], priority: 'high' },
    food_stains: { keywords: ['stain', 'removal', 'treatment'], priority: 'high' },
    drink_stains: { keywords: ['stain', 'removal', 'treatment'], priority: 'high' },
    mud: { keywords: ['deep', 'clean', 'interior'], priority: 'medium' },
    dirt_buildup: { keywords: ['deep', 'clean'], priority: 'medium' },
    oxidation: { keywords: ['paint', 'correction', 'polish'], priority: 'high' },
    swirl_marks: { keywords: ['paint', 'correction', 'polish'], priority: 'high' },
    water_spots: { keywords: ['polish', 'detail'], priority: 'low' },
    tree_sap: { keywords: ['detail', 'clean'], priority: 'medium' },
    bird_droppings: { keywords: ['detail', 'clean'], priority: 'medium' },
    salt_residue: { keywords: ['undercarriage', 'wash'], priority: 'low' },
    smoke_smell: { keywords: ['odor', 'elimination', 'ozone'], priority: 'high' },
    heavy_grime: { keywords: ['deep', 'clean', 'detail'], priority: 'medium' }
  }

  const suggestions: SuggestedAddon[] = []

  for (const issue of detectedIssues) {
    const mapping = issueToAddonMap[issue]
    if (!mapping) continue

    // Find matching addons
    for (const addon of availableAddons) {
      const addonNameLower = addon.name.toLowerCase()
      const addonKeywords = addon.keywords?.map(k => k.toLowerCase()) || []
      
      // Check if any mapping keywords match addon name or keywords
      const matches = mapping.keywords.some(keyword => 
        addonNameLower.includes(keyword) || 
        addonKeywords.some(k => k.includes(keyword))
      )

      if (matches && !suggestions.find(s => s.addon_id === addon.id)) {
        suggestions.push({
          addon_id: addon.id,
          addon_name: addon.name,
          reason: issue,
          confidence: 0.85,
          priority: mapping.priority
        })
      }
    }
  }

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return suggestions
}

/**
 * Convert image file to base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert image URL to base64 (for server-side)
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString('base64')
}
