# Claude Code Development Guide

## Overview
This document provides guidance for using Claude Code to develop the Travel Journal application efficiently. It includes best practices, prompting strategies, and iterative development approaches.

---

## Getting Started with Claude Code

### Initial Setup Prompt

```
I'm building a travel journal web application. Here's what I need to set up:

Context:
- Framework: React Router v7 (framework mode)
- Language: TypeScript
- Database: SQLite with Prisma
- Forms: Conform with Zod validation
- Styling: Tailwind CSS

Please help me:
1. Initialize a new React Router project with TypeScript
2. Set up Tailwind CSS
3. Configure Prisma with SQLite
4. Set up Conform for forms
5. Set up the basic project structure according to 06-TECHNICAL-ARCHITECTURE.md

Reference the architecture doc for the complete folder structure.
```

---

## Development Workflow with Claude Code

### Phase-Based Development

Develop in clear phases to maintain focus and quality:

1. **Phase 1: Foundation**
   - Project setup
   - Database schema
   - Authentication
   - Basic layouts

2. **Phase 2: Core Features**
   - Trip management
   - Entry creation
   - Expense tracking
   - Visualization

3. **Phase 3: Polish**
   - Error handling
   - Loading states
   - Responsive design
   - Performance optimization

4. **Phase 4: Advanced Features**
   - MCP integration
   - Public sharing
   - Analytics

---

## Effective Prompting Strategies

### 1. Context-Rich Prompts

Always provide relevant context:

```
I need to create the Trip creation form. 

Context:
- Reference: 02-PHASE1-MVP-FEATURES.md (Trip Management section)
- Data model: 01-DATA-MODELS.md (Trip interface)
- UI components: 05-UI-COMPONENTS-GUIDE.md (FormField, Input, DatePicker, etc.)

Requirements:
- Form should use Conform with Zod validation
- Schema should validate all fields with proper error messages
- Support for cover image upload
- Status selector (planned/ongoing/completed)
- Destination tags input
- Budget and currency fields
- Use parseWithZod in action for validation

Please create:
1. The Zod validation schema
2. The form component using Conform's useForm
3. Integration with React Router action
4. Proper error handling and display
```

### 2. Incremental Building

Build features incrementally:

```
Let's build the trip management feature step by step:

Step 1: Create the database model and migration
- Reference: 01-DATA-MODELS.md (Trip model)
- Use Prisma schema from 06-TECHNICAL-ARCHITECTURE.md

[After completion]

Step 2: Create the loader to fetch trips
- Fetch all trips for authenticated user
- Sort by status and start date

[After completion]

Step 3: Create the TripCard component
- Reference: 05-UI-COMPONENTS-GUIDE.md
- Display trip info, cover image, dates, status badge
```

### 3. Specify Success Criteria

Always define what "done" looks like:

```
Create the entry creation form.

Success criteria:
- [ ] Form has all required fields (title, content, date, category)
- [ ] Rich text editor works for content
- [ ] Image upload supports multiple files
- [ ] Location picker allows manual entry or map selection
- [ ] Form validation shows errors clearly
- [ ] Submit creates entry and redirects to entry detail
- [ ] Loading state during submission
- [ ] Error handling for failed submissions

Test cases:
1. Submit with missing required fields → shows errors
2. Upload 5 images → all appear in preview
3. Select location on map → coordinates saved
4. Cancel → navigates back without saving
```

### 4. Reference Existing Code

When building related features:

```
Create the Entry detail page similar to how we built the Trip detail page.

Differences:
- Show entry content with rich text rendering
- Display photo gallery instead of just cover image
- Include location on embedded map
- Show rating with stars
- Add edit/delete buttons

Reference the Trip detail implementation in app/routes/trips/$tripId.tsx
```

---

## Common Development Patterns

### Pattern 1: CRUD Operations

Template for building CRUD features:

```
I need full CRUD for [Feature].

References:
- Data model: [model in 01-DATA-MODELS.md]
- UI components: [relevant components in 05-UI-COMPONENTS-GUIDE.md]

Please create:
1. Prisma queries (create, read, update, delete)
2. Routes with loaders and actions
3. Form component for create/edit
4. List/detail views
5. Delete confirmation

Follow the pattern established in the trips CRUD implementation.
```

### Pattern 2: Form Handling with Conform

```
Create a form for [entity] with Conform and Zod validation.

Fields:
- [list fields with types and validation rules]

Requirements:
- Use Conform's useForm hook
- Define Zod schema with proper validation messages
- Use parseWithZod in the action
- Show validation errors inline with fields.[fieldName].errors
- Disable submit during submission
- Show loading spinner on submit button
- Handle server errors gracefully
- Support both client and server validation
- Proper accessibility (id, name, labels)

Example pattern:
```typescript
// Schema
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  // ... more fields
});

// Action
export async function action({ request }) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });
  
  if (submission.status !== "success") {
    return submission.reply();
  }
  
  // Use submission.value
}

// Component
const [form, fields] = useForm({
  lastResult,
  onValidate({ formData }) {
    return parseWithZod(formData, { schema });
  },
  shouldValidate: "onBlur",
  shouldRevalidate: "onInput",
});
```

Reference the trip form implementation for the complete pattern.
```

