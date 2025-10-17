import React from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={closeOnBackdrop ? onClose : () => {}}
      >
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[var(--dark-black)]/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={clsx(
                  'w-full transform overflow-hidden rounded-2xl bg-[var(--charcoal)] border border-[var(--silver-dark)]/30 p-6 text-left align-middle shadow-xl shadow-[var(--neon-blue)]/5 transition-all',
                  sizeClasses[size]
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <DialogTitle as="h3" className="text-lg font-medium text-[var(--silver-light)]">
                      {title}
                    </DialogTitle>
                  )}
                  <button
                    type="button"
                    className="ml-auto rounded-md bg-transparent text-[var(--silver-dark)] hover:text-[var(--neon-blue)] hover:bg-[var(--silver-dark)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:ring-offset-2 focus:ring-offset-[var(--charcoal)] transition-colors duration-200 p-1"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}