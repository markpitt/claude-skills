# Behavioral Design Patterns

Behavioral patterns are concerned with object collaboration and the delegation of responsibility. They describe not just patterns of objects or classes but the communication patterns between them. These patterns address how to distribute responsibility, structure communication, and manage algorithmic flexibility.

## 1. Chain of Responsibility - Pass Requests Along a Handler Chain

**Intent**: Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along until an object handles it.

**When to Use**:
- More than one object may handle a request, handler isn't known a priori
- Want to issue request to several objects without specifying receiver explicitly
- Set of handlers should be specified dynamically
- Want to avoid tight coupling between sender and receivers

**When NOT to Use**:
- Every request must be handled (no guarantee in chain)
- Chain is too long (performance impact)
- Request handling path should be explicit

**Implementation Considerations**:
- Handler interface: handle request or pass to successor
- ConcreteHandler: handles requests it's responsible for, passes others
- Dynamic chain construction (runtime configuration)
- Pure chain (one handler) vs. collaborative chain (multiple handlers)
- Chain ordering matters for some patterns

**Example Use Cases**:
- Event handling (UI events bubble up the component hierarchy)
- Middleware pipelines (HTTP request processing)
- Logging frameworks (log level filtering chains)
- Exception handling hierarchies
- Approval workflows (request passes through escalation chain)
- Document processing pipelines

---

## 2. Command - Encapsulate Requests as Objects

**Intent**: Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

**When to Use**:
- Parameterize objects with an action to perform
- Specify, queue, and execute requests at different times
- Support undo/redo functionality
- Support logging changes for crash recovery
- Structure system around high-level operations built on primitive operations

**When NOT to Use**:
- Simple callbacks or function pointers suffice
- Command objects become too numerous
- State required for undo is too large

**Implementation Considerations**:
- Command interface: execute() method
- ConcreteCommand: binds Receiver and action
- Receiver: knows how to perform the operation
- Invoker: asks command to carry out request
- Undo support: store previous state or inverse command
- Macro commands (composite of commands)

**Example Use Cases**:
- GUI buttons and menu items
- Transaction systems (database operations as commands)
- Macro recording
- Undo/redo functionality
- Job queues and schedulers
- Remote control systems
- Script/batch processing

---

## 3. Interpreter - Interpret Sentences in a Custom Language

**Intent**: Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.

**When to Use**:
- Need to interpret sentences in a language or notation
- Grammar is simple to moderate complexity
- Efficiency is not critical
- Want to represent grammar rules as classes
- Need custom expression evaluation

**When NOT to Use**:
- Grammar is complex (use parser generators instead)
- Performance is critical
- Language changes frequently

**Implementation Considerations**:
- AbstractExpression: interface for interpret operation
- TerminalExpression: represents terminal symbols
- NonterminalExpression: represents non-terminal symbols
- Context: global information for interpretation
- Abstract Syntax Tree (AST) construction
- Recursive interpretation

**Example Use Cases**:
- Expression evaluators (arithmetic, logical)
- Query languages
- Configuration file parsers
- Simple scripting languages
- SQL query builders
- Regular expression engines
- Business rule engines

---

## 4. Iterator - Access Elements Sequentially Without Exposing Structure

**Intent**: Provide a way to access elements of an aggregate object sequentially without exposing its underlying representation.

**When to Use**:
- Access collection contents without exposing internal structure
- Support multiple traversals of collections simultaneously
- Provide uniform interface for traversing different structures
- Separate collection from traversal logic

**When NOT to Use**:
- Simple array access is sufficient
- Collection is simple and won't change
- Language provides built-in iteration

**Implementation Considerations**:
- Iterator interface: next(), hasNext(), current()
- ConcreteIterator: implements iteration, tracks position
- Aggregate interface: createIterator()
- ConcreteAggregate: returns appropriate iterator
- **Internal iterator**: iterator controls iteration (callbacks)
- **External iterator**: client controls iteration (manual stepping)
- Robust iterator: handles collection modifications during iteration

**Example Use Cases**:
- Collection traversal (lists, sets, maps)
- Tree traversal (pre-order, in-order, post-order)
- Graph traversal (depth-first, breadth-first)
- File system traversal
- Database result set iteration
- Composite structure traversal

