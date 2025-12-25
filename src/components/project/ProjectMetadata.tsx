// src/components/project/ProjectMetadata.tsx
import React, { useState, useEffect } from 'react'
import { Edit2, X, Save, Twitter, Globe, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { sanitizeUrl } from '../../utils/sanitization'
import { logger } from '../../utils/logger'
import { apiClient } from '../../utils/api'

interface ProjectMetadata {
  twitter?: string
  website?: string
  overview?: string
  lastUpdated?: number
}

interface ProjectMetadataProps {
  projectId: string
  isProjectOwner: boolean
  projectOwner: string
}

const MAX_OVERVIEW_LENGTH = 500
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const ProjectMetadata: React.FC<ProjectMetadataProps> = ({
  projectId,
  isProjectOwner,
  projectOwner
}) => {
  const [metadata, setMetadata] = useState<ProjectMetadata>({})
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [editForm, setEditForm] = useState<ProjectMetadata>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    twitter?: string
    website?: string
  }>({})

  // Load metadata from storage on mount
  useEffect(() => {
    loadMetadata()
  }, [projectId])

  const loadMetadata = async () => {
    setIsLoading(true)
    setError(null)
  
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/metadata`)
    
      if (response.status === 404) {
        // No metadata yet - this is fine
        setIsLoading(false)
        return
      }
    
      if (!response.ok) {
        throw new Error('Failed to fetch metadata')
      }
    
      const result = await response.json()
      if (result.success && result.data) {
        setMetadata(result.data)
        logger.info('Metadata loaded successfully', { projectId })
      }
    } catch (err) {
      logger.warn('Error loading metadata:', err)
    } finally {
      setIsLoading(false)
   }
  }

  const validateUrl = (url: string, type: 'twitter' | 'website'): string | null => {
    if (!url.trim()) return null // Empty is valid (optional field)

    // Basic URL format validation
    try {
      const urlObj = new URL(url)
      
      // Twitter validation
      if (type === 'twitter') {
        if (!urlObj.hostname.includes('twitter.com') && !urlObj.hostname.includes('x.com')) {
          return 'Must be a valid Twitter/X URL (twitter.com or x.com)'
        }
      }
      
      // Website validation - just ensure it's http/https
      if (type === 'website') {
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return 'Website must use http:// or https://'
        }
      }
      
      return null // Valid
    } catch {
      return 'Please enter a valid URL (e.g., https://example.com)'
    }
  }

  const handleEditClick = () => {
    setEditForm({ ...metadata })
    setValidationErrors({})
    setError(null)
    setIsEditingMetadata(true)
  }

  const handleCancel = () => {
    setEditForm({})
    setValidationErrors({})
    setError(null)
    setIsEditingMetadata(false)
  }

  const handleSaveMetadata = async () => {
    // Validate all fields
    const errors: { twitter?: string; website?: string } = {}
  
    if (editForm.twitter) {
      const twitterError = validateUrl(editForm.twitter, 'twitter')
      if (twitterError) errors.twitter = twitterError
    }
  
    if (editForm.website) {
      const websiteError = validateUrl(editForm.website, 'website')
      if (websiteError) errors.website = websiteError
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsSaving(true)
    setError(null)
  
    try {
      const sanitizedTwitter = editForm.twitter ? sanitizeUrl(editForm.twitter.trim()) : undefined
      const sanitizedWebsite = editForm.website ? sanitizeUrl(editForm.website.trim()) : undefined
    
      const dataToSave = {
        twitter: sanitizedTwitter || undefined,
        website: sanitizedWebsite || undefined,
        overview: editForm.overview?.trim() || undefined,
        ownerAddress: projectOwner, // Send owner address for verification
      }
    
      logger.info('Saving metadata:', dataToSave)
    
      const result = await apiClient(
        `/api/projects/${projectId}/metadata`,
        {
          method: 'POST',
          body: JSON.stringify(dataToSave),
        }
      )
    
      if (result.success) {
        setMetadata(result.data)
        setIsEditingMetadata(false)
        setValidationErrors({})
        logger.info('Metadata saved successfully', { projectId })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Failed to save metadata:', errorMessage)
      setError(`Failed to save: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }
  const hasMetadata = metadata.twitter || metadata.website || metadata.overview

  if (isLoading) {
    return (
      <Card hover>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-[var(--neon-blue)] animate-spin" />
          <span className="ml-3 text-[var(--metallic-silver)]">Loading Launch information...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card hover>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-[var(--silver-light)]">
          Social Links & Additional Info
        </h3>
        {isProjectOwner && !isEditingMetadata && (
          <button
            onClick={handleEditClick}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--neon-blue)]/10 hover:bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] rounded-lg transition-all duration-200 border border-[var(--neon-blue)]/30"
          >
            <Edit2 className="h-4 w-4" />
            <span className="text-sm font-medium">Edit Info</span>
          </button>
        )}
      </div>

      {/* Edit Mode */}
      {isEditingMetadata ? (
        <div className="space-y-5">
          {/* Twitter Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--silver-light)] mb-2">
              Twitter/X URL
            </label>
            <input
              type="text"
              placeholder="https://twitter.com/yourproject"
              value={editForm.twitter || ''}
              onChange={(e) => {
                setEditForm({ ...editForm, twitter: e.target.value })
                setValidationErrors({ ...validationErrors, twitter: undefined })
              }}
              className={`w-full px-4 py-3 bg-[var(--charcoal)] border ${
                validationErrors.twitter 
                  ? 'border-[var(--neon-orange)]' 
                  : 'border-[var(--metallic-silver)]/20'
              } rounded-lg text-[var(--silver-light)] placeholder-[var(--metallic-silver)]/50 focus:border-[var(--neon-blue)] focus:outline-none transition-colors`}
            />
            {validationErrors.twitter && (
              <p className="mt-1.5 text-sm text-[var(--neon-orange)] flex items-center space-x-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{validationErrors.twitter}</span>
              </p>
            )}
          </div>

          {/* Website Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--silver-light)] mb-2">
              Website URL
            </label>
            <input
              type="text"
              placeholder="https://yourproject.com"
              value={editForm.website || ''}
              onChange={(e) => {
                setEditForm({ ...editForm, website: e.target.value })
                setValidationErrors({ ...validationErrors, website: undefined })
              }}
              className={`w-full px-4 py-3 bg-[var(--charcoal)] border ${
                validationErrors.website 
                  ? 'border-[var(--neon-orange)]' 
                  : 'border-[var(--metallic-silver)]/20'
              } rounded-lg text-[var(--silver-light)] placeholder-[var(--metallic-silver)]/50 focus:border-[var(--neon-blue)] focus:outline-none transition-colors`}
            />
            {validationErrors.website && (
              <p className="mt-1.5 text-sm text-[var(--neon-orange)] flex items-center space-x-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{validationErrors.website}</span>
              </p>
            )}
          </div>

          {/* Overview Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--silver-light)] mb-2">
              Launch Overview
            </label>
            <textarea
              placeholder="Brief description of your project..."
              value={editForm.overview || ''}
              onChange={(e) => 
                setEditForm({ 
                  ...editForm, 
                  overview: e.target.value.slice(0, MAX_OVERVIEW_LENGTH) 
                })
              }
              rows={5}
              className="w-full px-4 py-3 bg-[var(--charcoal)] border border-[var(--metallic-silver)]/20 rounded-lg text-[var(--silver-light)] placeholder-[var(--metallic-silver)]/50 focus:border-[var(--neon-blue)] focus:outline-none transition-colors resize-none"
            />
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-xs text-[var(--metallic-silver)]">
                Brief overview of your launch (optional)
              </p>
              <p className="text-xs text-[var(--metallic-silver)]">
                {editForm.overview?.length || 0}/{MAX_OVERVIEW_LENGTH}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-[var(--neon-orange)]/10 border border-[var(--neon-orange)]/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-[var(--neon-orange)] flex-shrink-0" />
              <p className="text-sm text-[var(--neon-orange)]">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSaveMetadata}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/80 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/80 text-[var(--silver-light)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--metallic-silver)]/20"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div className="space-y-5">
          {/* Social Links */}
          {(metadata.twitter || metadata.website) && (
            <div className="flex items-center space-x-3 pb-5 border-b border-[var(--metallic-silver)]/20">
              {metadata.twitter && (
                <a
                  href={metadata.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2.5 bg-[#1da1f2]/10 hover:bg-[#1da1f2]/20 text-[#1da1f2] rounded-lg transition-all duration-200 border border-[#1da1f2]/30 hover:border-[#1da1f2]/50"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="text-sm font-medium">Twitter</span>
                </a>
              )}
              {metadata.website && (
                <a
                  href={metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2.5 bg-[var(--neon-blue)]/10 hover:bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] rounded-lg transition-all duration-200 border border-[var(--neon-blue)]/30 hover:border-[var(--neon-blue)]/50"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Website</span>
                </a>
              )}
            </div>
          )}

          {/* Overview Text */}
          {metadata.overview ? (
            <div>
              <p className="text-[var(--silver-light)] leading-relaxed whitespace-pre-wrap">
                {metadata.overview}
              </p>
            </div>
          ) : !hasMetadata ? (
            <div className="text-center py-6">
              <p className="text-[var(--metallic-silver)]">
                No additional information available
              </p>
              {isProjectOwner && (
                <p className="text-sm text-[var(--metallic-silver)]/70 mt-2">
                  Click "Edit Info" to add social links and project overview
                </p>
              )}
            </div>
          ) : null}

          {/* Last Updated */}
          {metadata.lastUpdated && (
            <div className="pt-4 border-t border-[var(--metallic-silver)]/20">
              <p className="text-xs text-[var(--metallic-silver)]">
                Last updated: {new Date(metadata.lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}