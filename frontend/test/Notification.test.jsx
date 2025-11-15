import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Notification from '../src/Components/Notification'

describe('Notification Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    
    sessionStorage.setItem('user_data', JSON.stringify({
      userId: '12345',
      firstName: 'Test',
      lastName: 'User'
    }))
  })

  it('renders notification page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({
        results: []
      }),
    })

    render(<Notification />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api/users/12345/notifications'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  it('displays notifications when loaded', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({
        results: [
          {
            _id: 'notif-1',
            text: 'Someone found your item!',
            isRead: false,
            isMeetup: false,
            senderId: { _id: 'sender123' },
            itemId: {
              _id: 'item1',
              title: 'Lost Wallet',
              description: 'Black leather wallet',
              category: 'Personal',
              imageUrl: ''
            }
          }
        ]
      }),
    })

    render(<Notification />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Someone found your item!')).toBeInTheDocument()
    })
  })

  it('calls Read API when Read button clicked', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({
          results: [{
            _id: 'notif-1',
            text: 'Test notification',
            isRead: false,
            isMeetup: false,
            senderId: { _id: 'sender123' },
            itemId: {
              _id: 'item1',
              title: 'Item',
              description: 'Desc',
              category: 'Other',
              imageUrl: ''
            }
          }]
        }),
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({ error: '' }),
      })

    render(<Notification />)

    await waitFor(() => {
      expect(screen.getByText('Read')).toBeInTheDocument()
    })

    const readButton = screen.getByText('Read')
    fireEvent.click(readButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api/notifications/notif-1/read'),
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('removes notification when Delete button clicked', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({
          results: [{
            _id: 'notif-1',
            text: 'Test notification',
            isRead: false,
            isMeetup: false,
            senderId: { _id: 'sender123' },
            itemId: {
              _id: 'item1',
              title: 'Item',
              description: 'Desc',
              category: 'Other',
              imageUrl: ''
            }
          }]
        }),
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({ error: '' }),
      })

    render(<Notification />)

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api/notifications/notif-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('calls Read-ALL API when Read-ALL button clicked', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({ results: [] }),
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({ error: '' }),
      })

    render(<Notification />)

    await waitFor(() => {
      expect(screen.getByText('Read-ALL')).toBeInTheDocument()
    })

    const readAllButton = screen.getByText('Read-ALL')
    fireEvent.click(readAllButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api/users/12345/notifications/read-all'),
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('calls Delete-ALL API when Delete-ALL button clicked', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({ results: [] }),
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify({ error: '' }),
      })

    render(<Notification />)

    await waitFor(() => {
      expect(screen.getByText('Delete-ALL')).toBeInTheDocument()
    })

    const deleteAllButton = screen.getByText('Delete-ALL')
    fireEvent.click(deleteAllButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api/users/12345/notifications'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('redirects to login if no user data in session', () => {
    sessionStorage.clear()

    render(<Notification />)

    expect(window.location.href).toContain('/')
  })
})