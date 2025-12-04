# Design Pattern Selection Guide

This guide provides a decision tree and reference table to help you select the most appropriate Gang of Four design pattern for your problem.

## Quick Decision Table

| Your Need | Pattern(s) | Category | When to Use |
|-----------|-----------|----------|------------|
| Need only one instance globally | **Singleton** | Creational | Configuration, loggers, connection pools |
| Create objects without specifying classes | **Factory Method** | Creational | Decouple creation, allow subclasses to choose |
| Create families of related objects | **Abstract Factory** | Creational | UI frameworks, database drivers |
| Complex object construction | **Builder** | Creational | Configuration objects, fluent APIs |
| Clone expensive objects | **Prototype** | Creational | Expensive object creation, templates |
| Adapt incompatible interfaces | **Adapter** | Structural | Legacy integration, third-party libraries |
| Decouple abstraction from implementation | **Bridge** | Structural | OS-specific code, rendering engines |
| Part-whole hierarchies (trees) | **Composite** | Structural | File systems, UI, organizational charts |
| Add behavior dynamically | **Decorator** | Structural | Wrapping objects, middleware, streams |
| Simplify complex subsystem | **Facade** | Structural | Framework initialization, simplified APIs |
| Share many fine-grained objects | **Flyweight** | Structural | Large object counts, memory optimization |
| Control access to objects | **Proxy** | Structural | Lazy loading, remote objects, access control |
| Pass request through handlers | **Chain of Responsibility** | Behavioral | Event handling, logging, approval workflows |
| Encapsulate actions as objects | **Command** | Behavioral | Undo/redo, queuing, remote invocation |
| Parse custom languages/grammars | **Interpreter** | Behavioral | Expression evaluation, DSLs, query builders |
| Traverse collections uniformly | **Iterator** | Behavioral | Collection access, tree/graph traversal |
| Centralize complex interactions | **Mediator** | Behavioral | Dialog coordination, event buses |
| Capture and restore state | **Memento** | Behavioral | Undo/redo, savepoints, transactions |
| Notify many objects of changes | **Observer** | Behavioral | Event systems, reactive programming, data binding |
| Object behavior varies by state | **State** | Behavioral | TCP states, order workflows, game states |
| Interchangeable algorithms | **Strategy** | Behavioral | Sorting, compression, validation algorithms |
| Vary algorithm steps | **Template Method** | Behavioral | Framework hooks, lifecycle methods |
| Add operations to object structures | **Visitor** | Behavioral | Compilers, reporting, transformations |

---

## Decision Tree: What Problem Are You Solving?

### Step 1: Problem Category

```
Are you solving an object creation problem?
  → YES: Go to Creational Patterns (below)
  → NO: Continue

Are you solving an object composition problem?
  → YES: Go to Structural Patterns (below)
  → NO: Continue

Are you solving an object communication/responsibility problem?
  → YES: Go to Behavioral Patterns (below)
  → NO: You may not need a GoF pattern
```

### Creational Patterns Decision Tree

**How do you need to create objects?**

```
Do you need EXACTLY ONE instance?
  → YES: Use SINGLETON
  → NO: Continue

Do you need to create DIFFERENT TYPES at runtime?
  → YES: Is it a FAMILY of related objects?
    → YES: Use ABSTRACT FACTORY
    → NO: Use FACTORY METHOD
  → NO: Continue

Is the construction process COMPLEX with many steps?
  → YES: Use BUILDER
  → NO: Continue

Is object creation EXPENSIVE and you want to COPY existing objects?
  → YES: Use PROTOTYPE
  → NO: Simple constructors are sufficient
```

### Structural Patterns Decision Tree

**How do you need to compose objects/classes?**

```
Do you need to adapt INCOMPATIBLE INTERFACES?
  → YES: Use ADAPTER
  → NO: Continue

Do you want SEPARATE abstraction and implementation hierarchies?
  → YES: Use BRIDGE
  → NO: Continue

Do you need to represent PART-WHOLE HIERARCHIES (trees)?
  → YES: Use COMPOSITE
  → NO: Continue

Do you want to ADD RESPONSIBILITIES DYNAMICALLY to individual objects?
  → YES: Use DECORATOR
  → NO: Continue

Do you want to SIMPLIFY ACCESS to complex subsystems?
  → YES: Use FACADE
  → NO: Continue

Do you need to create MANY SIMILAR OBJECTS and memory is constrained?
  → YES: Use FLYWEIGHT
  → NO: Continue

Do you want to CONTROL ACCESS to another object?
  → YES: Use PROXY
  → NO: Simple composition/delegation is sufficient
```