### Pattern 3: Authentication-Protected Routes

```
Create [feature] with authentication.

Requirements:
- Loader should use requireAuth to verify user
- Only show data belonging to authenticated user
- Redirect to login if not authenticated
- Show 403 if trying to access another user's data

Use the same auth pattern as in trips routes.
```

---

## Testing Strategy with Claude Code

### Unit Tests

```
Create unit tests for the [component/function].

Test cases:
1. [describe test case]
2. [describe test case]
3. [describe test case]

Use Vitest and React Testing Library.
Follow the testing patterns in tests/ folder.
```

### Integration Tests

```
Create integration tests for the [feature] workflow.

User flow:
1. User logs in
2. Creates a new trip
3. Adds an entry
4. Views the entry
5. Edits the entry
6. Deletes the entry

Test both success and error scenarios.
```

---

## Debugging with Claude Code

### When Things Don't Work

```
I'm getting [error message] when [action].

Context:
- File: [filename]
- What I'm trying to do: [description]
- What's happening: [actual behavior]
- What should happen: [expected behavior]

Error stack trace:
[paste error]

Relevant code:
[paste relevant code snippet]

Please help me:
1. Identify the issue
2. Explain why it's happening
3. Provide a fix
4. Suggest how to prevent similar issues
```

### Code Review Requests

```
Please review this [component/function] for:
1. TypeScript type safety
2. Performance issues
3. Accessibility problems
4. Code style and conventions
5. Potential bugs

[paste code]

Suggest improvements with explanations.
```

---

## Refactoring with Claude Code

### Component Extraction

```
I have a large component that's getting hard to maintain.

[paste component code]

Please help me refactor by:
1. Identifying logical sections to extract
2. Creating smaller, focused components
3. Ensuring props are well-typed
4. Maintaining the same functionality
5. Improving readability

Suggest a clear component hierarchy.
```

### Code Organization

```
I have multiple files with similar logic.

Files:
- [file 1]
- [file 2]
- [file 3]

Please help me:
1. Identify duplicated code
2. Extract into shared utilities
3. Create appropriate abstractions
4. Maintain type safety

Show me the refactored structure.
```

---

## Working with Specific Technologies

### Prisma Database Operations

```
I need to create a complex Prisma query.

Requirements:
- [describe what data you need]
- [describe relationships to include]
- [describe filters/sorting]
- [describe pagination if needed]

Please provide:
1. The Prisma query
2. TypeScript types for the result
3. Error handling
4. Usage example
```

### React Router Loaders/Actions

```
Create a loader for [route] that:
- [requirement 1]
- [requirement 2]
- [requirement 3]

And an action that:
- [requirement 1]
- [requirement 2]
- [requirement 3]

Include:
- TypeScript types
- Error handling
- Success/error responses
- Optimistic UI if applicable
```

### Tailwind Styling

```
Style [component] with Tailwind CSS.

Design requirements:
- [visual requirement 1]
- [visual requirement 2]
- [visual requirement 3]

Should be:
- Responsive (mobile-first)
- Accessible (proper contrast, focus states)
- Consistent with the design system

Reference: 05-UI-COMPONENTS-GUIDE.md for design tokens
```

---

## Optimization Strategies

### Performance Optimization

```
Analyze [component/route] for performance issues.

Areas to check:
1. Unnecessary re-renders
2. Large bundle size
3. Slow database queries
4. Unoptimized images
5. Missing caching

Provide:
- Analysis of current performance
- Specific optimizations with code examples
- Expected improvements
```

### Bundle Size Optimization

```
Help me reduce the bundle size.

Current size: [x KB]
Target size: [y KB]

Please:
1. Identify large dependencies
2. Suggest alternatives or lazy loading
3. Recommend code splitting strategies
4. Show implementation examples
```

---

## Documentation with Claude Code

### Component Documentation

```
Create comprehensive documentation for [component].

Include:
1. Purpose and use cases
2. Props table with types and defaults
3. Usage examples (3-5 scenarios)
4. Accessibility notes
5. Related components
6. Known limitations

Format as markdown suitable for Storybook or docs site.
```

### API Documentation

```
Document the [API endpoint/function].

Include:
1. Purpose
2. Parameters (types, required, defaults)
3. Return value (type, structure)
4. Error cases
5. Usage examples
6. Related endpoints/functions

Format as JSDoc comments.
```

---

## Common Issues and Solutions

### Issue: TypeScript Errors

```
I'm getting TypeScript errors in [file].

Errors:
[paste errors]

Code:
[paste relevant code]

Help me:
1. Understand the type issue
2. Fix it properly (not with 'any')
3. Explain why the fix works
```

### Issue: React Router Integration

```
I'm having trouble with [React Router concept - loaders/actions/forms].

What I'm trying to do:
[description]

Current code:
[paste code]

Error or unexpected behavior:
[description]

Please help me understand and fix the issue.
```

### Issue: Database Relations

