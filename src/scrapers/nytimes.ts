import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'

export class NYTimes extends AbstractScraper {
  static host() {
    return 'cooking.nytimes.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    // Use wildcard selectors to handle dynamic class name suffixes
    const headingSelector = 'h3[class*="ingredientgroup_name"]'
    const ingredientSelector = 'li[class*="ingredient"]'

    if (prevValue && prevValue.length > 0) {
      const values = flattenIngredients(prevValue)

      return groupIngredients(
        this.$,
        values,
        headingSelector,
        ingredientSelector,
      )
    }

    throw new NoIngredientsFoundException()
  }
}
