// src/components/projects/steps/Step3LaunchTimeline.tsx
import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'

interface Step3LaunchTimelineProps {
  formData: CreateProjectFormData
  validationErrors: Record<string, string>
  onChange: (field: keyof CreateProjectFormData, value: any) => void
}

const dateToLocalISO = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

const localISOToDate = (isoString: string): Date => {
  if (!isoString) return new Date()
  const [datePart, timePart] = isoString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export const Step3LaunchTimeline: React.FC<Step3LaunchTimelineProps> = ({
  formData,
  validationErrors,
  onChange,
}) => {
  const handleDateChange = (field: 'startTime' | 'endTime', value: string) => {
    const date = localISOToDate(value)
    onChange(field, date)
  }

  const duration = formData.endTime && formData.startTime 
    ? ((formData.endTime.getTime() - formData.startTime.getTime()) / (24 * 60 * 60 * 1000)).toFixed(1)
    : '0'
  const durationExceeded = parseFloat(duration) > 21

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-[var(--neon-blue)] pl-4">
        <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
          Launch Timeline
        </h3>
        <p className="text-[var(--metallic-silver)] leading-relaxed">
          Specify the on-chain start and end times for contribution acceptance and sale finalization.
        </p>
      </div>

      <div className="bg-[var(--charcoal)] border border-[var(--neon-blue)]/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-[var(--silver-light)]">
            <p className="font-semibold">Timeline Requirements:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Start time must be at least 20 minutes in the future</li>
              <li className="font-bold text-[var(--neon-orange)]">Maximum launch duration is 21 days</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-base">
            Start Time <span className="text-[var(--neon-orange)]">*</span>
          </Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={dateToLocalISO(formData.startTime)}
            onChange={(e) => handleDateChange('startTime', e.target.value)}
            error={validationErrors.startTime}
            className="text-base font-mono"
          />
          <p className="text-sm text-[var(--metallic-silver)] bg-[var(--charcoal)] px-3 py-2 rounded border border-[var(--silver-dark)]/10">
            📅 {formData.startTime.toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-base">
            End Time <span className="text-[var(--neon-orange)]">*</span>
          </Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={dateToLocalISO(formData.endTime)}
            onChange={(e) => handleDateChange('endTime', e.target.value)}
            error={validationErrors.endTime}
            className="text-base font-mono"
          />
          <p className="text-sm text-[var(--metallic-silver)] bg-[var(--charcoal)] px-3 py-2 rounded border border-[var(--silver-dark)]/10">
            📅 {formData.endTime.toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className={`p-6 rounded-xl border-2 ${
          durationExceeded 
            ? 'bg-[var(--neon-orange)]/5 border-[var(--neon-orange)]' 
            : 'bg-[var(--neon-blue)]/5 border-[var(--neon-blue)]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--metallic-silver)] mb-1">
                Launch Duration
              </p>
              <p className={`text-3xl font-bold ${
                durationExceeded ? 'text-[var(--neon-orange)]' : 'text-[var(--neon-blue)]'
              }`}>
                {duration} days
              </p>
            </div>
            {durationExceeded && (
              <AlertCircle className="w-8 h-8 text-[var(--neon-orange)]" />
            )}
          </div>
          {durationExceeded && (
            <p className="text-sm text-[var(--neon-orange)] mt-3">
              Duration exceeds 21-day maximum
            </p>
          )}
        </div>
      </div>
    </div>
  )
}