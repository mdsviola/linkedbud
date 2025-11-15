import { normalizeUrl, generateTopicKey, clusterArticles } from '@/lib/rss'

describe('RSS Utils', () => {
  describe('normalizeUrl', () => {
    it('should remove UTM parameters', () => {
      const url = 'https://example.com/article?utm_source=google&utm_medium=cpc&utm_campaign=test'
      const normalized = normalizeUrl(url)
      expect(normalized).toBe('https://example.com/article')
    })

    it('should remove tracking parameters', () => {
      const url = 'https://example.com/article?fbclid=123&gclid=456&utm_source=test'
      const normalized = normalizeUrl(url)
      expect(normalized).toBe('https://example.com/article')
    })

    it('should preserve other parameters', () => {
      const url = 'https://example.com/article?category=tech&utm_source=google'
      const normalized = normalizeUrl(url)
      expect(normalized).toBe('https://example.com/article?category=tech')
    })

    it('should handle invalid URLs', () => {
      const url = 'not-a-url'
      const normalized = normalizeUrl(url)
      expect(normalized).toBe('not-a-url')
    })
  })

  describe('generateTopicKey', () => {
    it('should generate consistent keys for similar content', () => {
      const title1 = 'Renewable Energy Growth'
      const title2 = 'Renewable Energy Growth'
      const url1 = 'https://example.com/article1'
      const url2 = 'https://example.com/article1'
      
      const key1 = generateTopicKey(title1, url1)
      const key2 = generateTopicKey(title2, url2)
      
      expect(key1).toBe(key2)
    })

    it('should generate different keys for different content', () => {
      const title1 = 'Renewable Energy Growth'
      const title2 = 'Solar Panel Innovation'
      const url1 = 'https://example.com/article1'
      const url2 = 'https://example.com/article2'
      
      const key1 = generateTopicKey(title1, url1)
      const key2 = generateTopicKey(title2, url2)
      
      expect(key1).not.toBe(key2)
    })

    it('should handle special characters', () => {
      const title = 'AI & Machine Learning: The Future!'
      const url = 'https://example.com/ai-ml-future'
      
      const key = generateTopicKey(title, url)
      expect(key).toBeTruthy()
      expect(typeof key).toBe('string')
    })
  })

  describe('clusterArticles', () => {
    it('should group articles by topic key', () => {
      const articles = [
        {
          title: 'Solar Energy Growth',
          link: 'https://example.com/solar1',
          source: 'Tech News',
          pubDate: '2024-01-01',
          contentSnippet: 'Solar energy is growing rapidly',
          content: 'Full content about solar energy growth'
        },
        {
          title: 'Solar Energy Growth',
          link: 'https://example.com/solar2',
          source: 'Energy News',
          pubDate: '2024-01-02',
          contentSnippet: 'Solar energy continues to expand',
          content: 'More content about solar energy'
        },
        {
          title: 'Wind Power Innovation',
          link: 'https://example.com/wind1',
          source: 'Renewable News',
          pubDate: '2024-01-03',
          contentSnippet: 'New wind power technology',
          content: 'Content about wind power'
        }
      ]

      const clusters = clusterArticles(articles)
      
      expect(clusters.size).toBe(2) // Should have 2 clusters
      
      // Check that similar articles are grouped together
      const clusterValues = Array.from(clusters.values())
      const solarCluster = clusterValues.find(cluster => 
        cluster.some(article => article.title.includes('Solar'))
      )
      const windCluster = clusterValues.find(cluster => 
        cluster.some(article => article.title.includes('Wind'))
      )
      
      expect(solarCluster).toHaveLength(2)
      expect(windCluster).toHaveLength(1)
    })
  })
})
