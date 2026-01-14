# Conform Forms Guide

## Overview
This guide explains how to use Conform for form handling in the Travel Journal application. Conform provides type-safe forms with progressive enhancement and works seamlessly with React Router and Zod validation.

## Why Conform?

- **Progressive Enhancement**: Forms work without JavaScript
- **Type Safety**: Full TypeScript support with Zod integration
- **Server-First**: Validation happens on the server by default
- **Accessibility**: Built-in ARIA support
- **React Router Integration**: Works perfectly with loaders and actions
- **Flexible Validation**: Client-side, server-side, or both

---

## Installation

```bash
pnpm add @conform-to/react @conform-to/zod zod
```

---

## Basic Pattern

### 1. Define Zod Schema

```typescript
// app/lib/validations.ts
import { z } from "zod";

export const tripSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  startDate: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Invalid date"
  ),
  endDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date"
  ),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]),
  budget: z.coerce.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
});

export type TripFormData = z.infer<typeof tripSchema>;
```

### 2. Create Action with Validation

```typescript
// app/routes/trips.new.tsx
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { parseWithZod } from "@conform-to/zod";
import { tripSchema } from "~/lib/validations";
import { db } from "~/lib/db.server";
import { requireAuth } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: tripSchema });
  
  // Return validation errors if submission fails
  if (submission.status !== "success") {
    return submission.reply();
  }
  
  // Use validated data
  const trip = await db.trip.create({
    data: {
      ...submission.value,
      startDate: new Date(submission.value.startDate),
      endDate: submission.value.endDate ? new Date(submission.value.endDate) : null,
      userId: user.id,
    },
  });
  
  return redirect(`/trips/${trip.id}`);
}
```

### 3. Create Form Component

```typescript
import { Form, useActionData } from "@remix-run/react";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { tripSchema } from "~/lib/validations";

export default function NewTrip() {
  const lastResult = useActionData<typeof action>();
  
  const [form, fields] = useForm({
    // Last submission result from action
    lastResult,
    
    // Client-side validation
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: tripSchema });
    },
    
    // When to validate
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit}>
      <div>
        <label htmlFor={fields.title.id}>Title</label>
        <input
          id={fields.title.id}
          name={fields.title.name}
          defaultValue={fields.title.initialValue}
          aria-invalid={!fields.title.valid || undefined}
          aria-describedby={!fields.title.valid ? fields.title.errorId : undefined}
        />
        {fields.title.errors && (
          <div id={fields.title.errorId}>{fields.title.errors}</div>
        )}
      </div>
      
      <button type="submit">Create Trip</button>
    </Form>
  );
}
```

---

## Advanced Patterns

### File Upload

```typescript
// Schema with file validation
const entrySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  // Photos will be handled separately as they're files
});

// Action handling files
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  // Extract files before parsing
  const photos = formData.getAll("photos") as File[];
  
  // Parse the rest
  const submission = parseWithZod(formData, { 
    schema: entrySchema 
  });
  
  if (submission.status !== "success") {
    return submission.reply();
  }
  
  // Process photos
  const photoUrls = await Promise.all(
    photos.map(photo => uploadPhoto(photo))
  );
  
  // Create entry with photos
  const entry = await db.entry.create({
    data: {
      ...submission.value,
      photos: photoUrls.map((url, i) => ({
        url,
        order: i,
      })),
    },
  });
  
  return redirect(`/entries/${entry.id}`);
}

// Component
function EntryForm() {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: entrySchema });
    },
  });
  
  return (
    <Form method="post" encType="multipart/form-data" {...form.props}>
      <input
        type="file"
        name="photos"
        multiple
        accept="image/*"
      />
      {/* Other fields */}
    </Form>
  );
}
```

### Nested Objects

```typescript
// Schema with nested location
const entrySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  location: z.object({
    name: z.string(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
  }).optional(),
});

// Component with nested fields
function EntryForm() {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: entrySchema });
    },
  });
  
  return (
    <Form method="post" {...form.props}>
      <input name={fields.title.name} />
      
      {/* Nested location fields */}
      <input name={fields.location.name.name} placeholder="Location name" />
      <input 
        name={fields.location.latitude.name} 
        type="number" 
        step="any"
        placeholder="Latitude" 
      />
      <input 
        name={fields.location.longitude.name} 
        type="number" 
        step="any"
        placeholder="Longitude" 
      />
    </Form>
  );
}
```

### Dynamic Lists (Array Fields)

