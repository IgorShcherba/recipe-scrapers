import { AbstractScraper } from '@/abstract-scraper'
import { getHostName } from '@/utils'

export class GenericScraper extends AbstractScraper {
  static host() {
    return '*'
  }

  protected override getHost(): string {
    try {
      return getHostName(this.url)
    } catch {
      return GenericScraper.host()
    }
  }
}