### Behavioral Patterns Decision Tree

**How should objects communicate?**

```
Do you want to PASS REQUESTS through a chain of handlers?
  → YES: Use CHAIN OF RESPONSIBILITY
  → NO: Continue

Do you want to ENCAPSULATE REQUESTS as objects?
  → YES: Use COMMAND
  → NO: Continue

Do you need to INTERPRET CUSTOM LANGUAGES/GRAMMARS?
  → YES: Use INTERPRETER
  → NO: Continue

Do you want to ACCESS ELEMENTS without exposing the collection?
  → YES: Use ITERATOR
  → NO: Continue

Do you want to CENTRALIZE COMPLEX INTERACTIONS between objects?
  → YES: Use MEDIATOR
  → NO: Continue

Do you want to CAPTURE/RESTORE OBJECT STATE without breaking encapsulation?
  → YES: Use MEMENTO
  → NO: Continue

Do you want to NOTIFY MULTIPLE OBJECTS of state changes?
  → YES: Use OBSERVER
  → NO: Continue

Does object behavior CHANGE BASED ON INTERNAL STATE?
  → YES: Use STATE
  → NO: Continue

Do you need INTERCHANGEABLE ALGORITHMS that client selects?
  → YES: Use STRATEGY
  → NO: Continue

Do you want to VARY ALGORITHM STEPS through subclassing?
  → YES: Use TEMPLATE METHOD
  → NO: Continue

Do you want to ADD OPERATIONS to an object structure?
  → YES: Use VISITOR
  → NO: Simple methods are sufficient
```

---

## Pattern Selection by Problem Domain

### Web Applications

| Problem | Pattern | Example |
|---------|---------|---------|
| User authentication persistence | Singleton | AuthenticationManager |
| Creating different page types | Factory Method | PageFactory |
| UI component styling | Decorator | StyledButton (Button + BorderDecorator) |
| State machine for forms | State | FormStateManager (Idle → Filled → Validating → Submitted) |
| Event handling | Observer | FormEventBus |
| Complex queries | Builder | QueryBuilder for SQL/API |
| API response transformation | Visitor | ResponseVisitor (JSON/XML/CSV) |

### Game Development

| Problem | Pattern | Example |
|---------|---------|---------|
| Single game manager | Singleton | GameManager |
| Creating game objects | Factory Method | EnemyFactory |
| Game entity behaviors | Strategy | MovementStrategy (patrol, chase, flee) |
| Character states | State | CharacterState (idle, running, jumping) |
| UI element hierarchy | Composite | UIPanel (contains other panels and buttons) |
| Particle effects composition | Decorator | ParticleEffect (base + AdditiveBlend + Rotation) |
| Event system | Observer | EventBus (subscribers listen to events) |
| Saving game state | Memento | GameSaveSnapshot |

### Enterprise Applications

| Problem | Pattern | Example |
|---------|---------|---------|
| Database connections | Singleton | ConnectionPool |
| Different database types | Abstract Factory | DatabaseFactory (SQL Server, PostgreSQL, Oracle) |
| Complex order creation | Builder | OrderBuilder |
| Workflow approval chain | Chain of Responsibility | ApprovalChain |
| Business operations | Command | Transaction (for undo/redo, logging) |
| System monitoring | Observer | EventLog (listens to system events) |
| Configuration objects | Singleton | AppConfiguration |
| Export formats | Visitor | ReportVisitor (PDF, Excel, JSON) |

### Data Processing

| Problem | Pattern | Example |
|---------|---------|---------|
| Multi-step data pipeline | Template Method | DataProcessingTemplate (read, transform, write) |
| Different compression algorithms | Strategy | CompressionStrategy (zip, gzip, bzip2) |
| Tree structure processing | Composite | FileSystemNode (files and directories) |
| Complex queries | Interpreter | QueryExpression (boolean logic, comparisons) |
| Collection traversal | Iterator | TreeIterator (depth-first, breadth-first) |
| Data validation rules | Strategy | ValidationStrategy (email, phone, custom) |

### System Architecture

| Problem | Pattern | Example |
|---------|---------|---------|
| Single entry point | Facade | SystemAPI |
| Platform-specific implementation | Bridge | GraphicsDriver (Windows, Mac, Linux) |
| Centralized object creation | Factory Method | ServiceFactory |
| Permission-based access | Proxy | SecureDocumentProxy |
| Feature toggling | Decorator | FeatureDecorator |
| Caching layer | Proxy | CacheProxy |

---

## Combining Patterns (Common Compositions)

Many problems benefit from using multiple patterns together:

