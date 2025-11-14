# Luminara - UML Diagrams (PlantUML Format)

This directory contains comprehensive UML diagrams documenting Luminara's architecture in **PlantUML format**.

## 📊 Available Diagrams

### Core Architecture
1. **01-class-diagram.puml** - Complete class structure with relationships
2. **02-request-flow-sequence.puml** - Full request lifecycle from user to response
3. **03-component-architecture.puml** - Component organization and data flow

### Advanced Features
4. **04-plugin-system.puml** - Plugin execution and interceptor patterns  
5. **05-stats-system.puml** - Real-time metrics and query architecture
6. **06-driver-three-phase.puml** - Three-phase handler pipeline
7. **07-rate-limiting.puml** - Token bucket algorithm and queuing
8. **08-request-hedging.puml** - Request hedging policies and flow

### Overview
9. **00-overview.puml** - Complete architecture overview

## 🎯 How to View PlantUML Diagrams

### Option 1: VS Code (Recommended)
Install PlantUML extension:
```powershell
code --install-extension jebbs.plantuml
```

Then:
1. Open any `.puml` file
2. Press `Alt+D` to preview diagram
3. Press `Ctrl+Shift+P` and search "PlantUML: Export" to save as PNG/SVG

### Option 2: Online Viewer
Copy the entire `.puml` file content and paste into:
- http://www.plantuml.com/plantuml/uml/
- https://planttext.com/

### Option 3: Command Line
```powershell
# Install PlantUML
npm install -g node-plantuml

# Generate PNG from .puml file
cat .\01-class-diagram.puml | plantuml-pipe > class-diagram.png

# Or use Java PlantUML (if Java is installed)
java -jar plantuml.jar .\01-class-diagram.puml
```

### Option 4: IntelliJ IDEA / WebStorm
PlantUML support is built-in or available via plugin.

## 🏗️ Architecture Overview

Luminara follows a **layered architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────┐
│           Application Code (User)               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      Public API (LuminaraClient + Helpers)      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│   Core Orchestration (Retry, Plugins, Config)  │
│           + Stats System (Real-time)            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Driver Layer (NativeFetchDriver)               │
│  • Phase 1: Pre-Flight (URL, dedupe, debounce)│
│  • Phase 2: In-Flight (timeout, fetch)         │
│  • Phase 3: Post-Flight (parse, transform)     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      Native Fetch API (Zero Dependencies)       │
└─────────────────────────────────────────────────┘
```

## 📖 Quick Reference

### Request Flow
```
User Request
  → Public API (LuminaraClient)
  → Configuration Merge
  → Context Building
  → Retry Loop
    → Plugin onRequest (L→R)
    → Driver Phase 1: Pre-Flight
    → Driver Phase 2: In-Flight
    → Driver Phase 3: Post-Flight
    → Plugin onResponse/onResponseError (R→L)
    → Stats Event Emission
  → Return or Retry
```

### Plugin Execution Order
```
Plugins: [Auth, Logger, Cache]

onRequest:  Auth → Logger → Cache → [Driver]
                L              →              R

onResponse: [Driver] → Cache → Logger → Auth
                R              ←              L
```

### Driver Three Phases
```
Phase 1 (Pre-Flight): RequestDispatcher
  → URL building
  → Deduplication
  → Debouncing
  → Rate limiting

Phase 2 (In-Flight): InFlightHandler
  → Timeout setup
  → Native fetch() call

Phase 3 (Post-Flight): Response Handlers
  → Success: Parse response
  → Error: Transform error
```

## 🎨 Color Coding

Diagrams use consistent color coding:
- **Blue** (#E1F5FF): Public API Layer
- **Yellow** (#FFF9C4): Core Orchestration
- **Green** (#E8F5E9): Stats System
- **Orange** (#FFE0B2): Driver Layer
- **Purple** (#F3E5F5): Features/Plugins
- **Red** (#FFEBEE): External Dependencies

## 📚 Related Documentation

- **README.md** - Project overview and quick start
- **.github/copilot-instructions.md** - AI agent development guide
- **.github/SEPARATION_OF_CONCERNS.md** - Architecture principles
- **docs/performance.md** - Performance metrics and benchmarks

## 🔄 Keeping Diagrams Updated

When making architectural changes:
1. Update relevant PlantUML diagram(s) in `.puml` files
2. Regenerate images if needed (PNG/SVG exports)
3. Commit both `.puml` files and exported images
4. Reference in PR description

## 💡 Tips

- PlantUML syntax is **case-sensitive**
- Use `@startuml ... @enduml` to wrap diagrams
- Colors defined with `!define` directive
- Sequence diagrams auto-number with `autonumber`
- Component diagrams support packages and nesting

## 🛠️ Troubleshooting

**Diagram not rendering?**
- Check PlantUML syntax with online validator
- Ensure Java is installed (required for PlantUML)
- Try different PlantUML server endpoint

**Export fails?**
- Install Graphviz: `choco install graphviz` (Windows)
- Configure PlantUML server in VS Code settings

**Syntax errors?**
- Validate at http://www.plantuml.com/plantuml/
- Check for missing `@enduml` tags
- Verify arrow syntax: `-->`, `->`, `..>`
