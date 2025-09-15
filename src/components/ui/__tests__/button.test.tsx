import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const buttonElement = screen.getByText(/Click me/i)
    expect(buttonElement).toBeInTheDocument()
  })

  it('applies the correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    const buttonElement = screen.getByText(/Delete/i)
    expect(buttonElement).toHaveClass('bg-destructive')
  })
})