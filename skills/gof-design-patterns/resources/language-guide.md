# Language-Specific Implementation Guide

This guide provides detailed implementation strategies for Gang of Four design patterns in each supported language.

## Table of Contents

1. [C#](#c)
2. [Rust](#rust)
3. [Python](#python)
4. [Dart](#dart)
5. [Go](#go)
6. [GenAIScript](#genaiscript)
7. [TypeScript](#typescript)
8. [C](#c-1)

---

## C#

### Language Features Relevant to Patterns

- **Interfaces**: Define contracts for patterns
- **Abstract Classes**: Template Method, Factory Method base classes
- **Properties**: Encapsulation, lazy initialization
- **Events**: Observer pattern implementation
- **Generics**: Type-safe patterns (Repository, Factory)
- **LINQ**: Iterator, Visitor operations
- **Async/Await**: Asynchronous Command, Proxy
- **Extension Methods**: Decorator-like behavior
- **Attributes**: Metadata for pattern configuration

### Pattern-Specific Guidance

#### Singleton
```csharp
// Thread-safe lazy singleton using Lazy<T>
public sealed class Singleton
{
    private static readonly Lazy<Singleton> lazy =
        new Lazy<Singleton>(() => new Singleton());

    public static Singleton Instance => lazy.Value;

    private Singleton() { }
}
```

#### Factory Method
```csharp
// Use abstract class with generic constraints
public abstract class Creator<T> where T : Product
{
    public abstract T FactoryMethod();

    public void SomeOperation()
    {
        var product = FactoryMethod();
        product.DoSomething();
    }
}
```

#### Observer
```csharp
// Use events and delegates
public class Subject
{
    public event EventHandler<StateChangedEventArgs> StateChanged;

    protected virtual void OnStateChanged(StateChangedEventArgs e)
    {
        StateChanged?.Invoke(this, e);
    }
}
```

#### Decorator
```csharp
// Use interfaces and composition
public interface IComponent
{
    void Operation();
}

public class Decorator : IComponent
{
    private readonly IComponent _component;

    public Decorator(IComponent component)
    {
        _component = component;
    }

    public virtual void Operation()
    {
        _component.Operation();
    }
}
```

### Naming Conventions
- PascalCase for classes, interfaces, methods, properties
- Prefix interfaces with 'I' (IComponent, IObserver)
- Use meaningful names (ConcreteDecoratorA → BorderDecorator)

### Best Practices
- Use dependency injection containers (Microsoft.Extensions.DependencyInjection)
- Prefer async/await for asynchronous operations
- Use IDisposable for resource cleanup in patterns
- Leverage LINQ for collection operations in Iterator
- Use Expression-bodied members for simple implementations

---

## Rust

### Language Features Relevant to Patterns

- **Traits**: Define interfaces for patterns
- **Enums**: Sum types for State pattern
- **Struct**: Data structures for patterns
- **Ownership**: Singleton, Prototype considerations
- **Arc/Mutex**: Thread-safe shared state
- **Box/Rc**: Heap allocation, reference counting
- **Pattern Matching**: State, Strategy dispatch
- **Closures**: Command, Strategy patterns
- **Lifetimes**: Managing references in patterns

### Pattern-Specific Guidance

#### Singleton
```rust
// Using lazy_static or once_cell
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;

static INSTANCE: Lazy<Arc<Mutex<Singleton>>> = Lazy::new(|| {
    Arc::new(Mutex::new(Singleton::new()))
});

struct Singleton {
    // fields
}

impl Singleton {
    fn new() -> Self {
        Singleton { /* ... */ }
    }

    fn instance() -> Arc<Mutex<Singleton>> {
        Arc::clone(&INSTANCE)
    }
}
```

#### Factory Method
```rust
// Use traits for product and creator
trait Product {
    fn operation(&self);
}

trait Creator {
    type ProductType: Product;

    fn factory_method(&self) -> Self::ProductType;

    fn some_operation(&self) {
        let product = self.factory_method();
        product.operation();
    }
}
```

#### State
```rust
// Use enums for type-safe states
enum State {
    Idle,
    Running { data: String },
    Finished,
}

struct Context {
    state: State,
}

impl Context {
    fn handle(&mut self) {
        self.state = match self.state {
            State::Idle => State::Running { data: String::new() },
            State::Running { ref data } => State::Finished,
            State::Finished => State::Idle,
        };
    }
}
```

#### Strategy
```rust
// Use trait objects for runtime polymorphism
trait Strategy {
    fn execute(&self, data: &str) -> String;
}

struct Context {
    strategy: Box<dyn Strategy>,
}

impl Context {
    fn execute_strategy(&self, data: &str) -> String {
        self.strategy.execute(data)
    }
}
```

### Naming Conventions
- snake_case for functions, variables, modules
- PascalCase for types, traits, enums
- SCREAMING_SNAKE_CASE for constants
- Descriptive trait names (Drawable, Cloneable, Strategy)

### Best Practices
- Use newtype pattern for type safety
- Leverage enums for State pattern (type-safe states)
- Use Arc<Mutex<T>> for shared mutable state
- Prefer composition over complex inheritance
- Use trait objects (dyn Trait) for runtime polymorphism
- Use generic traits for compile-time polymorphism
- Handle errors with Result<T, E>
- Document ownership transfer in comments

---

## Python

### Language Features Relevant to Patterns

- **ABC (Abstract Base Classes)**: Formal interfaces
- **Duck Typing**: Informal interfaces
- **Decorators**: Decorator pattern, function wrapping
- **Properties**: Encapsulation, computed attributes
- **Magic Methods**: Operator overloading, iteration
- **Metaclasses**: Singleton, class creation patterns
- **Multiple Inheritance**: Mixin patterns
- **Type Hints**: Static type checking
- **Generators**: Iterator pattern
- **Context Managers**: Resource management in patterns

### Pattern-Specific Guidance

#### Singleton
```python
# Using metaclass
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Singleton(metaclass=SingletonMeta):
    pass

# Or using decorator
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Singleton:
    pass
```

#### Factory Method
```python
from abc import ABC, abstractmethod

class Creator(ABC):
    @abstractmethod
    def factory_method(self) -> Product:
        pass

    def some_operation(self) -> str:
        product = self.factory_method()
        return product.operation()
```

#### Decorator
```python
# Using function decorators
def logging_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Finished {func.__name__}")
        return result
    return wrapper

# Using class-based decorator
class Component(ABC):
    @abstractmethod
    def operation(self) -> str:
        pass

class Decorator(Component):
    def __init__(self, component: Component):
        self._component = component

    def operation(self) -> str:
        return self._component.operation()
```

#### Observer
```python
# Using properties and callbacks
class Subject:
    def __init__(self):
        self._observers = []
        self._state = None

    def attach(self, observer):
        self._observers.append(observer)

    def notify(self):
        for observer in self._observers:
            observer.update(self)

    @property
    def state(self):
        return self._state

    @state.setter
    def state(self, value):
        self._state = value
        self.notify()
```

### Naming Conventions
- snake_case for functions, variables, modules
- PascalCase for classes
- ALL_CAPS for constants
- Private members prefixed with underscore (_private)
- Dunder methods for magic methods (__init__, __str__)

### Best Practices
- Use ABC for formal interfaces when needed
- Leverage duck typing for flexibility
- Use type hints (from typing module) for clarity
- Prefer composition over inheritance
- Use __slots__ for memory efficiency in Flyweight
- Use context managers (with statement) for resource management
- Leverage generators for Iterator pattern
- Use dataclasses for simple data structures
- Follow PEP 8 style guide

---

## Dart

### Language Features Relevant to Patterns

- **Abstract Classes**: Define contracts
- **Interfaces**: Implicit (every class is an interface)
- **Mixins**: Share behavior across classes
- **Factory Constructors**: Named constructors for factories
- **Getters/Setters**: Computed properties
- **Generics**: Type-safe patterns
- **Async/Await**: Asynchronous operations
- **Streams**: Observer pattern implementation
- **Extension Methods**: Add functionality to existing classes
- **Sealed Classes**: Exhaustive pattern matching (Dart 3+)

### Pattern-Specific Guidance

#### Singleton
```dart
class Singleton {
  // Private constructor
  Singleton._internal();

  // Static instance
  static final Singleton _instance = Singleton._internal();

  // Factory constructor returns the single instance
  factory Singleton() {
    return _instance;
  }
}

// Usage: var singleton = Singleton();
```

#### Factory Method
```dart
abstract class Product {
  void operation();
}

abstract class Creator {
  // Factory method
  Product factoryMethod();

  void someOperation() {
    final product = factoryMethod();
    product.operation();
  }
}

class ConcreteCreator extends Creator {
  @override
  Product factoryMethod() => ConcreteProduct();
}
```

#### Builder
```dart
// Using cascade notation
class Product {
  String? partA;
  String? partB;

  Product();
}

class Builder {
  final Product _product = Product();

  Builder setPartA(String value) {
    _product.partA = value;
    return this;
  }

  Builder setPartB(String value) {
    _product.partB = value;
    return this;
  }

  Product build() => _product;
}

// Usage with cascade:
// var product = Builder()
//   ..setPartA('A')
//   ..setPartB('B')
//   ..build();
```

#### Observer (using Streams)
```dart
import 'dart:async';

class Subject {
  final _controller = StreamController<int>.broadcast();

  Stream<int> get stream => _controller.stream;

  void updateState(int state) {
    _controller.add(state);
  }

  void dispose() {
    _controller.close();
  }
}

// Usage:
// subject.stream.listen((state) => print(state));
```

### Naming Conventions
- lowerCamelCase for variables, functions, parameters
- UpperCamelCase for classes, enums, type definitions
- lowercase_with_underscores for libraries, packages
- Prefix private members with underscore (_private)

### Best Practices
- Use factory constructors for Factory patterns
- Leverage named constructors for different creation methods
- Use const constructors for immutable objects (Flyweight)
- Use mixins for shared behavior without inheritance
- Use Streams for Observer pattern (reactive programming)
- Leverage async/await for asynchronous patterns
- Use extension methods to add functionality without inheritance
- Follow Effective Dart guidelines
- Use sealed classes (Dart 3+) for exhaustive State pattern matching

---

## Go

### Language Features Relevant to Patterns

- **Interfaces**: Implicit implementation
- **Structs**: Data structures
- **Struct Embedding**: Composition
- **Function Types**: First-class functions
- **Closures**: Capture state for patterns
- **Goroutines**: Concurrent patterns
- **Channels**: Communication, Observer pattern
- **sync Package**: Synchronization primitives
- **defer**: Resource cleanup

### Pattern-Specific Guidance

#### Singleton
```go
package singleton

import "sync"

type singleton struct {
    // fields
}

var instance *singleton
var once sync.Once

func GetInstance() *singleton {
    once.Do(func() {
        instance = &singleton{}
    })
    return instance
}
```

#### Factory Method
```go
// Use interface and factory functions
type Product interface {
    Operation() string
}

type ConcreteProductA struct{}

func (p *ConcreteProductA) Operation() string {
    return "Product A"
}

type Creator interface {
    FactoryMethod() Product
}

type ConcreteCreator struct{}

func (c *ConcreteCreator) FactoryMethod() Product {
    return &ConcreteProductA{}
}

// Or use function types
type FactoryFunc func() Product

func CreateProductA() Product {
    return &ConcreteProductA{}
}
```

#### Strategy
```go
// Use function types
type Strategy func(data string) string

type Context struct {
    strategy Strategy
}

func (c *Context) ExecuteStrategy(data string) string {
    return c.strategy(data)
}

// Or use interfaces
type Strategy interface {
    Execute(data string) string
}

type Context struct {
    strategy Strategy
}
```

#### Observer (using channels)
```go
type Subject struct {
    observers []chan int
}

func (s *Subject) Attach(observer chan int) {
    s.observers = append(s.observers, observer)
}

func (s *Subject) Notify(state int) {
    for _, observer := range s.observers {
        observer <- state
    }
}
```

#### Decorator
```go
// Use struct embedding
type Component interface {
    Operation() string
}

type ConcreteComponent struct{}

func (c *ConcreteComponent) Operation() string {
    return "ConcreteComponent"
}

type Decorator struct {
    Component
}

func (d *Decorator) Operation() string {
    return "Decorator(" + d.Component.Operation() + ")"
}
```

### Naming Conventions
- MixedCase for exported names (public)
- mixedCase for unexported names (private)
- Acronyms are all caps (HTTP, URL, ID)
- Interface names often end in -er (Reader, Writer, Strategy)
- Package names are lowercase, single word

### Best Practices
- Accept interfaces, return structs
- Keep interfaces small (single method common)
- Use struct embedding for composition
- Use sync.Once for thread-safe Singleton
- Leverage function types for Strategy and Command
- Use channels for Observer pattern communication
- Use defer for cleanup in patterns (Close, Unlock)
- Error handling with multiple return values
- Use context.Context for cancellation and timeouts
- Follow Go Code Review Comments guidelines

---

## GenAIScript

### Language Features Relevant to Patterns

GenAIScript is JavaScript/TypeScript-based, so it inherits those features:

- **Functions as First-Class Citizens**: Strategy, Command
- **Closures**: Encapsulation, state capture
- **Prototypes/Classes**: OOP patterns
- **Async/Await**: Asynchronous patterns
- **Promises**: Future/Promise pattern
- **Object Literals**: Simple object creation
- **Destructuring**: Clean parameter handling
- **Modules**: Namespace isolation

### Pattern-Specific Guidance

#### Singleton
```javascript
// Using module pattern
const Singleton = (() => {
    let instance;

    function createInstance() {
        return {
            // properties and methods
        };
    }

    return {
        getInstance: () => {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

// Or ES6 class
class Singleton {
    constructor() {
        if (Singleton.instance) {
            return Singleton.instance;
        }
        Singleton.instance = this;
    }
}
```

#### Factory Method
```javascript
class Creator {
    factoryMethod() {
        throw new Error("Must be implemented");
    }

    someOperation() {
        const product = this.factoryMethod();
        return product.operation();
    }
}

class ConcreteCreator extends Creator {
    factoryMethod() {
        return new ConcreteProduct();
    }
}
```

#### Strategy
```javascript
// Using function objects
class Context {
    constructor(strategy) {
        this.strategy = strategy;
    }

    executeStrategy(data) {
        return this.strategy(data);
    }
}

// Usage
const context = new Context((data) => data.toUpperCase());
```

#### Observer
```javascript
class Subject {
    constructor() {
        this.observers = [];
    }

    attach(observer) {
        this.observers.push(observer);
    }

    notify(data) {
        this.observers.forEach(observer => observer.update(data));
    }
}

// Or use EventEmitter pattern
```

### Naming Conventions
- camelCase for variables, functions
- PascalCase for classes, constructors
- UPPER_CASE for constants
- Prefix private fields with # (ES2022+) or underscore

### Best Practices
- Use modern JavaScript/TypeScript features
- Leverage async/await for asynchronous operations
- Use arrow functions for concise syntax
- Destructure parameters for clarity
- Use const/let instead of var
- Leverage built-in methods (map, filter, reduce)
- Use modules for encapsulation
- Follow JavaScript Standard Style or similar

---

## TypeScript

### Language Features Relevant to Patterns

- **Interfaces**: Define contracts
- **Type Aliases**: Union types, intersections
- **Classes**: OOP patterns
- **Generics**: Type-safe patterns
- **Abstract Classes**: Template Method, Factory Method
- **Decorators**: Metadata, AOP patterns
- **Enums**: State enumeration
- **Union Types**: State representation
- **Type Guards**: Runtime type checking
- **Access Modifiers**: private, protected, public

### Pattern-Specific Guidance

#### Singleton
```typescript
class Singleton {
    private static instance: Singleton;

    private constructor() {
        // Private constructor
    }

    public static getInstance(): Singleton {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }
}
```

#### Factory Method
```typescript
interface Product {
    operation(): string;
}

abstract class Creator {
    abstract factoryMethod(): Product;

    someOperation(): string {
        const product = this.factoryMethod();
        return product.operation();
    }
}

class ConcreteCreator extends Creator {
    factoryMethod(): Product {
        return new ConcreteProduct();
    }
}
```

#### Builder
```typescript
class Product {
    partA?: string;
    partB?: number;
}

class Builder {
    private product: Product = new Product();

    setPartA(value: string): this {
        this.product.partA = value;
        return this;
    }

    setPartB(value: number): this {
        this.product.partB = value;
        return this;
    }

    build(): Product {
        return this.product;
    }
}

// Usage: const product = new Builder().setPartA('A').setPartB(1).build();
```

#### State (using union types)
```typescript
type State =
    | { type: 'idle' }
    | { type: 'loading'; progress: number }
    | { type: 'success'; data: string }
    | { type: 'error'; error: Error };

class Context {
    private state: State = { type: 'idle' };

    setState(state: State) {
        this.state = state;
    }

    handle() {
        switch (this.state.type) {
            case 'idle':
                // Handle idle
                break;
            case 'loading':
                // Access state.progress
                break;
            case 'success':
                // Access state.data
                break;
            case 'error':
                // Access state.error
                break;
        }
    }
}
```

#### Decorator (using TypeScript decorators)
```typescript
function Logger(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function(...args: any[]) {
        console.log(`Calling ${propertyKey}`);
        const result = original.apply(this, args);
        console.log(`Finished ${propertyKey}`);
        return result;
    };

    return descriptor;
}

class Example {
    @Logger
    method() {
        console.log('Executing method');
    }
}
```

### Naming Conventions
- camelCase for variables, functions, properties
- PascalCase for classes, interfaces, types, enums
- UPPER_CASE for constants
- Prefix interfaces with 'I' (optional, style preference)
- Use meaningful names for type parameters (TKey, TValue vs. T, U)

### Best Practices
- Use strict mode (strict: true in tsconfig.json)
- Leverage type inference where possible
- Use generics for reusable, type-safe code
- Prefer interfaces for object shapes, types for unions/intersections
- Use readonly for immutability
- Leverage discriminated unions for State pattern
- Use utility types (Partial, Required, Pick, Omit)
- Use enums sparingly (prefer union types)
- Follow TypeScript official style guide
- Use null safety (strictNullChecks)

---

## C

### Language Features Relevant to Patterns

C lacks OOP features, so patterns require different implementations:

- **Structs**: Data structures
- **Function Pointers**: Polymorphism, callbacks
- **Opaque Pointers**: Encapsulation
- **Static Variables**: Singleton, class-level state
- **Macros**: Code generation
- **Void Pointers**: Generic programming
- **Header/Implementation Split**: Interface definition

### Pattern-Specific Guidance

#### Singleton
```c
// singleton.h
typedef struct Singleton Singleton;

Singleton* singleton_get_instance(void);
void singleton_do_something(Singleton* self);

// singleton.c
struct Singleton {
    int data;
};

static Singleton* instance = NULL;

Singleton* singleton_get_instance(void) {
    if (instance == NULL) {
        instance = malloc(sizeof(Singleton));
        instance->data = 0;
    }
    return instance;
}
```

#### Factory Method (using function pointers)
```c
// Product interface (function pointers)
typedef struct Product {
    void (*operation)(struct Product* self);
    void (*destroy)(struct Product* self);
} Product;

// Factory function type
typedef Product* (*FactoryFunc)(void);

// Creator
typedef struct Creator {
    FactoryFunc factory_method;
} Creator;

Product* creator_some_operation(Creator* creator) {
    Product* product = creator->factory_method();
    product->operation(product);
    return product;
}
```

#### Strategy
```c
// Strategy function type
typedef int (*StrategyFunc)(const char* data);

typedef struct Context {
    StrategyFunc strategy;
} Context;

void context_execute_strategy(Context* ctx, const char* data) {
    int result = ctx->strategy(data);
    // Use result
}

// Concrete strategies
int strategy_a(const char* data) {
    // Implementation A
    return 0;
}

int strategy_b(const char* data) {
    // Implementation B
    return 1;
}
```

#### Polymorphism (vtable pattern)
```c
// Base class
typedef struct Shape {
    const struct ShapeVTable* vtable;
} Shape;

typedef struct ShapeVTable {
    void (*draw)(Shape* self);
    void (*destroy)(Shape* self);
} ShapeVTable;

// Concrete class
typedef struct Circle {
    Shape base;
    int radius;
} Circle;

void circle_draw(Shape* self) {
    Circle* circle = (Circle*)self;
    printf("Circle with radius %d\n", circle->radius);
}

void circle_destroy(Shape* self) {
    free(self);
}

static const ShapeVTable circle_vtable = {
    .draw = circle_draw,
    .destroy = circle_destroy,
};

Circle* circle_create(int radius) {
    Circle* circle = malloc(sizeof(Circle));
    circle->base.vtable = &circle_vtable;
    circle->radius = radius;
    return circle;
}
```

#### Opaque Pointers (encapsulation)
```c
// header.h
typedef struct Object Object;  // Opaque type

Object* object_create(void);
void object_do_something(Object* obj);
void object_destroy(Object* obj);

// implementation.c
struct Object {
    int private_data;
    char* private_string;
};

Object* object_create(void) {
    Object* obj = malloc(sizeof(Object));
    obj->private_data = 0;
    obj->private_string = NULL;
    return obj;
}
```

### Naming Conventions
- snake_case for functions, variables
- UPPER_CASE for macros, constants
- PascalCase or snake_case for types (struct Circle or struct circle)
- Prefix functions with module name (list_create, list_add)
- Prefix struct members to avoid conflicts

### Best Practices
- Use opaque pointers for encapsulation
- Function pointers for polymorphism and callbacks
- Naming conventions to namespace (module_function)
- Always check malloc return values
- Provide create/destroy functions (constructors/destructors)
- Use const for read-only parameters
- Document ownership and lifetime in comments
- Use static for internal functions (file scope)
- Header guards for all headers
- Follow a consistent coding standard (K&R, Linux kernel style)

### Memory Management
- Patterns must handle memory explicitly
- Provide destroy/cleanup functions
- Document who owns allocated memory
- Use reference counting for shared objects
- Consider using memory pools for Flyweight

---

## Cross-Language Considerations

### When Implementing Patterns

1. **Respect Language Idioms**
   - Don't force OOP patterns in functional languages
   - Use language-native features (decorators in Python, traits in Rust)
   - Follow community conventions

2. **Type Systems**
   - Static typing: Use generics, interfaces
   - Dynamic typing: Use duck typing, protocols
   - Leverage type system for compile-time safety

3. **Memory Management**
   - GC languages: Focus on references and lifetime
   - Manual management: Document ownership, provide cleanup
   - Rust: Leverage ownership system for safety

4. **Concurrency**
   - Thread-safe Singleton in multithreaded environments
   - Use language-appropriate synchronization (locks, channels, actors)
   - Consider immutability for concurrent patterns

5. **Error Handling**
   - Exceptions: try/catch in C#, Python, TypeScript
   - Result types: Result<T, E> in Rust
   - Multiple returns: value, error in Go
   - Return codes: int status in C

6. **Testing**
   - Patterns should be testable
   - Use dependency injection
   - Provide interfaces for mocking
   - Document test strategies

---

This guide should be consulted when implementing patterns in specific languages to ensure idiomatic, production-quality code.
