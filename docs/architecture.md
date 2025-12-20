# Recipe Scrapers JS - Architecture

## Overview

Recipe Scrapers JS is a TypeScript library for extracting structured recipe data from cooking websites. It uses a plugin-based architecture that combines generic extraction methods with site-specific customizations to produce consistent `RecipeObject` outputs.

### Key Features

- **Multi-source extraction**: JSON-LD (Schema.org), Microdata, OpenGraph
- **Plugin architecture**: Extensible extraction and post-processing pipeline
- **Site-specific scrapers**: Custom logic for popular recipe sites
- **Runtime validation**: Zod-based schema validation for data quality
- **Type-safe**: Full TypeScript support with strict typing
- **Test coverage**: Comprehensive test suite with real HTML fixtures

## Core Concepts

### RecipeObject

The output format representing a complete recipe. See `src/types/recipe.interface.ts` for the full interface definition.

### Extraction & Validation Pipeline

```txt
HTML Input
    ↓
RecipeExtractor / AbstractScraper
    ↓
┌─────────────────────────┐
│  Extractor Plugins      │
│  (Priority Order)       │
├─────────────────────────┤
│  1. Schema.org (90)     │ ← JSON-LD extraction
│  2. Microdata (80)      │ ← HTML microdata
│  3. OpenGraph (50)      │ ← OG meta tags
└─────────────────────────┘
    ↓
Partial RecipeObject
    ↓
Site-Specific Scraper (optional)
    ↓
┌─────────────────────────┐
│  PostProcessor Plugins  │
├─────────────────────────┤
│  • HTML Stripper        │ ← Remove HTML tags
│  • [Future processors]  │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│  Validation (Optional)  │
├─────────────────────────┤
│  • Zod Schema           │ ← Runtime validation
│  • Type checking        │
│  • Auto-fixes           │
└─────────────────────────┘
    ↓
Final RecipeObject
```

## Plugin System

### Plugin Types

#### 1. ExtractorPlugin

Extracts data from HTML to populate `RecipeObject` fields.

```typescript
abstract class AbstractExtractorPlugin {
  abstract readonly priority: number  // Higher = runs first
  
  // Override to extract specific fields
  name?($: CheerioAPI, prevValue?: string): string | undefined
  ingredients?($: CheerioAPI, prevValue?: Ingredients): Ingredients | undefined
  // ... other field extractors
}
```

**Priority System**:

- Higher priority plugins run first
- Later plugins can override or enhance earlier results
- Use `prevValue` to access previous extraction results

**Built-in Extractors**:

- **Schema.org** (priority 90): Primary extractor for JSON-LD data
- **OpenGraph** (priority 50): Fallback for basic metadata

#### 2. PostProcessorPlugin

Processes extracted data after all extraction is complete.

```typescript
abstract class AbstractPostprocessorPlugin {
  abstract readonly priority: number
  
  abstract process(recipe: RecipeObject): RecipeObject
}
```

**Built-in Processors**:

- **HtmlStripperPlugin**: Removes HTML tags from text fields

### Plugin Registration

Plugins are registered in `PluginManager`:

```typescript
const pluginManager = new PluginManager()

// Add extractors
pluginManager.registerExtractorPlugin(new SchemaOrgExtractorPlugin())
pluginManager.registerExtractorPlugin(new OpenGraphExtractorPlugin())

// Add post-processors
pluginManager.registerPostprocessorPlugin(new HtmlStripperPlugin())
```

## Site-Specific Scrapers

### AbstractScraper

Base class for all site-specific scrapers:

```typescript
abstract class AbstractScraper {
  protected $: CheerioAPI  // Cheerio instance for HTML parsing
  
  static host(): string  // Domain this scraper handles
  
  extractors: {
    [K in keyof RecipeFields]?: (prevValue?: RecipeFields[K]) => RecipeFields[K]
  }
  
  // Extraction methods
  toRecipeObject(): RecipeObject     // Extract without validation
  parse(): RecipeObjectValidated     // Extract with validation (throws on error)
  safeParse(): SafeParseReturnType   // Extract with validation (returns result)
  
  // Override for custom validation
  protected getSchema(): ZodSchema
}
```

