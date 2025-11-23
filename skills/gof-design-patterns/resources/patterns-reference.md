# Gang of Four Design Patterns Reference

This document provides detailed descriptions of all 23 Gang of Four design patterns.

## Creational Patterns

Creational patterns abstract the instantiation process, making systems independent of how objects are created, composed, and represented.

### 1. Singleton

**Intent**: Ensure a class has only one instance and provide a global point of access to it.

**Problem**: You need exactly one instance of a class, and it must be accessible from a well-known access point.

**Solution**: Make the class responsible for keeping track of its sole instance. Intercept requests to create new instances and return the existing one.

**Structure**:
- Private constructor prevents direct instantiation
- Static method returns the singleton instance
- Static variable holds the single instance

**Use When**:
- There must be exactly one instance of a class
- The instance must be accessible from multiple points
- The sole instance should be extensible by subclassing

**Avoid When**:
- You need multiple instances with different configurations
- Global state creates tight coupling (consider dependency injection instead)
- Testing requires multiple instances or mocking

**Common Implementations**:
- Lazy initialization (create on first access)
- Eager initialization (create at program start)
- Thread-safe variants (double-checked locking, locks)
- Registry-based (multiple named instances)

---

### 2. Factory Method

**Intent**: Define an interface for creating an object, but let subclasses decide which class to instantiate.

**Problem**: A class can't anticipate the type of objects it needs to create.

**Solution**: Define an interface for creating objects, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.

**Structure**:
- Creator (abstract class with factory method)
- ConcreteCreator (implements factory method)
- Product (interface for objects)
- ConcreteProduct (implements product interface)

**Use When**:
- A class can't anticipate the class of objects to create
- A class wants subclasses to specify objects to create
- Classes delegate responsibility to helper subclasses
- You want to localize knowledge of which class gets created

**Avoid When**:
- Product types don't share a common interface
- Simple object creation suffices
- You need families of related products (use Abstract Factory)

---

### 3. Abstract Factory

**Intent**: Provide an interface for creating families of related or dependent objects without specifying their concrete classes.

**Problem**: You need to create families of related objects that must be used together.

**Solution**: Declare interfaces for creating each product. Concrete factories implement these interfaces to create product families.

**Structure**:
- AbstractFactory (interface for creating products)
- ConcreteFactory (creates specific product families)
- AbstractProduct (interface for product types)
- ConcreteProduct (specific product implementations)
- Client (uses only abstract interfaces)

**Use When**:
- System should be independent of how products are created
- System should work with multiple families of products
- Family of related products must be used together
- You want to provide a library of products and reveal interfaces only

**Avoid When**:
- Product families don't vary
- Adding new product types is more common than adding families (difficult to extend)
- Simple factory or factory method is sufficient

---

### 4. Builder

**Intent**: Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.

**Problem**: Creating a complex object with many optional parts or configuration steps.

**Solution**: Extract object construction code into separate builder objects. Direct the construction using a director class.

**Structure**:
- Builder (interface for creating product parts)
- ConcreteBuilder (implements builder interface, tracks representation)
- Director (constructs object using builder interface)
- Product (complex object being built)

**Use When**:
- Algorithm for creating complex objects should be independent of parts and assembly
- Construction process must allow different representations
- Object construction requires many steps or parameters
- You want to improve readability of complex construction code

**Avoid When**:
- Object construction is simple
- Product doesn't have a complex construction process
- Immutability with many parameters can be handled by factory methods

**Modern Variations**:
- Fluent Builder (method chaining with return this)
- Step Builder (enforces construction order)
- Builders without Director (client controls construction)

---

### 5. Prototype

**Intent**: Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.

**Problem**: Avoid the cost of creating objects in the standard way when it's expensive.

**Solution**: Implement a clone method that creates a copy of the current object.

**Structure**:
- Prototype (interface with clone method)
- ConcretePrototype (implements cloning)
- Client (creates new objects by cloning prototypes)

**Use When**:
- Classes to instantiate are specified at runtime
- Avoiding building a class hierarchy of factories parallel to product hierarchy
- Instances of a class can have only a few different state combinations
- Object creation is expensive (database, network, computation)

