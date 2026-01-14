# MCP Integration Specification

## Overview
This document outlines the Model Context Protocol (MCP) server implementation for the Travel Journal app. The MCP server will expose tools that allow AI assistants (like Claude) to interact with the journal data, enabling AI-assisted journaling and content management.

## What is MCP?

Model Context Protocol is a standard for connecting AI assistants to external data sources and tools. By implementing an MCP server, users can interact with their travel journal through any MCP-compatible client (Claude Desktop, Claude Code, etc.).

## Use Cases

### Primary Use Cases
1. **Voice-to-journal**: Dictate experiences and have AI structure them into proper entries
2. **Quick entry creation**: "Add an entry about dinner last night at that Italian place"
3. **Photo description**: Upload photos and have AI generate descriptions
4. **Smart search**: "Find all the beaches I visited in Thailand"
5. **Trip summaries**: "Summarize my Japan trip"
6. **Expense tracking**: "Add $45 for dinner at La Trattoria"
7. **Recommendations**: "Based on my past entries, suggest places to visit in Portugal"

### Example Interactions

```
User: "Add an entry about the amazing ramen I had in Tokyo yesterday"

AI (via MCP): 
- Searches for user's current trip in Tokyo
- Creates entry with:
  - Date: yesterday's date
  - Category: food
  - Title: "Ramen in Tokyo"
  - Content: asks for more details or generates from voice transcription
  - Prompts for location and photos
```

```
User: "Show me all my favorite restaurants from my Italy trip"

AI (via MCP):
- Searches entries with category="food" and rating>=4
- Filters by Italy trip
- Returns formatted list with locations and details
```

---

## MCP Server Architecture

### Server Configuration

```typescript
// server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "travel-journal-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);
```

### Authentication
- MCP server needs access to user's database
- Options:
  1. Run locally with direct DB access
  2. Use API key authentication
  3. OAuth flow for remote connections

---

## MCP Tools

### 1. create_entry

Create a new journal entry.

```typescript
{
  name: "create_entry",
  description: "Create a new journal entry for a trip",
  inputSchema: {
    type: "object",
    properties: {
      tripId: {
        type: "string",
        description: "ID of the trip"
      },
      title: {
        type: "string",
        description: "Title of the entry"
      },
      content: {
        type: "string",
        description: "Main content in markdown format"
      },
      date: {
        type: "string",
        format: "date",
        description: "Date of the experience (ISO 8601)"
      },
      location: {
        type: "object",
        properties: {
          name: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" }
        }
      },
      category: {
        type: "string",
        enum: ["accommodation", "food", "activity", "transport", "reflection", "other"]
      },
      rating: {
        type: "integer",
        minimum: 1,
        maximum: 5
      }
    },
    required: ["tripId", "title", "content", "date"]
  }
}
```

### 2. search_entries

Search journal entries with flexible criteria.

```typescript
{
  name: "search_entries",
  description: "Search journal entries by various criteria",
  inputSchema: {
    type: "object",
    properties: {
      tripId: {
        type: "string",
        description: "Filter by specific trip"
      },
      query: {
        type: "string",
        description: "Text search in title and content"
      },
      category: {
        type: "string",
        enum: ["accommodation", "food", "activity", "transport", "reflection", "other"]
      },
      minRating: {
        type: "integer",
        minimum: 1,
        maximum: 5
      },
      startDate: {
        type: "string",
        format: "date"
      },
      endDate: {
        type: "string",
        format: "date"
      },
      location: {
        type: "string",
        description: "Search by location name"
      }
    }
  }
}
```

### 3. get_trip_summary

Generate a summary of a trip.

```typescript
{
  name: "get_trip_summary",
  description: "Get a comprehensive summary of a trip including entries, expenses, and statistics",
  inputSchema: {
    type: "object",
    properties: {
      tripId: {
        type: "string",
        description: "ID of the trip to summarize"
      },
      includeExpenses: {
        type: "boolean",
        default: true
      },
      includeStatistics: {
        type: "boolean",
        default: true
      }
    },
    required: ["tripId"]
  }
}
```

Returns:
```json
{
  "trip": {
    "title": "Southeast Asia Adventure",
    "duration": "45 days",
    "destinations": ["Bangkok", "Chiang Mai", "Singapore"]
  },
  "entries": 28,
  "totalExpenses": 3450.00,
  "highlights": [
    "Best rated experience: Thai cooking class (5 stars)",
    "Most visited category: food (12 entries)"
  ],
  "statistics": {
    "countriesVisited": 3,
    "averageRating": 4.2,
    "totalPhotos": 156
  }
}
```

### 4. add_expense

Add an expense to a trip.