```typescript
// Schema with array
const tripSchema = z.object({
  title: z.string(),
  destinations: z.array(z.string()).min(1, "Add at least one destination"),
});

// Component with dynamic list
function TripForm() {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: tripSchema });
    },
  });
  
  const destinations = fields.destinations.getFieldList();
  
  return (
    <Form method="post" {...form.props}>
      <input name={fields.title.name} />
      
      <div>
        <label>Destinations</label>
        {destinations.map((destination, index) => (
          <div key={destination.key}>
            <input name={destination.name} defaultValue={destination.initialValue} />
            <button
              {...form.remove.getButtonProps({
                name: fields.destinations.name,
                index,
              })}
            >
              Remove
            </button>
          </div>
        ))}
        
        <button
          {...form.insert.getButtonProps({
            name: fields.destinations.name,
          })}
        >
          Add Destination
        </button>
      </div>
      
      {fields.destinations.errors && (
        <div>{fields.destinations.errors}</div>
      )}
    </Form>
  );
}
```

### Select Dropdown

```typescript
const entrySchema = z.object({
  category: z.enum(["FOOD", "ACCOMMODATION", "ACTIVITY", "TRANSPORT", "REFLECTION", "OTHER"]),
  rating: z.coerce.number().min(1).max(5).optional(),
});

function EntryForm() {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: entrySchema });
    },
  });
  
  return (
    <Form method="post" {...form.props}>
      <select 
        name={fields.category.name}
        defaultValue={fields.category.initialValue}
      >
        <option value="">Select category</option>
        <option value="FOOD">Food</option>
        <option value="ACCOMMODATION">Accommodation</option>
        <option value="ACTIVITY">Activity</option>
        <option value="TRANSPORT">Transport</option>
        <option value="REFLECTION">Reflection</option>
        <option value="OTHER">Other</option>
      </select>
      {fields.category.errors && <div>{fields.category.errors}</div>}
      
      <select 
        name={fields.rating.name}
        defaultValue={fields.rating.initialValue}
      >
        <option value="">No rating</option>
        <option value="1">1 star</option>
        <option value="2">2 stars</option>
        <option value="3">3 stars</option>
        <option value="4">4 stars</option>
        <option value="5">5 stars</option>
      </select>
    </Form>
  );
}
```

### Checkbox

```typescript
const tripSchema = z.object({
  title: z.string(),
  isPublic: z.boolean().default(false),
});

function TripForm() {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: tripSchema });
    },
  });
  
  return (
    <Form method="post" {...form.props}>
      <input name={fields.title.name} />
      
      <label>
        <input
          type="checkbox"
          name={fields.isPublic.name}
          value="true"
          defaultChecked={fields.isPublic.initialValue === "true"}
        />
        Make this trip public
      </label>
    </Form>
  );
}
```

---

## Custom Reusable Components

### FormField Wrapper

```typescript
// app/components/ui/form-field.tsx
import { FieldMetadata } from "@conform-to/react";

interface FormFieldProps {
  field: FieldMetadata<string>;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export function FormField({ 
  field, 
  label, 
  type = "text",
  placeholder,
  required 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={field.id} className="block font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={field.id}
        name={field.name}
        type={type}
        defaultValue={field.initialValue}
        placeholder={placeholder}
        required={required}
        aria-invalid={!field.valid || undefined}
        aria-describedby={!field.valid ? field.errorId : undefined}
        className="w-full px-3 py-2 border rounded-md"
      />
      
      {field.errors && (
        <div id={field.errorId} className="text-red-600 text-sm">
          {field.errors}
        </div>
      )}
    </div>
  );
}

// Usage
<FormField 
  field={fields.title} 
  label="Trip Title" 
  placeholder="Enter trip title"
  required 
/>
```

### TextArea Component

```typescript
interface TextAreaFieldProps {
  field: FieldMetadata<string>;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export function TextAreaField({ 
  field, 
  label, 
  placeholder,
  rows = 4,
  required 
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={field.id} className="block font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={field.id}
        name={field.name}
        defaultValue={field.initialValue}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-invalid={!field.valid || undefined}
        aria-describedby={!field.valid ? field.errorId : undefined}
        className="w-full px-3 py-2 border rounded-md"
      />
      
      {field.errors && (
        <div id={field.errorId} className="text-red-600 text-sm">
          {field.errors}
        </div>
      )}
    </div>
  );
}
```

### Select Component

```typescript
interface SelectFieldProps {
  field: FieldMetadata<string>;
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
}

export function SelectField({ 
  field, 
  label, 
  options,
  placeholder = "Select an option",
  required 
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={field.id} className="block font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={field.id}
        name={field.name}
        defaultValue={field.initialValue}
        required={required}
        aria-invalid={!field.valid || undefined}
        aria-describedby={!field.valid ? field.errorId : undefined}
        className="w-full px-3 py-2 border rounded-md"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {field.errors && (
        <div id={field.errorId} className="text-red-600 text-sm">
          {field.errors}
        </div>
      )}
    </div>
  );
}
```