**Avoid When**:
- Simple object creation is sufficient
- Deep copying is complex (circular references, resources)
- Languages provide built-in cloning mechanisms

**Considerations**:
- Shallow vs. deep copy
- Cloning objects with circular references
- Handling resources (file handles, connections)

---

## Structural Patterns

Structural patterns explain how to assemble objects and classes into larger structures while keeping them flexible and efficient.

### 6. Adapter

**Intent**: Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise due to incompatible interfaces.

**Problem**: You want to use an existing class but its interface doesn't match what you need.

**Solution**: Create an adapter class that wraps the incompatible class and translates requests.

**Structure**:
- Target (interface clients use)
- Adapter (adapts Adaptee to Target)
- Adaptee (existing incompatible interface)
- Client (works with Target interface)

**Variants**:
- Object Adapter (uses composition)
- Class Adapter (uses inheritance, multiple inheritance required)

**Use When**:
- You want to use an existing class with an incompatible interface
- You want to create a reusable class that cooperates with unrelated classes
- You need to use several existing subclasses but can't adapt each one (object adapter)
- Integrating third-party libraries

**Avoid When**:
- You can modify the existing class directly
- The interface difference is minimal (consider wrapper functions)

---

### 7. Bridge

**Intent**: Decouple an abstraction from its implementation so the two can vary independently.

**Problem**: You want to avoid a permanent binding between an abstraction and its implementation, especially when both should be extensible by subclassing.

**Solution**: Put the abstraction and implementation in separate class hierarchies connected by composition.

**Structure**:
- Abstraction (defines interface, maintains reference to Implementor)
- RefinedAbstraction (extends Abstraction)
- Implementor (interface for implementation classes)
- ConcreteImplementor (concrete implementation)

**Use When**:
- You want to avoid permanent binding between abstraction and implementation
- Both abstractions and implementations should be extensible by subclassing
- Changes in implementation shouldn't affect clients
- You want to share implementation among multiple objects (reference counting)
- You have a proliferation of classes from a coupled interface and implementation

**Avoid When**:
- Only one implementation exists
- Abstraction and implementation are unlikely to change independently
- The added complexity isn't justified

**Common Applications**:
- GUI frameworks (abstraction: Window, implementation: WindowImpl for each OS)
- Device drivers
- Database drivers

---

### 8. Composite

**Intent**: Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions uniformly.

**Problem**: You want to represent part-whole hierarchies and allow clients to treat objects and compositions uniformly.

**Solution**: Define classes for individual objects and compositions. Both implement the same interface.

**Structure**:
- Component (interface for objects in composition)
- Leaf (represents leaf objects, no children)
- Composite (represents composite objects, has children)
- Client (manipulates objects through Component interface)

**Use When**:
- You want to represent part-whole hierarchies
- You want clients to ignore the difference between individual and composite objects
- Tree structures are natural for your domain (file systems, UI components, organizational charts)

**Avoid When**:
- Components are too different for a common interface
- Operations differ significantly between leaves and composites
- Performance of iterating through structures is critical

**Considerations**:
- Where to define child management operations (Component vs. Composite)
- Component caching
- Parent references for traversal
- Ordering of children

---

### 9. Decorator

**Intent**: Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

**Problem**: You want to add responsibilities to individual objects, not entire classes, and you want to be able to add/remove responsibilities dynamically.

**Solution**: Wrap the object with decorator objects that add new behaviors. Decorators implement the same interface as the wrapped object.

**Structure**:
- Component (interface for objects that can have responsibilities added)
- ConcreteComponent (object to which responsibilities can be attached)
- Decorator (maintains reference to Component, conforms to Component interface)
- ConcreteDecorator (adds responsibilities)

**Use When**:
- You want to add responsibilities to individual objects dynamically and transparently
- You want responsibilities to be withdrawable
- Extension by subclassing is impractical (many independent extensions possible)
- You want to avoid class explosion from multiple combinations

**Avoid When**:
- Simple subclassing is sufficient
- Order of decorators matters and becomes confusing
- Identity comparisons are critical (decorators change object identity)

**Common Applications**:
- I/O streams (BufferedReader, GZipInputStream)
- UI component enhancement (scrolling, borders)
- Middleware/filters

---

### 10. Facade

**Intent**: Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.