```
I need to query [entity] with [related entities].

Current Prisma query:
[paste query]

Issue:
[description of problem]

Please show me:
1. Correct query with includes
2. How to handle the nested data
3. TypeScript types for the result
```

---

## Best Practices for Claude Code Sessions

### Do's ✅

- **Start with clear context**: Always reference relevant docs
- **Build incrementally**: One feature at a time
- **Test as you go**: Verify each piece works before moving on
- **Ask for explanations**: Understand why, not just what
- **Request alternatives**: "Show me 2-3 ways to implement this"
- **Specify constraints**: Performance, accessibility, mobile support
- **Review and iterate**: Ask for improvements

### Don'ts ❌

- **Don't ask for entire app at once**: Too broad, quality suffers
- **Don't skip validation**: Always include input validation
- **Don't ignore TypeScript**: Use proper types, not 'any'
- **Don't forget error handling**: Every operation can fail
- **Don't skip accessibility**: Build it in from the start
- **Don't optimize prematurely**: Make it work, then make it fast
- **Don't forget mobile**: Test responsive design early

---

## Example: Full Feature Development

Here's a complete example of developing a feature with Claude Code:

### Session 1: Planning

```
I want to add expense tracking to the travel journal.

References:
- Feature spec: 02-PHASE1-MVP-FEATURES.md (section 4)
- Data model: 01-DATA-MODELS.md (Expense model)
- UI components: 05-UI-COMPONENTS-GUIDE.md (Expense components)

Before we start coding, please:
1. Review the specifications
2. Identify all components needed
3. List the routes required
4. Outline the database operations
5. Suggest an implementation order

Then let's break this into small, manageable tasks.
```

### Session 2: Database Setup

```
Let's implement expenses. Starting with the database.

Task: Create Expense model and migration

Requirements from 01-DATA-MODELS.md:
- Link to Trip and User
- Optional link to Entry
- Amount, currency, category, description, date
- Timestamps

Please:
1. Update prisma/schema.prisma
2. Create the migration
3. Show me how to run it
```

### Session 3: Backend API

```
Create the backend API for expenses.

Endpoints needed:
1. GET /api/trips/:tripId/expenses - list all
2. POST /api/trips/:tripId/expenses - create new
3. PUT /api/expenses/:id - update
4. DELETE /api/expenses/:id - delete

For each endpoint:
- Verify authentication
- Validate user owns the trip
- Use Zod for input validation
- Return appropriate status codes
- Handle errors

Follow the pattern from trips API.
```

### Session 4: UI Components

```
Create the expense UI components.

Components needed (reference 05-UI-COMPONENTS-GUIDE.md):
1. ExpenseList - shows list with summary
2. ExpenseForm - create/edit form
3. ExpenseSummary - visual breakdown

Start with ExpenseList:
- Props: expenses array, onAdd, onEdit, onDelete
- Display list of expenses
- Show total by category
- Grand total
- Budget comparison if budget exists
- Add expense button

Use existing UI components (Button, Card, Badge, etc.)
```

### Session 5: Integration & Testing

```
Integrate expenses into the trip detail page.

Tasks:
1. Add expenses to trip loader (include in query)
2. Add "Expenses" tab to trip tabs
3. Wire up ExpenseList component
4. Test create/edit/delete flows
5. Add loading and error states

Test scenarios:
- Create expense → shows in list, updates totals
- Edit expense → updates display
- Delete expense → removes from list
- Over budget → shows warning
```

---

## Wrapping Up Development Sessions

At the end of each session:

```
Summary of what we built today:
[list accomplishments]

What's working:
[list completed features]

What needs attention:
[list issues or todos]

Next session plan:
[outline next steps]

Please review the code we wrote for:
1. Potential bugs
2. Missing error handling
3. Accessibility issues
4. Performance concerns
```

---

## Getting Unstuck

If you're stuck:

```
I'm blocked on [problem].

What I've tried:
1. [attempt 1] - [result]
2. [attempt 2] - [result]
3. [attempt 3] - [result]

Current code:
[paste relevant code]

Error messages:
[paste errors]

Please:
1. Suggest alternative approaches
2. Explain potential root causes
3. Provide a working solution
4. Help me understand how to debug this type of issue in the future
```

---

## Maintaining Quality

### Code Review Checklist

Ask Claude Code to review for:

- [ ] TypeScript types (no 'any')
- [ ] Error handling (try/catch, error states)
- [ ] Loading states (spinners, skeletons)
- [ ] Accessibility (ARIA, keyboard nav, focus)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance (unnecessary re-renders, large queries)
- [ ] Security (input validation, authorization)
- [ ] User experience (clear feedback, intuitive flow)
- [ ] Code organization (single responsibility, DRY)
- [ ] Documentation (comments for complex logic)

---

## Conclusion

Using Claude Code effectively is about:
1. **Clear communication**: Provide context and references
2. **Incremental progress**: Build and verify one piece at a time
3. **Iterative improvement**: Review, refine, optimize
4. **Learning mindset**: Understand the why behind the code

Follow this guide and reference the other documentation files to build a high-quality travel journal application efficiently.