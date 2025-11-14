import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardUI from "../src/Components/CardUI";


// Mock react-leaflet (since it requires a browser with canvas support)
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({
    setView: vi.fn(),
  }),
}))

vi.mock('leaflet', () => ({
  LatLng: class LatLng {
    constructor(lat, lng) {
      this.lat = lat
      this.lng = lng
    }
  },
  Icon: class Icon {
    constructor(options) {
      this.options = options
    }
  },
}))

describe('CardUI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    
    // Set up user data in session storage
    sessionStorage.setItem('user_data', JSON.stringify({
      userId: '12345',
      firstName: 'Test',
      lastName: 'User'
    }))

    // Mock successful items fetch
    global.fetch = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({ 
        results: [
          {
            _id: '1',
            title: 'Lost iPhone',
            description: 'Black iPhone 13',
            category: 'Electronic',
            status: 'lost',
            imageUrl: '',
            location: { coordinates: [-81.2001, 28.6024] }
          }
        ]
      }),
    })
  })

  it('renders main page header', () => {
    render(<CardUI />)
    expect(screen.getByText('Item Reports')).toBeInTheDocument()
  })

  it('renders Make a Report button', () => {
    render(<CardUI />)
    expect(screen.getByText('Make a Report')).toBeInTheDocument()
  })

  it('renders search filters', () => {
    render(<CardUI />)
    expect(screen.getByDisplayValue('Filter By Status...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Filter By Category...')).toBeInTheDocument()
  })
})