### Creative Problem-Solving
1. **Factory + Builder**: Factory creates builders, builder constructs complex objects
2. **Factory + Strategy**: Factory creates appropriate strategy implementations
3. **Abstract Factory + Singleton**: Singleton factory instances for product families

### Complex State Management
1. **State + Strategy**: State pattern for transitions, strategy for behavior variation
2. **Memento + Command**: Commands store mementos for undo/redo
3. **State + Composite**: States for multi-level state machines

### Flexible System Architecture
1. **Facade + Singleton**: Single facade instance for subsystem access
2. **Bridge + Strategy**: Separate implementation hierarchy with algorithmic variation
3. **Proxy + Decorator**: Proxy for access control, decorator for behavior addition

### Event-Driven Systems
1. **Observer + Mediator**: Mediator uses observer to notify colleagues
2. **Chain of Responsibility + Observer**: Events propagate through chain with observers
3. **Command + Observer**: Commands trigger observer notifications

### Complex Data Structures
1. **Composite + Iterator**: Traverse tree structures uniformly
2. **Composite + Visitor**: Perform operations on tree elements
3. **Iterator + Memento**: Iterator captures state in memento

### Extensible Frameworks
1. **Template Method + Strategy**: Template defines structure, strategies vary algorithms
2. **Factory Method + Template Method**: Factory creates subclasses that use template method
3. **Decorator + Factory**: Factory creates decorated objects

---

## Anti-Patterns: When NOT to Use Patterns

### Premature Abstraction
- **Problem**: Applying patterns before they're needed
- **Solution**: Refactor toward patterns when need arises (YAGNI principle)

### Over-Engineering
- **Problem**: Using complex patterns for simple problems
- **Solution**: Start simple, add patterns as complexity demands

### God Objects
- **Problem**: Mediator, Facade becoming monolithic dumping grounds
- **Solution**: Split into smaller mediators/facades, use multiple patterns

### Singleton Abuse
- **Problem**: Overuse creates global state, hides dependencies, hard to test
- **Solution**: Use dependency injection, limit to true singletons

### Pattern Overloading
- **Problem**: Too many patterns in one class
- **Solution**: Each class should primarily follow one pattern

---

## Selecting Patterns for Your Language

### Idiomatic Patterns by Language

**Python**
- Leverage metaclasses (Singleton, ABCs)
- Use decorators naturally (@decorator syntax)
- Duck typing reduces need for many structural patterns
- Generators for Iterator pattern

**Rust**
- Traits for interfaces and polymorphism
- Enums for type-safe State pattern
- Arc/Mutex for thread-safe Singleton
- Pattern matching for command dispatch

**C#**
- Events/delegates for Observer pattern
- Generics for type-safe factories
- Lazy<T> for thread-safe Singleton
- Async/await for asynchronous patterns

**TypeScript**
- Union types for State pattern (discriminated unions)
- Decorators for metadata patterns
- Function types for Strategy/Command
- Generics for type safety

**Go**
- Implicit interface implementation
- Function types for Strategy/Command
- sync.Once for thread-safe Singleton
- Channels for Observer pattern

**Dart**
- Factory constructors for Factory patterns
- Sealed classes for exhaustive State matching
- Streams for Observer pattern
- Cascade notation for Builder patterns

---

## Pattern Learning Path

If you're new to design patterns, learn them in this order:

1. **Factory Method** - Simple pattern, widely used, easy to understand
2. **Observer** - Fundamental to event-driven systems
3. **Decorator** - Teaches composition over inheritance
4. **Strategy** - Teaches parameterizing behavior
5. **Template Method** - Teaches skeletal structure
6. **Singleton** - Common but use carefully
7. **Adapter** - Essential for integration
8. **Composite** - Teaches recursive structures
9. **State** - More advanced state management
10. **Command** - Teaches encapsulating actions
11. **Iterator** - Teaches uniform traversal
12. **Proxy** - Teaches access control/lazy loading
13. **Builder** - For complex construction
14. **Chain of Responsibility** - For request routing
15. **Facade** - For API simplification
16. **Bridge** - For abstraction/implementation separation
17. **Mediator** - For complex coordination
18. **Memento** - For state capture
19. **Interpreter** - For custom languages
20. **Visitor** - For operation addition
21. **Prototype** - For cloning
22. **Abstract Factory** - Complex factory variant
23. **Flyweight** - Memory optimization pattern

---

See the category resource files for detailed pattern documentation:
- `resources/creational-patterns.md` - Pattern details
- `resources/structural-patterns.md` - Pattern details
- `resources/behavioral-patterns.md` - Pattern details
- `resources/language-guide.md` - Language-specific implementation
