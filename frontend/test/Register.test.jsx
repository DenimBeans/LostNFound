import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Register from '../src/Components/Register'

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form', () => {
    renderWithRouter(<Register />)
    
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('shows error when backend returns error', async () => {
  // Mock API to return an error
  global.fetch = vi.fn().mockResolvedValueOnce({
    text: async () => JSON.stringify({ 
      error: 'User already exists'
    }),
  })

  renderWithRouter(<Register />)

  fireEvent.change(screen.getByPlaceholderText('First Name'), {
    target: { value: 'John' }
  })
  fireEvent.change(screen.getByPlaceholderText('Last Name'), {
    target: { value: 'Doe' }
  })
  
  // ✅ Change email TWICE to trigger validation properly
  const emailInput = screen.getByPlaceholderText('Email')
  fireEvent.change(emailInput, {
    target: { value: 'existing@test.com' }
  })
  // Change it again so validation tests the correct value
  fireEvent.change(emailInput, {
    target: { value: 'existing@test.com' }
  })
  
  fireEvent.change(screen.getByPlaceholderText('Password'), {
    target: { value: 'password123' }
  })
  
  fireEvent.click(screen.getByDisplayValue('Register'))

  await waitFor(() => {
    expect(screen.getByText('User already exists')).toBeInTheDocument()
  })
})

  it('shows success modal after successful registration', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ error: '' }),
    })

    renderWithRouter(<Register />)

    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'John' }
    })
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'Doe' }
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'john@test.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByDisplayValue('Register'))

    await waitFor(() => {
      expect(screen.getByText(/Account created/i)).toBeInTheDocument()
    })
  })

  it('displays success message in modal', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ error: '' }),
    })

    renderWithRouter(<Register />)

    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'Test' }
    })
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'User' }
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@test.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass123' }
    })
    
    fireEvent.click(screen.getByDisplayValue('Register'))

    await waitFor(() => {
      expect(screen.getByText('Account created! Please check your email for verification.')).toBeInTheDocument()
    })
  })
})
