import { canGenerateDrafts } from '@/lib/auth'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('Auth Utils', () => {
  describe('canGenerateDrafts', () => {
    it('should allow generation for users with active subscription', async () => {
      // Mock active subscription
      const mockSupabase = require('@/lib/supabase').createServerClient()
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: { status: 'active' },
        error: null
      })

      const result = await canGenerateDrafts('user-123')
      
      expect(result.canGenerate).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow generation for free users under limit', async () => {
      // Mock no subscription and low usage
      const mockSupabase = require('@/lib/supabase').createServerClient()
      
      // First call for subscription check
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: null,
        error: { message: 'No subscription found' }
      })
      
      // Second call for usage check
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: { total_generations: 2 },
        error: null
      })

      const result = await canGenerateDrafts('user-123')
      
      expect(result.canGenerate).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should block generation for free users at limit', async () => {
      // Mock no subscription and high usage
      const mockSupabase = require('@/lib/supabase').createServerClient()
      
      // First call for subscription check
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: null,
        error: { message: 'No subscription found' }
      })
      
      // Second call for usage check
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: { total_generations: 3 },
        error: null
      })

      const result = await canGenerateDrafts('user-123')
      
      expect(result.canGenerate).toBe(false)
      expect(result.reason).toContain('free limit')
    })
  })
})