### Validation Methods

**`toRecipeObject()`** - Extract without validation

```typescript
const recipe = scraper.toRecipeObject()
// Returns RecipeObject - no runtime checks
```

**`parse()`** - Extract with validation (throws ZodError on failure)

```typescript
try {
  const recipe = scraper.parse()
  // Returns RecipeObjectValidated - guaranteed valid
} catch (error) {
  if (error instanceof ZodError) {
    console.error(error.format())
  }
}
```

**`safeParse()`** - Extract with validation (returns result object)

```typescript
const result = scraper.safeParse()
if (result.success) {
  console.log(result.data)  // RecipeObjectValidated
} else {
  console.error(result.error.issues)  // Validation errors
}
```

### How Scrapers Work

1. **Domain matching**: `host()` method identifies which scraper to use
2. **Plugin extraction**: Generic plugins extract base data
3. **Custom extraction**: Scraper's `extractors` override/enhance fields
4. **Post-processing**: PostProcessor plugins clean up final output

### Example Scraper with Custom Validation

```typescript
class NYTimes extends AbstractScraper {
  static host() {
    return 'cooking.nytimes.com'
  }

  // Override schema for site-specific validation
  protected getSchema() {
    return RecipeObjectSchema.extend({
      title: z.string()
        .refine((v) => v.length >= 10, 'Titles must be descriptive')
    })
  }
}
```

### When to Create a Scraper

Create a site-specific scraper when:

- ✅ Generic plugins produce incorrect/incomplete data
- ✅ Site has unique HTML structure requiring custom parsing
- ✅ Data needs restructuring (e.g., ingredient grouping)
- ✅ Site lacks proper Schema.org markup

Don't create a scraper when:

- ❌ Generic plugins already extract everything correctly
- ❌ Only minor text cleanup needed (use post-processors instead)

## RecipeExtractor

Main entry point for recipe extraction:

```typescript
class RecipeExtractor {
  constructor(
    html: string,
    url: string,
    pluginManager?: PluginManager,
  )
  
  extract(): RecipeObject
}
```

### Extraction Process

1. **Parse HTML**: Load HTML with Cheerio
2. **Find scraper**: Match URL domain to registered scrapers
3. **Run extractors**: Execute plugins and scraper extractors
4. **Post-process**: Apply post-processor plugins
5. **Return result**: Final `RecipeObject`

### Usage

```typescript
import { RecipeExtractor } from 'recipe-scrapers-js'

const html = await fetch('https://cooking.nytimes.com/recipes/...')
const extractor = new RecipeExtractor(
  await html.text(),
  'https://cooking.nytimes.com/recipes/...'
)

const recipe = extractor.extract()
console.log(recipe.name)
console.log(recipe.ingredients)
```

## Validation System

