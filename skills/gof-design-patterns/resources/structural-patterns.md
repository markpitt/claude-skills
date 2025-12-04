# Structural Design Patterns

Structural patterns explain how to assemble objects and classes into larger structures while keeping them flexible and efficient. These patterns help you compose classes and objects into larger structures, and explain how to tie these pieces together to form new functionality.

## 1. Adapter - Make Incompatible Interfaces Work Together

**Intent**: Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise due to incompatible interfaces.

**When to Use**:
- Want to use an existing class but its interface doesn't match what you need
- Want to create a reusable class that cooperates with unrelated classes
- Need to use several existing subclasses but can't adapt each one individually
- Integrating third-party libraries with incompatible interfaces

**When NOT to Use**:
- You can modify the existing class directly
- The interface difference is minimal (wrapper function is simpler)

**Implementation Considerations**:
- **Object Adapter** (composition): wraps adaptee, implements target interface
- **Class Adapter** (inheritance): inherits from adaptee, implements target interface
- Object adapter generally preferred (more flexible, supports inheritance chains)
- Bidirectional adapter (both directions of conversion)

**Example Use Cases**:
- Legacy system integration (adapt old API to new)
- Third-party library integration (adapt to application interface)
- Cross-platform support (adapt platform-specific APIs)
- Device driver adapters
- Data source adapters (database, REST API, file system)

---

## 2. Bridge - Decouple Abstraction from Implementation

**Intent**: Decouple an abstraction from its implementation so the two can vary independently.

**When to Use**:
- Avoid permanent binding between abstraction and implementation
- Both abstractions and implementations should be extensible by subclassing
- Changes in implementation shouldn't affect clients
- Share implementation among multiple objects
- Avoid class explosion from coupled abstraction/implementation hierarchies

**When NOT to Use**:
- Only one implementation exists
- Abstraction and implementation are unlikely to change independently
- Added complexity isn't justified

**Implementation Considerations**:
- Separate class hierarchies: one for abstraction, one for implementation
- Abstraction maintains reference to Implementor (composition)
- RefinedAbstraction extends Abstraction
- ConcreteImplementor provides concrete implementations
- Clients work through Abstraction, not Implementor

**Example Use Cases**:
- UI frameworks (abstraction: Window, implementation: WindowImpl per OS)
- Device drivers (abstraction: Device, implementation: DriverA, DriverB)
- Database drivers (abstraction: Connection, implementation: PostgreSQL, MySQL, Oracle)
- Rendering engines (abstraction: Shape, implementation: OpenGL, DirectX, Canvas)
- Payment systems (abstraction: PaymentProcessor, implementation: Stripe, PayPal)

---

## 3. Composite - Treat Individual Objects and Compositions Uniformly

**Intent**: Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions uniformly.

**When to Use**:
- Represent part-whole hierarchies (tree structures)
- Want clients to ignore difference between individual and composite objects
- Tree structures are natural for your domain

**When NOT to Use**:
- Components are too different for a common interface
- Operations differ significantly between leaves and composites
- Performance of iterating through structures is critical

**Implementation Considerations**:
- Component: interface for objects in composition
- Leaf: represents leaf objects, has no children
- Composite: represents composite objects, has children collection
- Where to define child management (Component vs. Composite level)
- Component caching strategies
- Parent references for traversal
- Child ordering requirements

**Example Use Cases**:
- File systems (files and directories)
- UI components (containers and controls)
- Organizational charts
- Graphic drawing systems
- Menu systems (menus and menu items)
- Expression trees (arithmetic operations)

---

## 4. Decorator - Add Responsibilities Dynamically Without Subclassing

**Intent**: Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

**When to Use**:
- Add responsibilities to individual objects dynamically and transparently
- Responsibilities should be withdrawable
- Extension by subclassing is impractical (many independent extensions possible)
- Avoid class explosion from multiple combinations of extensions

**When NOT to Use**:
- Simple subclassing is sufficient
- Order of decorators matters and becomes confusing
- Identity comparisons are critical (decorators change object identity)

**Implementation Considerations**:
- Component: interface for objects that can have responsibilities added
- Decorator: maintains reference to Component, conforms to Component interface
- ConcreteDecorator: adds specific responsibilities
- Decorators wrapping decorators (composition chain)
- Wrapper vs. wrapper with modifications

**Example Use Cases**:
- I/O streams (BufferedReader wrapping FileReader, GZipInputStream wrapping stream)
- UI component enhancement (scrolling, borders, tooltips, drag-and-drop)
- Middleware/filters (authentication, logging, compression)
- Text formatting (bold, italic, underline combinations)
- Feature flags (progressively decorate functionality)

---

## 5. Facade - Provide Simplified Interface to Complex Subsystem

**Intent**: Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.

**When to Use**:
- Provide simple interface to complex subsystem
- Many dependencies between clients and implementation classes
- Want to layer your subsystem
- Want to reduce coupling between subsystem and clients
- Simplify API for common use cases

**When NOT to Use**:
- The subsystem is already simple
- Clients need fine-grained control
- Facade becomes a monolithic god object

