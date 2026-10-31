// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CategoryFilterSelect from './category-filter-select'

afterEach(cleanup)

const options = [
  { label: 'All tags', value: '' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Financial', value: 'financial' },
]

describe('category filter select', () => {
  it('styles the trigger and options with the site theme colors', () => {
    render(
      <CategoryFilterSelect
        label="Filter by tag"
        value=""
        options={options}
        onChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Filter by tag' })
    expect(trigger.className).toContain('bg-laccent-2')
    expect(trigger.className).toContain('dark:bg-daccent-2')
    expect(trigger.className).toContain('border-daccent-2')

    fireEvent.click(trigger)
    const listbox = screen.getByRole('listbox', { name: 'Filter by tag' })
    expect(listbox.className).toContain('bg-[#d9dcf2]/95')
    expect(listbox.className).toContain('dark:bg-[#070a15]/95')
    expect(listbox.className).toContain('backdrop-blur-md')
    expect(listbox.className).toContain('text-daccent-1')
    expect(listbox.className).toContain('dark:text-accent-1')

    const activeOption = screen.getByRole('option', { name: 'All tags' })
    expect(activeOption.className).toContain('bg-accent-3/70')
    expect(activeOption.className).toContain('dark:bg-daccent-1')
  })

  it('supports keyboard navigation and selection', () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterSelect
        label="Filter by tag"
        value=""
        options={options}
        onChange={onChange}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Filter by tag' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    const marketingOption = screen.getByRole('option', { name: 'Marketing' })
    expect(trigger.getAttribute('aria-activedescendant')).toBe(marketingOption.id)
    fireEvent.keyDown(trigger, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('marketing')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