**Problem**: A subsystem has many interdependent classes with complex interfaces, making it hard to use.

**Solution**: Create a facade class that provides a simple interface to the complex subsystem.

**Structure**:
- Facade (simple interface to subsystem)
- Subsystem classes (implement functionality, handle work assigned by Facade)
- Clients (use Facade instead of subsystem directly)

**Use When**:
- You want to provide a simple interface to a complex subsystem
- There are many dependencies between clients and implementation classes
- You want to layer your subsystem
- You want to reduce coupling between subsystem and clients

**Avoid When**:
- The subsystem is already simple
- Clients need fine-grained control
- The facade becomes a monolithic god object

**Considerations**:
- Facade doesn't prevent access to subsystem if needed
- Multiple facades for different client needs
- Abstract facade for subsystem independence

---

### 11. Flyweight

**Intent**: Use sharing to support large numbers of fine-grained objects efficiently.

**Problem**: You need a large number of objects, and the cost of creating and storing them is prohibitive.

**Solution**: Share common parts of object state between multiple objects instead of storing all state in each object.

**Structure**:
- Flyweight (interface for flyweights to receive and act on extrinsic state)
- ConcreteFlyweight (implements Flyweight, stores intrinsic state)
- FlyweightFactory (creates and manages flyweight objects)
- Client (maintains references to flyweights, computes/stores extrinsic state)

**Key Concepts**:
- Intrinsic state: shared, stored in flyweight
- Extrinsic state: varies, computed or stored by client

**Use When**:
- Application uses large numbers of objects
- Storage costs are high due to sheer quantity
- Most object state can be made extrinsic
- Many groups of objects can be replaced by relatively few shared objects
- Application doesn't depend on object identity

**Avoid When**:
- Few objects exist
- Extrinsic state is expensive to compute/store
- Sharing introduces unacceptable complexity

**Common Applications**:
- Text editors (character objects)
- Game engines (particles, tiles)
- UI toolkits (widgets)

---

### 12. Proxy

**Intent**: Provide a surrogate or placeholder for another object to control access to it.

**Problem**: You need to add functionality when accessing an object (lazy loading, access control, caching, etc.).

**Solution**: Create a proxy class with the same interface as the real object. The proxy controls access and may add additional behavior.

**Structure**:
- Subject (interface for RealSubject and Proxy)
- RealSubject (real object that proxy represents)
- Proxy (maintains reference to RealSubject, controls access)

**Types**:
- **Remote Proxy**: represents object in different address space
- **Virtual Proxy**: creates expensive objects on demand (lazy initialization)
- **Protection Proxy**: controls access based on permissions
- **Smart Reference**: performs additional actions when object is accessed (reference counting, locking, loading on first access)
- **Cache Proxy**: caches results of expensive operations
- **Logging Proxy**: logs requests before forwarding

**Use When**:
- You need lazy initialization (virtual proxy)
- You need access control (protection proxy)
- You need to reference remote object locally (remote proxy)
- You need to add functionality before/after object access
- You want to count references or lock access (smart reference)

**Avoid When**:
- Direct access overhead is unacceptable
- Proxy logic becomes as complex as the real object
- Simple delegation is sufficient

**Considerations**:
- Proxy and RealSubject should implement same interface
- Proxy may cache RealSubject reference
- Transparent vs. explicit proxy usage

---

## Behavioral Patterns

Behavioral patterns are concerned with algorithms and the assignment of responsibilities between objects.

### 13. Chain of Responsibility

**Intent**: Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along until an object handles it.

**Problem**: You want to send a request to one of several objects without specifying the receiver explicitly.

**Solution**: Create a chain of handler objects. Each handler decides whether to process the request or pass it to the next handler.