**Implementation Considerations**:
- Facade object provides simple interface
- Subsystem classes remain independent and unchanged
- Facade doesn't prevent direct subsystem access if needed
- Multiple facades for different client needs
- Abstract facade for subsystem independence
- Avoid making facade a monolithic dumping ground

**Example Use Cases**:
- Framework setup (one call initializes multiple subsystems)
- Compiler phases (simplified API to lexer, parser, code generator)
- Home automation (unified interface to lighting, climate, security)
- MVC framework (unified interface to model, view, controller setup)
- Database abstraction (unified interface to connection, query, transaction layers)

---

## 6. Flyweight - Share Fine-Grained Objects Efficiently

**Intent**: Use sharing to support large numbers of fine-grained objects efficiently.

**When to Use**:
- Need large number of objects and cost is prohibitive
- Storage costs are high due to sheer quantity
- Most object state can be made extrinsic (passed in, not stored)
- Many groups of objects can be replaced by relatively few shared objects
- Application doesn't depend on object identity

**When NOT to Use**:
- Few objects exist
- Extrinsic state is expensive to compute or store
- Sharing introduces unacceptable complexity

**Implementation Considerations**:
- **Intrinsic state**: shared, stored in flyweight (immutable)
- **Extrinsic state**: varies, computed or stored by client
- FlyweightFactory creates and manages flyweight objects
- Thread-safe sharing (particularly in concurrent environments)
- Cache/pool of flyweights
- State reset when returning to pool

**Example Use Cases**:
- Text editors (character objects, font metadata shared)
- Game engines (particles, tiles, sprites with shared graphical data)
- UI toolkits (button labels, colors shared across instances)
- Graphics systems (repeated shapes with shared data)
- String interning (strings as flyweights)

---

## 7. Proxy - Control Access to Another Object

**Intent**: Provide a surrogate or placeholder for another object to control access to it.

**When to Use**:
- Lazy initialization (virtual proxy): create expensive objects on demand
- Access control (protection proxy): control access based on permissions
- Reference remote object (remote proxy): represents object in different address space
- Add functionality before/after object access
- Count references or lock access (smart reference)
- Cache results of expensive operations (cache proxy)
- Log requests before forwarding (logging proxy)

**When NOT to Use**:
- Direct access overhead is unacceptable
- Proxy logic becomes as complex as the real object
- Simple delegation is sufficient

**Implementation Considerations**:
- Proxy and RealSubject implement same Subject interface
- Proxy maintains reference to RealSubject (or creates on demand)
- Additional behavior before/after forwarding to RealSubject
- Transparent vs. explicit proxy usage
- Proxy can cache RealSubject reference or recreate as needed

**Proxy Types**:
- **Virtual Proxy**: Creates expensive objects on demand (lazy loading)
- **Remote Proxy**: Represents object in different address space (RPC, REST)
- **Protection Proxy**: Controls access based on permissions
- **Smart Reference**: Performs additional actions (reference counting, locking, loading)
- **Cache Proxy**: Caches expensive operation results
- **Logging Proxy**: Logs method calls and arguments

**Example Use Cases**:
- Lazy-loaded collections (proxies for database query results)
- Remote objects (proxies for network services)
- Permission-controlled objects (proxies for sensitive data)
- Image loading (proxy loads on first access)
- Database query optimization (proxy delays loading until needed)
- Synchronized access to shared resources
- Audit logging (all accesses logged through proxy)

---

## Key Relationships Between Structural Patterns

- **Adapter + Facade**: Adapter adapts single class, Facade simplifies subsystem
- **Bridge + Strategy**: Similar structure, different intent
- **Composite + Iterator**: Use iterator to traverse composite structures
- **Composite + Visitor**: Use visitor to perform operations on composite structures
- **Decorator + Factory**: Factory creates decorated objects
- **Decorator + Strategy**: Decorator changes skin, Strategy changes guts
- **Facade + Singleton**: Facade object is often a singleton
- **Flyweight + Composite**: Leaf nodes in composite can be flyweights
- **Proxy + Decorator**: Similar structure, different intent (proxy controls, decorator adds)

## Implementation Guidelines

### Language-Specific Notes

**Rust**: Use traits for interfaces, trait objects for runtime polymorphism, leverage ownership for smart resource management in Proxy.

**Python**: Use duck typing for Adapter, decorators for Decorator pattern, metaclasses for customization.

**C#**: Use interfaces and abstract classes, properties for lazy initialization, events for observer-like patterns.

**TypeScript**: Use interfaces, discriminated unions, generic constraints for type safety.

**Go**: Use struct embedding for composition, interfaces for polymorphism, function types.

**Dart**: Use mixins for code reuse, factory constructors, extension methods.

### General Principles

1. **Prefer Composition**: Most structural patterns favor composition over inheritance
2. **Maintain Type Safety**: Use language type systems to enforce relationships
3. **Minimize Complexity**: Add structure only when it simplifies the system
4. **Clear Responsibilities**: Each pattern component has a single, clear purpose
5. **Document Relationships**: Explain how pattern components interact

---

See `resources/language-guide.md` for detailed language-specific implementations of these patterns.
