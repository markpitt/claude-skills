# Creational Design Patterns

Creational patterns abstract the instantiation process, making systems independent of how objects are created, composed, and represented. These patterns give you flexibility in **what** gets created, **who** creates it, **how** it gets created, and **when**.

## 1. Singleton - Ensure Single Instance with Global Access

**Intent**: Ensure a class has only one instance and provide a global point of access to it.

**When to Use**:
- Need exactly one instance of a class across the entire application
- Instance must be accessible from multiple points without passing references
- Instance is expensive to create (database connections, thread pools)
- Lazy initialization is beneficial (create only when first needed)

**When NOT to Use**:
- Need multiple instances with different configurations
- Global state creates tight coupling (consider dependency injection)
- Testing requires multiple instances or easy mocking

**Implementation Considerations**:
- Lazy initialization vs. eager (thread-safe variants)
- Thread-safe access (double-checked locking, locks, atomic operations)
- Language-specific: lazy_static in Rust, metaclass in Python, Lazy<T> in C#
- Registry-based singleton (multiple named instances)

**Example Use Cases**:
- Application configuration object
- Logger instances
- Database connection pools
- Thread pools
- Session managers

---

## 2. Factory Method - Defer Object Creation to Subclasses

**Intent**: Define an interface for creating an object, but let subclasses decide which class to instantiate.

**When to Use**:
- Class can't anticipate the type of objects it needs to create
- Class wants subclasses to specify objects to create
- Classes delegate responsibility to helper subclasses
- Want to localize knowledge of which concrete classes are used

**When NOT to Use**:
- Product types don't share a common interface
- Simple object creation suffices (direct instantiation is clearer)
- Need families of related products (use Abstract Factory instead)

**Implementation Considerations**:
- Abstract Creator class with abstract factory method
- ConcreteCreator subclasses implement factory method
- Clients work with abstract Product interface
- Can use parameterized factory methods (string or enum selects type)

**Example Use Cases**:
- Document editors (File > New creates specific document type)
- Framework classes (create appropriate logger for environment)
- Connection factories (create database-specific connections)
- Transport layers (HTTP, WebSocket, gRPC)

---

## 3. Abstract Factory - Create Families of Related Objects

**Intent**: Provide an interface for creating families of related or dependent objects without specifying their concrete classes.

**When to Use**:
- System needs to work with multiple families of related products
- Product families must be used together consistently
- Want to provide a library of products and reveal interfaces only
- System should be independent of how products are created

**When NOT to Use**:
- Product families don't vary (single implementation)
- Adding new product types is more common than adding families (difficult to extend)
- Simple factory or factory method is sufficient

**Implementation Considerations**:
- AbstractFactory interface for creating each product family
- ConcreteFactory implements interface for specific family
- AbstractProduct interfaces for each product type
- Client works entirely with abstract interfaces
- Pairs well with Singleton (factory instances are often singletons)

**Example Use Cases**:
- UI framework (create family of Windows/Mac/Linux controls)
- Database support (create SQL Server/PostgreSQL/Oracle adapters)
- Theme engines (create coordinated colors, fonts, icons for theme)
- Device drivers (different implementations for Windows/Mac/Linux)

---

## 4. Builder - Separate Construction from Representation

**Intent**: Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.

**When to Use**:
- Algorithm for creating complex objects should be independent of parts
- Construction process must allow different representations
- Object construction requires many steps or optional parameters
- Improve readability of complex constructor code (vs. many parameters)

**When NOT to Use**:
- Object construction is simple (use constructor directly)
- Product doesn't have complex construction process
- Object immutability with many parameters can be handled by factory methods

**Implementation Considerations**:
- Builder interface defines construction steps
- ConcreteBuilder implements steps, tracks representation
- Director controls construction sequence (optional, client can direct)
- Fluent Builder pattern: method chaining with return this
- Step Builder: enforces construction order at compile-time
- Can build without Director (client controls order)

**Example Use Cases**:
- Configuration objects (build with optional settings)
- Complex UI components (progressive construction)
- HTML/XML document construction
- Query builders (SQL, API requests)
- Immutable objects with many optional fields

---

## 5. Prototype - Clone Existing Objects Instead of Creating New

**Intent**: Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.

**When to Use**:
- Classes to instantiate are specified at runtime
- Avoiding building complex factory hierarchy parallel to product hierarchy
- Object instances can have only a few different state combinations
- Object creation is expensive (database lookups, network calls, computation)
- Need to decouple object creation from client code

**When NOT to Use**:
- Simple object creation is sufficient
- Deep copying is complex (circular references, resource handles)
- Language provides built-in cloning that's simpler

**Implementation Considerations**:
- Implement clone/copy method for copying protocol
- Shallow vs. deep copy (deep copy for complex objects)
- Handling circular references
- Managing resources (file handles, connections, memory)
- Registry of prototypes (by name/ID)

**Example Use Cases**:
- Cloning game objects (enemies, bullets with same configuration)
- Document templates (clone, then customize)
- Complex configuration objects
- Undo/redo (store clones as snapshots)
- Object pooling (clone from pool, reset state)

---

## Key Relationships Between Creational Patterns

- **Abstract Factory + Singleton**: Factory instances are often singletons
- **Abstract Factory + Prototype**: Implement factories using prototype cloning
- **Builder + Composite**: Builder can construct composite structures step-by-step
- **Factory Method + Strategy**: Factory creates appropriate strategy objects
- **Prototype + Composite**: Clone complex composite structures

## Implementation Guidelines

### Language-Specific Notes

**Rust**: Use traits for products, leverage ownership system for Singleton (Arc/Mutex), use enums for type-safe cloning.

**Python**: Use metaclass for Singleton, ABC for formal interfaces, leverage duck typing for Factory.

**C#**: Use Lazy<T> for thread-safe Singleton, generics for type-safe patterns, properties for lazy initialization.

**TypeScript**: Use interfaces, private constructors, generics for type safety.

**Go**: Use sync.Once for thread-safe Singleton, function types for factory functions.

**Dart**: Use factory constructors for Factory patterns, sealed classes for Product variants.

### General Principles

1. **Follow Language Idioms**: Use language-native features (decorators in Python, traits in Rust)
2. **Type Safety**: Use type systems to enforce patterns at compile-time where possible
3. **Avoid God Objects**: Keep factories focused on creation, not business logic
4. **Document Parameters**: Clear documentation of creation options and requirements
5. **Error Handling**: Handle invalid configurations, missing required parameters

---

See `resources/language-guide.md` for detailed language-specific implementations of these patterns.
