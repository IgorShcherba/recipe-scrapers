import { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type { RecipeFields } from '@/types/recipe.interface'
import { isString } from '@/utils'
import { isIngredients } from '@/utils/ingredients'
import { isInstructions } from '@/utils/instructions'
import type { Ingredients, Instructions } from '../types/recipe.interface'

export class HtmlStripperPlugin extends PostProcessorPlugin {
  name = 'HtmlStripper'
  priority = 100 // Run early

  private fieldsToProcess: (keyof RecipeFields)[] = [
    'title',
    'description',
    'instructions',
    'ingredients',
  ]

  shouldProcess<Key extends keyof RecipeFields>(field: Key): boolean {
    return this.fieldsToProcess.includes(field)
  }

  process<T>(field: keyof RecipeFields, value: T): T {
    if (!this.shouldProcess(field)) {
      return value
    }

    if (isString(value)) {
      return this.stripHtml(value) as T
    }

    if (field === 'instructions' && isInstructions(value)) {
      return this.processInstructions(value) as T
    }

    if (field === 'ingredients' && isIngredients(value)) {
      return this.processIngredients(value) as T
    }

    return value
  }

  private processIngredients(ingredients: Ingredients): Ingredients {
    return ingredients.map((group) => ({
      name: group.name === null ? null : this.stripHtml(group.name),
      items: group.items.map((item) => ({
        value: this.stripHtml(item.value),
      })),
    }))
  }

  private processInstructions(instructions: Instructions): Instructions {
    return instructions.map((group) => ({
      name: group.name === null ? null : this.stripHtml(group.name),
      items: group.items.map((item) => ({
        value: this.stripHtml(item.value),
      })),
    }))
  }

  private stripHtml(html: string): string {
    // Simple regex approach (could use a proper HTML parser)
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&') // Decode common entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
  }
}