**Modern Context**: Most languages provide built-in iterators (Python generators, JavaScript iterators, C# IEnumerable).

---

## 5. Mediator - Centralize Communication Between Objects

**Intent**: Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly.

**When to Use**:
- Set of objects communicate in well-defined but complex ways
- Reusing object is difficult due to dependencies on many others
- Behavior distributed between classes should be customizable without subclassing
- Reduce coupling between components
- Centralize complex interactions

**When NOT to Use**:
- Few objects interact simply
- Mediator becomes too complex (god object antipattern)
- Direct communication is clearer

**Implementation Considerations**:
- Mediator: interface for communicating with colleagues
- ConcreteMediator: implements cooperative behavior, knows colleagues
- Colleague: knows its mediator, communicates through it
- Two-way references (colleague to mediator, mediator to colleagues)
- Avoid mediator becoming monolithic

**Example Use Cases**:
- GUI dialog coordination (controls communicate through dialog)
- Chat rooms (users communicate through room)
- Air traffic control (planes coordinate through tower)
- Event buses and message brokers
- Game AI coordination
- Workflow engines

---

## 6. Memento - Capture and Restore Object State

**Intent**: Without violating encapsulation, capture and externalize an object's internal state so the object can be restored to this state later.

**When to Use**:
- Snapshot of object's state must be saved for later restoration
- Direct interface to obtain state would expose implementation and break encapsulation
- Implement undo/redo
- Checkpointing and rollback
- Save/restore game state

**When NOT to Use**:
- State is large (memory/performance concerns)
- State changes are infrequent
- Encapsulation is not a concern

**Implementation Considerations**:
- Memento: stores internal state of Originator
- Originator: creates memento containing snapshot, restores from memento
- Caretaker: responsible for memento's safekeeping
- **Narrow interface**: caretaker cannot examine memento contents
- **Wide interface**: originator can read/write memento
- Cost of saving state (memory footprint)
- Managing many mementos (history)

**Example Use Cases**:
- Undo/redo functionality
- Transaction rollback
- Game save states
- Editor snapshots
- Transaction logs
- Checkpoint/restore for long-running processes

---

## 7. Observer - Notify Multiple Objects of State Changes

**Intent**: Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

**When to Use**:
- Abstraction has two aspects, one dependent on the other
- Change to one object requires changing others, number unknown
- Object should notify others without assumptions about who they are
- Implement event handling systems
- Data binding systems

**When NOT to Use**:
- Updates are very frequent (performance)
- Update logic is complex
- Observers and subjects create circular dependencies

**Implementation Considerations**:
- Subject: knows observers, provides attach/detach
- Observer: interface for objects to be notified
- ConcreteSubject: stores state, sends notifications
- ConcreteObserver: maintains reference to subject, implements update
- **Push model**: subject sends detailed information
- **Pull model**: subject sends minimal notification, observers pull data
- Event channels (observers subscribe to specific event types)
- Memory leaks (observers not unregistering)

**Example Use Cases**:
- Event handling systems
- Model-View-Controller (MVC)
- Data binding
- Publish-subscribe systems
- Reactive programming
- Real-time dashboards
- Notification systems

**Modern Context**: Reactive programming (RxJS, ReactiveX) is evolution of Observer.

---

## 8. State - Allow Object to Change Behavior with State

**Intent**: Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.

**When to Use**:
- Object behavior depends on state, must change at runtime
- Operations have large conditional statements dependent on state
- State-specific behavior should be independently defined
- State transitions are well-defined

**When NOT to Use**:
- State changes are rare
- Few states exist with simple transitions
- Conditional logic is straightforward

**Implementation Considerations**:
- Context: maintains current state, delegates to state object
- State: interface for encapsulating behavior
- ConcreteState: each implements behavior for particular state
- Context handles state transitions vs. states self-transitioning
- Shared state objects (flyweight) vs. unique instances
- State creation (pre-created vs. on-demand)

**Example Use Cases**:
- TCP connection states (Listen, Established, Closed)
- Order processing (Pending, Confirmed, Shipped, Delivered)
- Document workflows (Draft, Review, Approved, Published)
- Game character states (Idle, Walking, Jumping, Attacking)
- UI component states (Enabled, Disabled, Focused, Pressed)
- Traffic light states (Red, Yellow, Green)

---

## 9. Strategy - Use Interchangeable Algorithms

**Intent**: Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

**When to Use**:
- Many related classes differ only in behavior
- Need different variants of an algorithm
- Algorithm uses data client shouldn't know about
- Class defines many behaviors appearing as conditional statements
- Runtime algorithm selection

**When NOT to Use**:
- Algorithms rarely change
- Clients must understand all strategies to select one
- Simple conditional is clearer

**Implementation Considerations**:
- Strategy: interface common to all algorithms
- ConcreteStrategy: implements specific algorithm
- Context: maintains reference to strategy, uses strategy interface
- Strategy objects often stateless (can be flyweights)
- Client chooses strategy vs. context chooses strategy
- Default strategy if none specified

**Example Use Cases**:
- Sorting algorithms (quicksort, mergesort, heapsort)
- Compression algorithms
- Payment processing (credit card, PayPal, cryptocurrency)
- Validation rules
- Route finding algorithms
- Caching strategies
- Sorting/filtering strategies in UI

**Strategy vs. State**: Strategy client chooses algorithm (independent). State transitions automatically (may reference each other).

---

## 10. Template Method - Vary Algorithm Steps Through Subclassing

**Intent**: Define the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps without changing the algorithm's structure.

**When to Use**:
- Implement invariant parts of algorithm once
- Let subclasses customize variable parts
- Common behavior among subclasses should be factored and centralized
- Control which operations subclasses can extend
- Avoid code duplication

**When NOT to Use**:
- Algorithm doesn't have invariant structure
- Inheritance is not appropriate
- Composition would be clearer (Strategy pattern)

**Implementation Considerations**:
- AbstractClass: defines template method and primitive operations
- ConcreteClass: implements primitive operations
- **Abstract operations**: must be implemented by subclasses
- **Concrete operations**: default behavior, may be overridden
- **Hook operations**: empty default, may be overridden
- Hollywood Principle: "Don't call us, we'll call you"

**Example Use Cases**:
- Framework classes (extend to customize)
- Test frameworks (setUp, tearDown hooks)
- Data processing pipelines (read, process, write)
- Lifecycle methods (initialization, execution, cleanup)
- Report generation
- Document processing
- Game loops

---

## 11. Visitor - Add Operations Without Changing Element Classes

**Intent**: Represent an operation to be performed on elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

**When to Use**:
- Object structure contains many classes with differing interfaces
- Many distinct and unrelated operations need to be performed
- Classes defining object structure rarely change, you add operations often
- Algorithm should work across several classes
- Need to perform complex operations on object structure

**When NOT to Use**:
- Object structure classes change frequently (visitor interface must change)
- Elements are simple and uniform
- Operations are closely tied to element classes

**Implementation Considerations**:
- Visitor: interface declaring visit operation for each ConcreteElement
- ConcreteVisitor: implements operations for each ConcreteElement
- Element: interface defining accept operation
- ConcreteElement: implements accept to call appropriate visitor method
- ObjectStructure: can enumerate elements
- Double dispatch (element type and visitor type determine operation)
- Breaking encapsulation (visitor may need access to element internals)

**Example Use Cases**:
- Compilers (AST traversal for optimization, code generation, type checking)
- File system operations (calculate size, search, backup)
- Export to different formats (XML, JSON, PDF)
- Reporting and analytics
- Object validation
- Pretty-printing
- Transformation operations

**Visitor vs. Iterator**: Visitor performs operation on each element. Iterator provides access to elements.

---

## Key Relationships Between Behavioral Patterns

- **Chain of Responsibility + Mediator**: Mediator can route through chain
- **Chain of Responsibility + Command**: Commands passed through chain
- **Command + Memento**: Commands use mementos for undo
- **Command + Prototype**: Clone commands for undo/redo
- **Mediator + Observer**: Mediator can implement as observer pattern
- **Memento + Iterator**: Iterator can capture iteration state in memento
- **Observer + Mediator**: Mediator can use observer to notify colleagues
- **State + Strategy**: Similar structure, different intent
- **Template Method + Strategy**: Template Method uses inheritance, Strategy uses composition
- **Visitor + Composite**: Traverse composite structures performing operations

## Implementation Guidelines

### Language-Specific Notes

**Rust**: Use traits for interfaces, pattern matching for state transitions, closures for strategies and commands.

**Python**: Use ABC for interfaces, decorators for commands, classes for state objects, leverage duck typing.

**C#**: Use interfaces and delegates/events, async/await for asynchronous commands, properties for state.

**TypeScript**: Use interfaces, discriminated unions for state, function types for strategies.

**Go**: Use interfaces, function types for strategies, channels for observer patterns.

**Dart**: Use abstract classes, sealed classes for exhaustive state matching, streams for observer patterns.

### General Principles

1. **Single Responsibility**: Each pattern component has one reason to change
2. **Loose Coupling**: Patterns reduce coupling through delegation and indirection
3. **Open/Closed**: Open for extension, closed for modification
4. **Dependency Injection**: Inject dependencies to enable pattern flexibility
5. **Clear Contracts**: Define interfaces clearly for pattern participants

---

See `resources/language-guide.md` for detailed language-specific implementations of these patterns.
