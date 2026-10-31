import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

type FilterOption = {
  label: string
  value: string
}

type CategoryFilterSelectProps = {
  label: string
  onChange: (value: string) => void
  options: FilterOption[]
  value: string
}

const triggerClass =
  'flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-daccent-2 bg-laccent-2 px-4 py-3 text-left text-daccent-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-daccent-2 dark:bg-daccent-2 dark:text-accent-1 dark:focus-visible:outline-sky-300'

const listboxClass =
  'absolute inset-x-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-daccent-2 bg-[#d9dcf2]/95 p-1 text-daccent-1 shadow-lg backdrop-blur-md dark:border-daccent-2 dark:bg-[#070a15]/95 dark:text-accent-1'

export default function CategoryFilterSelect({
  label,
  onChange,
  options,
  value,
}: CategoryFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [isOpen])

  const openAt = (index: number) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  const selectOption = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setActiveIndex(index)
    setIsOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      if (!isOpen) {
        openAt(Math.min(Math.max(selectedIndex + direction, 0), options.length - 1))
      } else {
        setActiveIndex((current) => Math.min(Math.max(current + direction, 0), options.length - 1))
      }
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      openAt(event.key === 'Home' ? 0 : options.length - 1)
      return
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      setIsOpen(false)
      return
    }

    if (event.key === 'Tab') {
      setIsOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) {
        selectOption(activeIndex)
      } else {
        openAt(selectedIndex)
      }
    }
  }

  const selectedOption = options[selectedIndex]

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openAt(selectedIndex))}
        onKeyDown={handleKeyDown}
        className={triggerClass}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>

      {isOpen && (
        <div id={listboxId} role="listbox" aria-label={label} className={listboxClass}>
          {options.map((option, index) => {
            const isActive = index === activeIndex
            const isSelected = index === selectedIndex

            return (
              <div
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => selectOption(index)}
                className={`cursor-pointer rounded-md px-3 py-2 ${
                  isActive
                    ? 'bg-accent-3/70 dark:bg-daccent-1'
                    : 'hover:bg-accent-3/50 dark:hover:bg-daccent-1/70'
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                {option.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
