/** @jest-environment node */
import { apiOk, apiError } from '@/lib/api'

describe('apiOk', () => {
  it('returns a 200 JSON response with data', async () => {
    const response = apiOk({ id: '123', name: 'Test' })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ data: { id: '123', name: 'Test' } })
  })
})

describe('apiError', () => {
  it('returns the specified status and message', async () => {
    const response = apiError('Not found', 404)
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body).toEqual({ error: 'Not found' })
  })

  it('defaults to 500 when no status provided', async () => {
    const response = apiError('Something went wrong')
    expect(response.status).toBe(500)
  })
})
