import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

export class Epicurious extends AbstractScraper {
  static host() {
    return 'epicurious.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
  } satisfies ScraperExtractors

  protected author(): RecipeFields['author'] {
    const author = this.$('a[itemprop="author"]').text().trim()
    return author
  }
}
