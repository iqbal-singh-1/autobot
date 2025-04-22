# Java Basics - Study Notes

## 🧠 Memory in Java

### Heap vs String Pool
- **Heap**: Where all objects are stored.
- **String Pool**: A special part of the heap for string literals.
- If you use `new String("Hello")`, it creates:
  - A literal in the String Pool (if not already there)
  - An object in the heap
- If you just do `String s = "Hello"`, only one object is created in the pool.

### `intern()` Method
- Moves the string to the pool (or returns the pooled version).
```java
String a = new String("Hello");
String b = a.intern(); // b points to the pooled "Hello"
```

### Metaspace
- Replaced PermGen from Java 8 onward.
- Stores class metadata.
- Cannot be disabled, but can be limited:
```bash
-XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=512m
```

---

## 🛠 Access Modifiers

| Modifier   | Same Class | Same Package | Subclass | Other Package |
|------------|------------|--------------|----------|----------------|
| `private`  | ✅         | ❌           | ❌       | ❌             |
| default    | ✅         | ✅           | ❌       | ❌             |
| `protected`| ✅         | ✅           | ✅       | ❌             |
| `public`   | ✅         | ✅           | ✅       | ✅             |

### `private`
- Only accessible within the class.

### default (no keyword)
- Package-private: accessible in the same package.

### `protected`
- Accessible in the same package **and** by subclasses (even if in a different package).

---

## 📦 String Types

### String vs StringBuilder vs StringBuffer

| Type          | Mutable | Thread-safe | Performance |
|---------------|---------|-------------|-------------|
| `String`      | ❌      | ✅           | Medium      |
| `StringBuilder`| ✅      | ❌           | 🚀 Fast     |
| `StringBuffer`| ✅      | ✅           | 🐢 Slower   |

Use `StringBuilder` when single-threaded and `StringBuffer` when multithreaded.

---

## 👻 Anonymous Classes

### Definition
- A class without a name, defined and instantiated at the same time.
- Typically used to extend a class or implement an interface **on the fly**.

### Syntax
```java
InterfaceOrClass obj = new InterfaceOrClass() {
    // override methods here
};
```

### Use Cases
- Short-term customization
- Callbacks, event listeners, threading

### Works With
- ✅ Interfaces
- ✅ Abstract classes
- ✅ Concrete (non-final) classes
- ❌ Final classes
- ❌ Final methods (cannot override)

### Example
```java
Runnable r = new Runnable() {
    public void run() {
        System.out.println("Anonymous Runnable");
    }
};
new Thread(r).start();
```

### Can't Do
```java
final class Car {}
Car c = new Car() { }; // ❌ Compilation error
```

---

## ✅ String Equality
- `.equals()` checks content
- `==` checks reference

Example:
```java
String a = "Hello";
String b = new String("Hello");
System.out.println(a == b);         // false (different references)
System.out.println(a.equals(b));    // true
```

