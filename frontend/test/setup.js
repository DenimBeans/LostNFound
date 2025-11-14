import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.location
delete window.location
window.location = {
  href: '',
  pathname: '/',
  search: '',
  hash: '',
  reload: () => {},
}

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock fetch
global.fetch = vi.fn()

// Suppress console warnings during tests (optional)
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    // Suppress react-modal warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('react-modal') ||
       args[0].includes('value prop') ||
       args[0].includes('onChange handler'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    // Suppress specific warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('react-modal')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})