```typescript
{
  name: "add_expense",
  description: "Add a new expense to a trip",
  inputSchema: {
    type: "object",
    properties: {
      tripId: {
        type: "string",
        description: "ID of the trip"
      },
      amount: {
        type: "number",
        description: "Amount spent"
      },
      currency: {
        type: "string",
        description: "Currency code (e.g., USD, EUR)"
      },
      category: {
        type: "string",
        enum: ["accommodation", "food", "transport", "activities", "shopping", "other"]
      },
      description: {
        type: "string",
        description: "What was purchased"
      },
      date: {
        type: "string",
        format: "date"
      },
      entryId: {
        type: "string",
        description: "Optional: link to related entry"
      }
    },
    required: ["tripId", "amount", "currency", "category", "description", "date"]
  }
}
```

### 5. list_trips

List all trips for the user.

```typescript
{
  name: "list_trips",
  description: "List all trips with optional filtering",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["planned", "ongoing", "completed"]
      },
      limit: {
        type: "integer",
        default: 10
      }
    }
  }
}
```

### 6. update_entry

Update an existing journal entry.

```typescript
{
  name: "update_entry",
  description: "Update an existing journal entry",
  inputSchema: {
    type: "object",
    properties: {
      entryId: {
        type: "string",
        description: "ID of the entry to update"
      },
      title: { type: "string" },
      content: { type: "string" },
      category: { type: "string" },
      rating: { type: "integer", minimum: 1, maximum: 5 },
      location: { type: "object" }
    },
    required: ["entryId"]
  }
}
```

### 7. get_recommendations

Get AI recommendations based on past entries.

```typescript
{
  name: "get_recommendations",
  description: "Get recommendations based on user's travel history",
  inputSchema: {
    type: "object",
    properties: {
      destination: {
        type: "string",
        description: "Destination to get recommendations for"
      },
      type: {
        type: "string",
        enum: ["food", "activities", "accommodation"],
        description: "Type of recommendation"
      }
    },
    required: ["destination"]
  }
}
```

---

## MCP Resources

Resources provide read-only access to journal data.

### 1. trip://[tripId]

Access full trip data including all entries.

```typescript
{
  uri: "trip://abc-123",
  name: "Southeast Asia Adventure",
  mimeType: "application/json",
  description: "Complete trip data with all entries and expenses"
}
```

### 2. entry://[entryId]

Access individual entry.

```typescript
{
  uri: "entry://xyz-789",
  name: "Amazing Ramen in Tokyo",
  mimeType: "application/json",
  description: "Full entry with content, location, and photos"
}
```

---

## Implementation Steps

### Phase 1: Basic MCP Server
1. Set up MCP server with stdio transport
2. Implement core tools: create_entry, search_entries, list_trips
3. Connect to existing database
4. Test with Claude Desktop

### Phase 2: Advanced Features
1. Add update and delete operations
2. Implement get_recommendations with AI
3. Add batch operations
4. Implement resources

### Phase 3: Enhanced AI Features
1. Semantic search using embeddings
2. Automatic photo descriptions
3. Smart categorization
4. Location extraction from text

---

## Security Considerations

1. **Authentication**: Verify user identity before exposing tools
2. **Data isolation**: Ensure MCP only accesses authenticated user's data
3. **Rate limiting**: Prevent abuse of AI-powered features
4. **Input validation**: Sanitize all inputs before database operations
5. **API keys**: Secure storage for Anthropic API keys if using AI features

---

## Usage Examples

### Example 1: Quick Entry Creation

```typescript
// User in Claude: "Add an entry about the sunset at Santorini yesterday"

// MCP tool call:
create_entry({
  tripId: "current-greece-trip",
  title: "Breathtaking Sunset in Santorini",
  content: "Watched the famous Santorini sunset from Oia. The sky turned 
            incredible shades of orange and pink as the sun dipped into 
            the Aegean Sea. Absolutely magical moment.",
  date: "2024-01-04",
  category: "activity",
  rating: 5,
  location: {
    name: "Oia, Santorini",
    latitude: 36.4618,
    longitude: 25.3753
  }
})
```

### Example 2: Expense Tracking

```typescript
// User: "I spent 45 euros on dinner at La Pergola last night"

// MCP tool call:
add_expense({
  tripId: "italy-trip-2024",
  amount: 45,
  currency: "EUR",
  category: "food",
  description: "Dinner at La Pergola",
  date: "2024-01-04"
})
```

### Example 3: Smart Search

```typescript
// User: "What were my favorite food experiences in Thailand?"

// MCP tool call:
search_entries({
  tripId: "thailand-trip",
  category: "food",
  minRating: 4
})

// AI processes results and presents formatted summary
```

---

## Testing Strategy

1. **Unit tests**: Test each tool independently
2. **Integration tests**: Test with actual database
3. **MCP client testing**: Test with Claude Desktop
4. **User testing**: Real users testing AI-assisted journaling

---

## Future Enhancements

- **Voice integration**: Direct voice-to-entry pipeline
- **Photo analysis**: Automatic location and subject detection
- **Smart suggestions**: AI suggests entry titles and categories
- **Multi-language**: Translate entries on the fly
- **Itinerary generation**: AI creates day-by-day plans from past trips
- **Export**: Generate beautiful PDFs/books via MCP