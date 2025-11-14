import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../src/Components/Login'

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Submit')).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    // Mock failed API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ 
        error: 'Invalid credentials',
        firstName: '',
        lastName: '',
        userId: '',
        accessToken: ''
      }),
    })

    renderWithRouter(<Login />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByDisplayValue('Submit')

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('stores user data on successful login', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({
        error: '',
        firstName: 'John',
        lastName: 'Doe',
        userId: '12345',
        accessToken: 'token123'
      }),
    })

    renderWithRouter(<Login />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByDisplayValue('Submit')

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const userData = sessionStorage.getItem('user_data')
      expect(userData).toBeTruthy()
      const parsed = JSON.parse(userData)
      expect(parsed.userId).toBe('12345')
      expect(parsed.firstName).toBe('John')
    })
  })
})