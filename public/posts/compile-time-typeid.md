# Compile Time typeid In C++ Without RTTI

>  This article begins with some motivation behind the implementation, you can skip this and jump straight to the [C++11 implementation](#a/compile-time-typeid/a-non-rtti-alternative-to-typeid) or the [C++17 version](#a/compile-time-typeid/c17-alternative) if you prefer. All assembly output was generated with clang 10.0.0 using -O2 on Linux.

When implementing an [Entity Component System](https://en.wikipedia.org/wiki/Entity_component_system) or ECS an operation that comes up frequently is doing some hash table lookup based on a type. A common way to implement an ECS is to store all instances of some component type (some struct) in a contiguous array, each of these arrays is then stored in a hash table using the type of the component as a key.

Keeping all instances of a given type in an array is done to improve cache performance when iterating through components. Looking up component arrays is often the most frequent operation in an ECS, often done in tight loops, so we use type erased values in the hash table to avoid a virtual calls to the component array.

One way to implement this lookup is to use RTTI with the return value of `typeid::hash_code` as a key for an `unordered_map` to figure out which array we want.

```cpp
static std::unordered_map<size_t, void *> component_array_map;

template <typename T>
ComponentArray<T> *find_component_array() {
  size_t id = typeid(T).hash_code();
  auto array_it = component_array_map.find(id);

  assert(array_it != component_array_map.end());
  return static_cast<ComponentArray<T> *>(array_it->second);
}
```

Component arrays are an implementation detail of the ECS and a few things aren’t ideal with this implementation, like using `unordered_map` when we are optimizing for cache performance, so I won’t focus on the implementation of `find_component_array` in this article. What I’m interested in is the call to `typeid(T).hash_code()`.

## The issue with `typeid::hash_code`

One thing that is not great about our `find_component_array` implementation is that `typeid` is overkill for what we’re trying to achieve. Taking a look at the generated assembly for `typeid(Foo).hash_code()` we can see that we are doing more work than is really necessary.

```asm
movl $typeinfo name for Foo, %edi
movl $2, %esi
movl $3339675911, %edx
callq std::_Hash_bytes(void const*, unsigned long, unsigned long)
```

Notice that `typeid::hash_code` calls `std::_Hash_bytes` which computes the hash of the string representation of `Foo` at runtime. This is a bit silly since we already know all of the types we are interested in at compile time and should therefore be able to get a unique id for a given type at compile time. Furthermore since this is a runtime call, we can’t use the type id in any compile time situation like static asserts or compile time data structures.

One way to simplify this is to use the address returned from `typeid(T).name()` directly as a key in the map which removes the hashing step, but `name()` is not `constexpr` so we still can’t use it at compile time.

## A non-RTTI alternative to `typeid`

Since we are only interested in getting a unique id for a type, and we don’t need the other facilities provided by `typeid` like getting a name string of our type or evaluating the type of an expression, we can implement a much simpler `type_id<T>` that works completely at compile time without RTTI.

```cpp
using type_id_t = const void *;

template <typename T>
struct TypeIdInfo {
  static const T *value;
};

template <typename T>
const T *TypeIdInfo<T>::value = nullptr;

template <typename T>
constexpr type_id_t type_id() {
  return &TypeIdInfo<T>::value;
}
```

We use the fact that each template instantiation of `TypeIdInfo` will result in a separate static variable being defined for each template instance. We can then use the address of the static variable as a unique identifier for the type `T`.


Throw `TypeIdInfo` in a `namespace internal` and this ends up being quite a nice API.

```cpp
constexpr auto foo_type = type_id<Foo>();
```

This method works surprisingly well with very little code, and unsurprisingly we have reduced the generated assembly for `type_id<Foo>()` to a single load instruction.

```asm
movl $type_id_ptr<Foo>::id, %eax
```

We still have some work to do though as right now `type_id<Foo>()` returns a different value than `type_id<Foo &>()` or `type_id<const Foo *>()` which may not be the behavior we want. This is easily solved using type traits, though the implementation is not exactly easy on the eyes.

```cpp
template <typename T>
constexpr type_id_t type_id() {
  return &TypeIdInfo<typename std::remove_const<
      typename std::remove_volatile<typename std::remove_pointer<
          typename std::remove_reference<T>::type>::type>::type>::type>::value;
}
```

Note that the order in which the type traits are used matters and `remove_const` should be done last. If instead we were to apply `remove_const` before `remove_reference` we might get unexpected results, for example `remove_const<const T &>>` yields `const T&` instead of `T&`.

## C++17 alternative

If you have access to a C++17 compiler the implementation for `type_id<T>` can be simplified using inline template variables, which removes the need for the extra `TypeIdInfo<T>` struct.

```cpp
template <typename T>
inline const T *type_id_info = nullptr;

template <typename T>
constexpr type_id_t type_id() {
  return &type_id_info<std::remove_const_t<std::remove_volatile_t<
      std::remove_pointer_t<std::remove_reference_t<T>>>>>::value;
}
```

The compiled output from either version is exactly the same.