The library uses [Zod](https://zod.dev/) for runtime validation.

### Schema Organization

```txt
src/schemas/
├── recipe.schema.ts          # Main RecipeObject schema
└── common.schema.ts          # Reusable helpers (zString, zHttpUrl, etc.)
```

### Validation Features

- **Auto-fixing**: Calculates missing totalTime from cook + prep times
- **Cross-field validation**: Ensures time consistency and rating relationships
- **Custom error messages**: Clear validation feedback
- **Transform pipeline**: Trims whitespace, normalizes data
- **Extensible**: Scrapers can override schemas for site-specific rules

### Validation Guarantees

Validated recipes (`RecipeObjectValidated`) are guaranteed to have:

- ✅ Valid URLs for host, canonicalUrl, image
- ✅ Non-empty title, yields, description, author
- ✅ At least one ingredient group with items
- ✅ At least one instruction group with steps
- ✅ Positive time values (when present)
- ✅ Valid ratings (0-5) and non-negative rating counts
- ✅ Consistent totalTime ≥ cookTime + prepTime

## Project Structure

```txt
recipe-scrapers-js/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── recipe-extractor.ts         # Main extraction orchestrator
│   ├── plugin-manager.ts           # Plugin registration & execution
│   ├── abstract-scraper.ts         # Base scraper class
│   ├── abstract-plugin.ts          # Base plugin classes
│   │
│   ├── schemas/                    # Zod validation schemas
│   │   └── recipe.schema.ts       # RecipeObject schema
│   │
│   ├── plugins/                    # Generic extraction plugins
│   │   ├── schema-org.extractor/
│   │   ├── opengraph.extractor.ts
│   │   └── html-stripper.processor.ts
│   │
│   ├── scrapers/                   # Site-specific scrapers
│   │   ├── _index.ts              # Scraper registry
│   │   ├── nytimes.ts
│   │   ├── allrecipes.ts
│   │   └── ...
│   │
│   ├── utils/                      # Utility functions
│   │   ├── ingredients.ts         # Ingredient utilities
│   │   ├── instructions.ts        # Instruction utilities
│   │   ├── parsing.ts             # Text parsing helpers
│   │   └── ...
│   │
│   ├── types/                      # TypeScript types
│   │   ├── recipe.interface.ts    # RecipeObject definition
│   │   └── scraper.interface.ts
│   │
│   └── exceptions/                 # Custom exceptions
│
├── test-data/                      # Test fixtures by domain
│   ├── allrecipes.com/
│   │   ├── allrecipes.testhtml    # HTML fixture
│   │   └── allrecipes.json        # Expected output
│   └── ...
│
└── docs/
    ├── architecture.md             # This file
    └── ingredients-architecture.md # Ingredients deep-dive
```

## Testing Strategy

### Test Structure

Each site has test fixtures in `test-data/[domain]/`:

- `*.testhtml` - Real HTML from the site (anonymized if needed)
- `*.json` - Expected `RecipeObject` output

### Test Types

#### 1. Unit Tests

Located in `__tests__/` directories alongside source files:

- Plugin tests: Verify extraction logic
- Utility tests: Test helper functions
- Type predicates: Validate type guards

```typescript
// Example: Plugin test
describe('SchemaOrgExtractorPlugin', () => {
  it('should extract ingredients from recipeIngredient', () => {
    const html = '<script type="application/ld+json">...</script>'
    const $ = cheerio.load(html)
    const plugin = new SchemaOrgExtractorPlugin()
    
    const result = plugin.ingredients($)
    expect(result).toEqual([...])
  })
})
```

#### 2. Integration Tests

Tests scrapers with real HTML fixtures:

```typescript
describe('NYTimes scraper', () => {
  it('should extract recipe from nytimes.testhtml', async () => {
    const html = await Bun.file('test-data/cooking.nytimes.com/nytimes.testhtml').text()
    const expected = await Bun.file('test-data/cooking.nytimes.com/nytimes.json').json()
    
    const extractor = new RecipeExtractor(html, 'https://cooking.nytimes.com/...')
    const result = extractor.extract()
    
    expect(result).toEqual(expected)
  })
})
```

### Writing Tests

When adding a new scraper:

1. **Fetch real HTML**: Get actual page HTML from the target site
2. **Create fixture**: Save as `test-data/[domain]/[testname].testhtml`
3. **Run extraction**: Use the library to extract data
4. **Verify manually**: Check that extraction is correct
5. **Save expected**: Store result as `[testname].json`
6. **Write test**: Create integration test comparing fixture to expected

### Test Best Practices

- ✅ Use real HTML from actual sites
- ✅ Test edge cases (missing fields, unusual structure)
- ✅ Use `toEqual` for full object comparison
- ✅ Keep tests focused and independent
- ❌ Don't test internal implementation details
- ❌ Don't use mock HTML that doesn't match real sites

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/plugins/__tests__/schema-org.test.ts

# Run with coverage
bun test --coverage

# Run scrapers tests only
bun test src/scrapers/__tests__/
```

## Type System

### Strict Type Safety

The project enforces strict TypeScript rules:

```typescript
// ❌ NEVER use non-null assertions
const value = obj.field!  // Don't do this

// ✅ Use optional chaining and nullish coalescing
const value = obj.field ?? 'default'

// ❌ NEVER use 'any'
function process(data: any) { ... }  // Don't do this

// ✅ Use proper types or 'unknown'
function process(data: RecipeObject) { ... }
function process(data: unknown) {
  if (isRecipeObject(data)) {
    // Type guard narrows to RecipeObject
  }
}
```

### Type Guards vs Zod Validation

**Type Guards** - For compile-time type narrowing:

```typescript
export function isIngredientItem(value: unknown): value is IngredientItem {
  return isPlainObject(value) && 'value' in value && isString(value.value)
}
```

**Zod Schemas** - For runtime validation with error details:

```typescript
const result = RecipeObjectSchema.safeParse(data)
if (result.success) {
  // data is validated RecipeObjectValidated
} else {
  // result.error contains detailed validation errors
}
```

## Code Style

### Modern ECMAScript

- Use ESM (`import`/`export`) not CommonJS
- Use `const`/`let` instead of `var`
- Prefer template literals for strings
- Use destructuring for objects/arrays
- Use async/await for promises

### Bun-First

- Prefer Bun APIs over Node.js when available
- Use Bun's built-in test framework
- Leverage Bun's fast module resolution

### Documentation

- Add JSDoc comments for public APIs
- Include examples in documentation
- Document complex algorithms inline
- Keep comments up-to-date with code

## Adding New Features

### Adding a New Scraper

1. **Research**: Analyze target site's HTML structure
2. **Check JSON-LD**: Verify if Schema.org data exists and quality
3. **Create scraper**: Extend `AbstractScraper` in `src/scrapers/`
4. **Override extractors**: Add custom extraction methods
5. **Custom validation** (optional): Override `getSchema()` for site-specific rules
6. **Register**: Add to `src/scrapers/_index.ts`
7. **Add tests**: Create fixtures in `test-data/[domain]/`
8. **Test validation**: Ensure `parse()` succeeds on test data
9. **Verify**: Run tests and ensure extraction is accurate

### Adding a New Plugin

1. **Identify need**: What extraction method is missing?
2. **Choose type**: ExtractorPlugin or PostProcessorPlugin?
3. **Implement**: Extend appropriate abstract class
4. **Register**: Add to `PluginManager` initialization
5. **Test**: Add unit tests for plugin logic
6. **Document**: Update relevant architecture docs

### Adding Schema Validation Rules

1. **Identify need**: What validation is missing?
2. **Update schema**: Modify `src/schemas/recipe.schema.ts`
3. **Add refinements**: Use `.refine()` for cross-field validation
4. **Add transforms**: Use `.transform()` for auto-fixes
5. **Test**: Add unit tests for new validation rules

## Performance Considerations

### Cheerio Usage

- Cheerio is synchronous and fast
- Cache selectors when reusing: `const $heading = this.$('h1')`
- Use efficient selectors (IDs and classes over complex queries)
- Limit DOM traversal when possible

### Memory

- HTML fixtures can be large - stream if needed
- Don't store entire DOM in memory unnecessarily
- Clear references to Cheerio instances after extraction

### Optimization Opportunities

- **Selector optimization**: Profile slow selectors
- **Lazy loading**: Only load scrapers for matched domains

## Future Enhancements

### Planned Features

1. **More scrapers**: Expand site coverage
2. **Better fuzzy matching**: Improve ingredient text matching
3. **Ingredient parsing**: Break down quantity/unit/ingredient
4. **Video extraction**: Support recipe videos
5. **CLI tool**: Scaffold new scrapers

### Architecture Improvements

1. **Scraper generator**: CLI tool to scaffold new scrapers
2. **Schema versioning**: Track validation rule changes
3. **Streaming API**: Process large HTML documents efficiently
4. **Performance profiling**: Identify validation bottlenecks

## Contributing

See the main README.md for contribution guidelines. Key points:

- Follow TypeScript strict mode rules
- Add tests for all new features
- Update documentation
- Use existing patterns and conventions
- Run `bun test` before submitting PRs

## Related Documentation

- **[Ingredients Architecture](./ingredients-architecture.md)**: Deep dive into ingredient extraction system
- **API Reference**: (Future: Generated from TSDoc comments)
- **Recipe Schema**: (Future: Detailed RecipeObject field documentation)