---

## Form States

### Loading State

```typescript
import { useNavigation } from "@remix-run/react";

function TripForm() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [form, fields] = useForm({
    // ...
  });
  
  return (
    <Form method="post" {...form.props}>
      {/* Form fields */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Trip"}
      </button>
    </Form>
  );
}
```

### Success Message

```typescript
export async function action({ request }: ActionFunctionArgs) {
  // ... validation and creation
  
  return json(
    { success: true, trip },
    { 
      headers: {
        "Set-Cookie": await createFlashMessage("Trip created successfully!")
      }
    }
  );
}

function TripForm() {
  const actionData = useActionData<typeof action>();
  
  return (
    <>
      {actionData?.success && (
        <div className="bg-green-100 p-4 rounded">
          Trip created successfully!
        </div>
      )}
      
      <Form method="post">
        {/* Form */}
      </Form>
    </>
  );
}
```

---

## Validation Patterns

### Custom Validators

```typescript
const tripSchema = z.object({
  startDate: z.string(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    if (!data.endDate) return true;
    return new Date(data.endDate) >= new Date(data.startDate);
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);
```

### Async Validation (Server-Side)

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: tripSchema });
  
  if (submission.status !== "success") {
    return submission.reply();
  }
  
  // Check if slug is unique
  const existingTrip = await db.trip.findFirst({
    where: { slug: submission.value.slug },
  });
  
  if (existingTrip) {
    return submission.reply({
      fieldErrors: {
        slug: ["This slug is already taken"],
      },
    });
  }
  
  // Continue with creation
}
```

---

## Testing Forms

### Unit Test Example

```typescript
import { parseWithZod } from "@conform-to/zod";
import { tripSchema } from "~/lib/validations";

describe("Trip Form Validation", () => {
  it("should validate required fields", () => {
    const formData = new FormData();
    formData.append("title", "");
    
    const result = parseWithZod(formData, { schema: tripSchema });
    
    expect(result.status).toBe("error");
    expect(result.error.title).toBeDefined();
  });
  
  it("should accept valid data", () => {
    const formData = new FormData();
    formData.append("title", "My Trip");
    formData.append("startDate", "2024-01-01");
    formData.append("status", "PLANNED");
    
    const result = parseWithZod(formData, { schema: tripSchema });
    
    expect(result.status).toBe("success");
  });
});
```

---

## Best Practices

1. **Always validate on server**: Client validation is for UX, server validation is for security
2. **Use meaningful error messages**: Help users understand what's wrong
3. **Progressive enhancement**: Forms should work without JavaScript
4. **Accessibility**: Use proper labels, ARIA attributes, error associations
5. **TypeScript**: Use `z.infer` to derive types from schemas
6. **Reusable components**: Create wrapper components for common patterns
7. **Loading states**: Show feedback during submission
8. **Success feedback**: Confirm successful actions
9. **Error handling**: Handle both validation and server errors gracefully
10. **Default values**: Provide sensible defaults for optional fields

---

## Common Patterns Summary

| Pattern | Use Case | Key Features |
|---------|----------|--------------|
| Basic Form | Simple create/edit | Schema, action, useForm |
| File Upload | Photos, documents | multipart/form-data, separate file handling |
| Nested Objects | Complex data | Dot notation in field names |
| Dynamic Lists | Multiple items | getFieldList, insert, remove |
| Custom Validation | Business logic | refine, superRefine |
| Async Validation | Unique checks | Server-side validation, reply with errors |

---

## Troubleshooting

### Issue: Fields not showing errors

**Solution**: Make sure you're checking `field.errors` not `field.error`

### Issue: Form not submitting

**Solution**: Check that `form.props` is spread on the Form element

### Issue: Initial values not showing

**Solution**: Use `defaultValue` not `value` on inputs

### Issue: File uploads not working

**Solution**: Add `encType="multipart/form-data"` to Form

### Issue: Validation running on mount

**Solution**: Set `shouldValidate: "onBlur"` or `"onSubmit"`

---

## Resources

- [Conform Documentation](https://conform.guide/)
- [Zod Documentation](https://zod.dev/)
- [React Router Forms](https://reactrouter.com/en/main/guides/form-data)

---

## Next Steps

Once comfortable with Conform:
1. Create reusable form components
2. Add optimistic UI for better UX
3. Implement file upload with progress
4. Add keyboard shortcuts for power users
5. Consider form analytics to improve UX