**Structure**:
- Handler (interface for handling requests, optional successor link)
- ConcreteHandler (handles requests it's responsible for, passes others)
- Client (initiates request to a ConcreteHandler in the chain)

**Use When**:
- More than one object may handle a request, handler isn't known a priori
- You want to issue request to several objects without specifying receiver explicitly
- Set of handlers should be specified dynamically
- You want to avoid tight coupling between sender and receivers

**Avoid When**:
- Every request must be handled (no guarantee in chain)
- Chain is too long (performance)
- Request handling path should be explicit

**Common Applications**:
- Event handling (UI events bubble up)
- Middleware pipelines (HTTP request processing)
- Logging frameworks (log level filtering)
- Exception handling

**Variations**:
- Pure chain (one handler processes request)
- Collaborative chain (multiple handlers process parts)

---

### 14. Command

**Intent**: Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

**Problem**: You want to parameterize objects with operations, queue operations, log operations, or support undo.

**Solution**: Encapsulate requests as objects. A command object contains all information needed to perform an action or trigger an event.

**Structure**:
- Command (interface for executing operations)
- ConcreteCommand (implements Command, defines binding between Receiver and action)
- Receiver (knows how to perform the operation)
- Invoker (asks command to carry out request)
- Client (creates ConcreteCommand and sets Receiver)

**Use When**:
- You want to parameterize objects with an action to perform
- You want to specify, queue, and execute requests at different times
- You want to support undo/redo
- You want to support logging changes for crash recovery
- You want to structure system around high-level operations built on primitive operations (transactions)

**Avoid When**:
- Simple callbacks or function pointers suffice
- Command objects become too numerous
- State required for undo is too large

**Common Applications**:
- GUI buttons and menu items
- Transaction systems
- Macro recording
- Undo/redo functionality
- Job queues and schedulers

---

### 15. Interpreter

**Intent**: Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.

**Problem**: You need to interpret sentences in a language or notation.

**Solution**: Represent each grammar rule as a class. Build an abstract syntax tree of the sentence and interpret it.

**Structure**:
- AbstractExpression (interface for interpret operation)
- TerminalExpression (implements interpret for terminal symbols)
- NonterminalExpression (implements interpret for non-terminal symbols)
- Context (contains global information for interpreter)
- Client (builds abstract syntax tree, invokes interpret)

**Use When**:
- Grammar is simple (complex grammars are hard to maintain)
- Efficiency is not critical
- You want to represent grammar rules as classes
- You need to interpret custom languages or expressions

**Avoid When**:
- Grammar is complex (use parser generators)
- Performance is critical
- Language changes frequently

**Common Applications**:
- Expression evaluators
- Query languages
- Configuration file parsers
- Simple scripting languages
- Regular expression engines

---

### 16. Iterator

**Intent**: Provide a way to access elements of an aggregate object sequentially without exposing its underlying representation.

**Problem**: You need to traverse a collection without exposing its internal structure.

**Solution**: Define an iterator object that encapsulates iteration logic. The iterator knows how to traverse the collection.

**Structure**:
- Iterator (interface for accessing and traversing elements)
- ConcreteIterator (implements Iterator, tracks current position)
- Aggregate (interface for creating Iterator)
- ConcreteAggregate (implements Iterator creation, returns ConcreteIterator)

**Use When**:
- You want to access collection contents without exposing internal structure
- You want to support multiple traversals of collections
- You want to provide uniform interface for traversing different structures
- You want to separate collection from traversal logic

**Avoid When**:
- Simple array access is sufficient
- Collection is simple and won't change
- Language provides built-in iteration (for-each loops)

**Variations**:
- Internal iterator (iterator controls iteration)
- External iterator (client controls iteration)
- Robust iterator (handles collection modifications during iteration)

**Modern Context**:
Most modern languages provide built-in iterator support (Python generators, JavaScript iterators, C# IEnumerable, Java Iterable).

---

### 17. Mediator

**Intent**: Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly.

**Problem**: Objects need to communicate but direct connections create tight coupling and complexity.

**Solution**: Centralize complex communications and control between related objects in a mediator object.

**Structure**:
- Mediator (interface for communicating with Colleague objects)
- ConcreteMediator (implements cooperative behavior, knows and maintains colleagues)
- Colleague (each Colleague knows its Mediator, communicates via it)

**Use When**:
- Set of objects communicate in well-defined but complex ways
- Reusing object is difficult due to dependencies on many others
- Behavior distributed between classes should be customizable without subclassing
- You want to reduce coupling between components

**Avoid When**:
- Few objects interact simply
- Mediator becomes too complex (god object)
- Direct communication is clearer

**Common Applications**:
- GUI dialog coordination
- Chat rooms (users communicate through room)
- Air traffic control
- Event buses and message brokers

**Considerations**:
- Mediator can become complex
- Can reduce subclassing of colleagues
- May create single point of failure

---

### 18. Memento

**Intent**: Without violating encapsulation, capture and externalize an object's internal state so the object can be restored to this state later.

**Problem**: You need to save and restore object state while maintaining encapsulation.

**Solution**: Use a memento object to store snapshots of another object's state. Only the originating object can read/write the memento's state.

**Structure**:
- Memento (stores internal state of Originator, protects against access by others)
- Originator (creates memento containing snapshot, uses memento to restore state)
- Caretaker (responsible for memento's safekeeping, never examines or operates on contents)

**Use When**:
- A snapshot of object's state must be saved for later restoration
- Direct interface to obtain state would expose implementation and break encapsulation
- You want to implement undo/redo
- You need checkpointing and rollback

**Avoid When**:
- State is large (memory/performance concerns)
- State changes are infrequent
- Encapsulation is not a concern

**Considerations**:
- Narrow vs. wide interface (originator has wide access, others narrow)
- Cost of saving state
- Managing mementos (caretaker responsibility)

**Common Applications**:
- Undo/redo functionality
- Transaction rollback
- Game save states
- Editor snapshots

---

### 19. Observer

**Intent**: Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

**Problem**: You need to maintain consistency between related objects without tight coupling.

**Solution**: Define a subscription mechanism where subjects notify observers of changes.

**Structure**:
- Subject (knows its observers, provides interface for attaching/detaching)
- Observer (interface for objects that should be notified)
- ConcreteSubject (stores state, sends notifications)
- ConcreteObserver (maintains reference to ConcreteSubject, implements update)

**Use When**:
- Abstraction has two aspects, one dependent on the other
- Change to one object requires changing others, number of objects unknown
- Object should notify others without assumptions about who they are
- You want to implement event handling systems

**Avoid When**:
- Updates are very frequent (performance)
- Update logic is complex
- Observers and subjects create circular dependencies

**Common Applications**:
- Event handling systems
- Model-View-Controller (MVC)
- Data binding
- Publish-subscribe systems
- Reactive programming

**Variations**:
- Push model (subject sends detailed information)
- Pull model (subject sends minimal notification, observers pull data)
- Event channels (observers subscribe to specific event types)

**Considerations**:
- Who triggers update (explicit vs. implicit)
- Update propagation cycles
- Memory leaks (observers not unregistering)

---

### 20. State

**Intent**: Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.

**Problem**: An object's behavior depends on its state, and it must change behavior at runtime depending on state.

**Solution**: Create state objects for each possible state. Delegate state-specific behavior to the current state object.

**Structure**:
- Context (maintains current state, delegates requests to state object)
- State (interface for encapsulating behavior associated with state)
- ConcreteState (each implements behavior for a particular state)

**Use When**:
- Object behavior depends on state and must change at runtime
- Operations have large conditional statements dependent on state
- State-specific behavior should be independently defined
- State transitions are well-defined

**Avoid When**:
- State changes are rare
- Few states exist with simple transitions
- Conditional logic is straightforward

**Common Applications**:
- TCP connection states
- Order processing (pending, confirmed, shipped, delivered)
- Document workflows (draft, review, approved, published)
- Game character states (idle, walking, jumping, attacking)
- UI component states (enabled, disabled, focused)

**Variations**:
- Context maintains current state vs. states handle transitions
- Shared state objects (flyweight) vs. unique instances
- State creation (pre-created vs. on-demand)

**State vs. Strategy**:
- State: behavior varies with object's state, state objects may know about each other
- Strategy: client chooses strategy, strategies are independent

---

### 21. Strategy

**Intent**: Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

**Problem**: You want to use different variants of an algorithm, or you want to switch algorithms at runtime.

**Solution**: Define a family of algorithms as separate classes implementing a common interface. Client can choose which algorithm to use.

**Structure**:
- Strategy (interface common to all algorithms)
- ConcreteStrategy (implements specific algorithm)
- Context (maintains reference to Strategy, uses Strategy interface)

**Use When**:
- Many related classes differ only in behavior
- You need different variants of an algorithm
- Algorithm uses data client shouldn't know about
- Class defines many behaviors appearing as conditional statements

**Avoid When**:
- Algorithms rarely change
- Clients must understand all strategies to select one
- Simple conditional is clearer

**Common Applications**:
- Sorting algorithms (quicksort, mergesort, heapsort)
- Compression algorithms
- Payment processing (credit card, PayPal, cryptocurrency)
- Validation rules
- Route finding algorithms

**Considerations**:
- Strategy and Context communicate (context passes data or passes itself)
- Strategy objects as flyweights (if stateless)
- Optional strategy (default behavior if no strategy set)

**Strategy vs. State**:
- Strategy: client chooses algorithm, algorithms are independent
- State: state transitions happen automatically, states may reference each other

---

### 22. Template Method

**Intent**: Define the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps without changing the algorithm's structure.

**Problem**: You want to implement the invariant parts of an algorithm once and let subclasses customize variable parts.

**Solution**: Define an abstract class with a template method that calls abstract/hook methods. Subclasses override these methods.

**Structure**:
- AbstractClass (defines template method and primitive operations)
- ConcreteClass (implements primitive operations)

**Template Method**: Defines algorithm skeleton, calls primitive operations.

**Primitive Operations**:
- Abstract operations (must be implemented by subclasses)
- Concrete operations (default behavior, may be overridden)
- Hook operations (empty default, may be overridden)

**Use When**:
- You want to implement invariant parts of algorithm once
- Common behavior among subclasses should be factored and centralized
- You want to control which operations subclasses can extend
- You want to avoid code duplication

**Avoid When**:
- Algorithm doesn't have invariant structure
- Inheritance is not appropriate
- Composition would be clearer (Strategy pattern)

**Common Applications**:
- Framework classes (extend to customize)
- Test frameworks (setUp, tearDown hooks)
- Data processing pipelines (read, process, write)
- Lifecycle methods (initialization, execution, cleanup)

**Considerations**:
- Minimize primitive operations
- Naming convention for hooks (doBeforeX, afterY)
- Hollywood Principle: "Don't call us, we'll call you"

---

### 23. Visitor

**Intent**: Represent an operation to be performed on elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

**Problem**: You need to perform operations on elements of a complex object structure, and you want to avoid polluting element classes with these operations.

**Solution**: Create a visitor class hierarchy for operations. Elements accept visitors and call the appropriate visitor method.

**Structure**:
- Visitor (interface declaring visit operation for each ConcreteElement)
- ConcreteVisitor (implements operations for each ConcreteElement)
- Element (interface defining accept operation)
- ConcreteElement (implements accept to call visitor)
- ObjectStructure (can enumerate elements, may provide high-level interface)

**Use When**:
- Object structure contains many classes with differing interfaces
- Many distinct and unrelated operations need to be performed on objects
- Classes defining object structure rarely change, but you add operations often
- Algorithm should work across several classes

**Avoid When**:
- Object structure classes change frequently (visitor interface must change)
- Elements are simple and uniform
- Operations are closely tied to element classes

**Common Applications**:
- Compilers (AST traversal for optimization, code generation, type checking)
- File system operations (calculate size, search, backup)
- Export to different formats (XML, JSON, PDF)
- Reporting and analytics

**Considerations**:
- Breaking encapsulation (visitor may need access to element internals)
- Adding new ConcreteElement classes is hard (all visitors must change)
- Adding new operations is easy (just add new visitor)
- Accumulating state (where to store results)
- Double dispatch (element type and visitor type determine operation)

**Visitor vs. Iterator**:
- Visitor: performs operation on each element
- Iterator: provides access to elements

---

## Pattern Relationships

### Patterns That Work Together

- **Abstract Factory + Singleton**: Factory instances are often singletons
- **Abstract Factory + Bridge**: Abstract factory can create and configure a particular bridge
- **Abstract Factory + Prototype**: Implement using prototype (clone prototypes rather than subclass)
- **Builder + Composite**: Builder can build composite structures
- **Composite + Iterator**: Use to iterate over composite structures
- **Composite + Visitor**: Visitor to perform operations on composite structures
- **Decorator + Strategy**: Decorator lets you change skin, Strategy lets you change guts
- **Facade + Singleton**: Facade object is often a singleton
- **Flyweight + Composite**: Shared leaf nodes in composite
- **Flyweight + State/Strategy**: State and strategy objects are often flyweights
- **Iterator + Composite**: Traverse composite structures
- **Mediator + Observer**: Mediator uses observer to notify colleagues
- **Memento + Command**: Commands use mementos for undo
- **Memento + Iterator**: Iterator can use memento to capture iteration state
- **Observer + Mediator**: Mediator can implement as observer pattern
- **Prototype + Composite**: Clone complex composite structures
- **Proxy + Decorator**: Similar structure, different intent

### Pattern Alternatives

- **Factory Method vs. Abstract Factory**: Factory Method is simpler, Abstract Factory for families
- **Decorator vs. Proxy**: Decorator adds responsibilities, Proxy controls access
- **Strategy vs. State**: Strategy chooses algorithm, State changes behavior with state
- **Template Method vs. Strategy**: Template Method uses inheritance, Strategy uses composition
- **Visitor vs. Iterator**: Visitor performs operations, Iterator provides access

---

## Anti-Patterns and Pitfalls

### Singleton Abuse
- Overuse creates global state
- Makes testing difficult
- Hides dependencies
- **Better**: Use dependency injection

### Deep Inheritance Hierarchies
- Factory Method, Template Method can lead to many subclasses
- **Better**: Prefer composition, use Strategy instead of Template Method

### God Objects
- Mediator, Facade can become too complex
- **Better**: Split into smaller mediators/facades, use multiple patterns

### Premature Abstraction
- Applying patterns before they're needed
- **Better**: Refactor toward patterns when need arises (YAGNI principle)

### Over-Engineering
- Using complex patterns for simple problems
- **Better**: Start simple, add patterns as complexity demands

### Breaking Encapsulation
- Visitor may require exposing internals
- **Better**: Carefully design element interfaces

---

## Modern Adaptations

### Dependency Injection
- Evolution of Factory patterns
- Frameworks handle object creation and wiring

### Reactive Programming
- Evolution of Observer pattern
- Streams, observables, reactive extensions

### Functional Programming
- Strategy → Higher-order functions
- Command → Function objects/closures
- Chain of Responsibility → Function composition
- Template Method → Higher-order functions with callbacks

### Middleware/Pipeline
- Evolution of Chain of Responsibility
- HTTP middleware, message processing pipelines

### Event Sourcing
- Evolution of Memento + Command
- Store all changes as events

### CQRS (Command Query Responsibility Segregation)
- Uses Command pattern
- Separates read and write models

---

## Selecting the Right Pattern

### Ask These Questions

**What problem am I solving?**
- Object creation → Creational patterns
- Object composition → Structural patterns
- Object interaction → Behavioral patterns

**Do I need flexibility in object creation?**
- Runtime type selection → Factory Method, Abstract Factory
- Complex construction → Builder
- Cloning expensive objects → Prototype
- Single instance → Singleton

**Do I need flexibility in object structure?**
- Interface adaptation → Adapter
- Decouple abstraction from implementation → Bridge
- Part-whole hierarchies → Composite
- Add responsibilities dynamically → Decorator
- Simplify complex interface → Facade
- Share to reduce memory → Flyweight
- Control access → Proxy

**Do I need flexibility in object behavior?**
- Pass request through chain → Chain of Responsibility
- Encapsulate requests → Command
- Language/grammar interpretation → Interpreter
- Access elements sequentially → Iterator
- Centralize communication → Mediator
- Save/restore state → Memento
- Notify dependents of changes → Observer
- Vary behavior by state → State
- Interchangeable algorithms → Strategy
- Vary algorithm steps → Template Method
- Operations on object structure → Visitor

**What's my priority?**
- Loose coupling → Mediator, Observer, Chain of Responsibility
- Encapsulation → Memento, Iterator
- Flexibility → Strategy, State, Builder
- Simplicity → Facade, Adapter
- Performance → Flyweight, Proxy (caching)
- Extensibility → Visitor, Decorator, Chain of Responsibility

---

This reference provides a foundation for implementing any GoF pattern. Consult this when you need detailed information about pattern intent, structure, or usage guidelines.
