# Luminara UML Diagrams

This directory contains comprehensive UML diagrams documenting Luminara's internal architecture and request processing flows.

## 📋 Diagram Index

### Sequence Diagrams

#### 1. **Basic HTTP Request Flow** (`sequence-basic-request.puml`)
Shows the fundamental request/response cycle through Luminara's plugin system.

**Key Components:**
- User Code → LuminaraClient
- Plugin Pipeline (onRequest, onSuccess, onError hooks)
- Driver execution
- Response parsing

**Use Cases:**
- Understanding basic HTTP request flow
- Plugin hook execution order
- Success vs error paths

---

#### 2. **Retry Mechanism with Backoff** (`sequence-retry-backoff.puml`)
Detailed view of the retry logic with different backoff strategies.

**Key Components:**
- Retry Handler
- Backoff Strategy (Linear, Exponential, Fibonacci, Decorrelated Jitter)
- Retry condition checking
- Delay calculation and waiting

**Use Cases:**
- Understanding retry behavior
- Backoff strategy selection
- Retry timing and delays

---

#### 3. **Plugin Lifecycle and Interceptors** (`sequence-plugin-lifecycle.puml`)
Complete plugin system with multiple plugins working together.

**Key Components:**
- Multiple plugins (Logger, Auth, Transform)
- Plugin execution order
- Request/response transformation
- Error recovery in plugins

**Use Cases:**
- Building custom plugins
- Understanding plugin interactions
- Auth token refresh patterns

---

#### 4. **Stats System Data Flow** (`sequence-stats-system.puml`)
How the stats system tracks and aggregates request metrics.

**Key Components:**
- StatsHub orchestration
- Stats modules (Counters, Time, Retry, Error, Rate)
- Event tracking (onRequestStart, onRequestSuccess, etc.)
- Query engine

**Use Cases:**
- Understanding stats collection
- Querying stats data
- Performance monitoring

---

#### 5. **Complete Request Lifecycle** (`sequence-complete-lifecycle.puml`)
End-to-end request processing with all features enabled.

**Key Components:**
- Full plugin pipeline
- URL building
- Timeout management
- Retry with backoff
- Response parsing
- Error handling
- Stats tracking

**Use Cases:**
- Comprehensive understanding
- Debugging complex scenarios
- Feature integration

---

### Class Diagrams

#### 6. **Core Architecture** (`class-core-architecture.puml`)
Complete class structure of Luminara's core components.

**Key Components:**
- LuminaraClient (main API)
- Plugin interface
- Driver interface and implementations
- Feature modules (Native Driver)
- Stats modules

**Use Cases:**
- Architecture overview
- Understanding class relationships
- API surface area

---

### Component Diagrams

#### 7. **Driver Comparison** (`component-driver-comparison.puml`)
Comparison between Ofetch Driver and Native Driver architectures.

**Key Components:**
- OfetchDriver (uses external library)
- NativeDriver (custom implementation)
- Feature modules
- Trade-offs and benefits

**Use Cases:**
- Choosing a driver
- Understanding driver differences
- Custom driver development

---

### State Diagrams

#### 8. **Request State Machine** (`state-request-lifecycle.puml`)
State transitions during a request lifecycle.

**Key States:**
- Idle → Preparing → Queued → Executing
- Retry loop states
- Success/failure paths
- Stats recording

**Use Cases:**
- Understanding request states
- Debugging stuck requests
- State-dependent behavior

---

## 🚀 Viewing the Diagrams

### Option 1: VS Code with PlantUML Extension

1. Install the PlantUML extension in VS Code
2. Open any `.puml` file
3. Press `Alt+D` to preview

### Option 2: Generate PNG/SVG Images

Using PlantUML CLI:

```powershell
# Generate all diagrams as PNG
plantuml docs/uml/*.puml

# Generate as SVG
plantuml -tsvg docs/uml/*.puml
```

### Option 3: Online Viewer

1. Copy the content of any `.puml` file
2. Visit: https://www.plantuml.com/plantuml/uml/
3. Paste and view

---

## 📚 Reading Guide

### For New Users
Start with these diagrams in order:
1. **Basic HTTP Request Flow** - Understand the fundamentals
2. **Plugin Lifecycle** - Learn about plugins
3. **Core Architecture** - See the big picture

### For Plugin Developers
Focus on:
1. **Plugin Lifecycle and Interceptors**
2. **Basic HTTP Request Flow**
3. **Complete Request Lifecycle**

### For Advanced Users
Deep dive into:
1. **Complete Request Lifecycle**
2. **Retry Mechanism with Backoff**
3. **Stats System Data Flow**
4. **Request State Machine**

### For Contributors
Study all diagrams, especially:
1. **Core Architecture**
2. **Driver Comparison**
3. **Complete Request Lifecycle**

---

## 🎨 Diagram Conventions

### Colors & Symbols
- 🟢 Success path
- 🔴 Error path
- ⚙️ Processing/transformation
- 📊 Stats tracking
- ♻️ Retry attempt

### Activation Bars
- Thick bars = active component
- Dashed returns = async operations
- Loops = retry/iteration logic

### Notes
- Right-side notes = additional context
- Grouped boxes = related components
- Arrows = data/control flow

---

## 🔄 Keeping Diagrams Updated

When making changes to Luminara:

1. **New Features**: Create or update relevant sequence diagrams
2. **Architecture Changes**: Update class/component diagrams
3. **State Changes**: Update state machine diagram
4. **Plugin System**: Update plugin lifecycle diagram

---

## 📖 Additional Resources

- [Luminara README](../../README.md) - Main documentation
- [PlantUML Syntax](https://plantuml.com/) - Diagram syntax reference
- [Separation of Concerns](../../.github/SEPARATION_OF_CONCERNS.md) - Architecture principles

---

## 🤝 Contributing

When adding new diagrams:

1. Use consistent naming: `{type}-{feature}.puml`
2. Include title and theme
3. Add clear comments in diagram
4. Update this README with description
5. Follow PlantUML best practices

**Diagram Types:**
- `sequence-` - Sequence diagrams
- `class-` - Class diagrams
- `component-` - Component diagrams
- `state-` - State diagrams
- `activity-` - Activity diagrams
