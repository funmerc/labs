# micrograd

A from-scratch implementation of a scalar-valued autograd engine and a small neural network library built on top of it — completed as a hands-on learning exercise.

## Background

This project follows the structure of [Andrej Karpathy's micrograd](https://github.com/karpathy/micrograd), guided by his video [*The spelled-out intro to neural networks and backpropagation: building micrograd*](https://www.youtube.com/watch?v=VMj-3S1tku0). The scaffold was generated as a fill-in-the-blanks exercise template, and the implementations were written by me while working through the material.

> If you want to learn how backpropagation actually works from first principles, Karpathy's video is the place to start.

---

## Files

| File | What it does |
|---|---|
| `engine.py` | The autograd engine — the `Value` class |
| `nn.py` | Neural net library built on top of `Value` |
| `train.py` | A full training loop on a toy dataset |

---

## `engine.py` — The autograd engine

A single `Value` class that wraps a scalar and tracks every operation performed on it, building a computation graph as you go.

**Forward pass** — normal arithmetic. Each operation creates a new `Value` node and records which inputs produced it, along with a `_backward` closure that knows how to distribute gradients back to those inputs.

**Backward pass** — calling `.backward()` on any output node:
1. Builds a **topological ordering** of the graph so every node is processed only after all nodes that depend on it
2. Seeds the output's gradient at `1.0`
3. Walks the graph in reverse, calling each node's `_backward()` to accumulate gradients via the chain rule

Supported operations: `+`, `-`, `*`, `/`, `**`, `tanh`, `exp`, and negation.

```python
from engine import Value

a = Value(2.0)
b = Value(-3.0)
c = a * b + Value(1.0)
c.backward()

print(a.grad)  # dc/da = -3.0
print(b.grad)  # dc/db =  2.0
```

A key detail: gradients **accumulate** (`+=`) rather than overwrite, because the same `Value` node can feed into multiple places in the graph and each path contributes its own gradient.

---

## `nn.py` — Neural network library

Three classes, each building on the one before. Because every weight and bias is a `Value`, the autograd engine handles all the gradient math automatically.

**`Neuron`** — weights, a bias, and a `tanh` activation. On a forward call, computes `tanh(w · x + b)`.

**`Layer`** — a list of neurons all reading the same inputs. Returns a list of outputs (or a single value if there's only one neuron).

**`MLP`** — stacks layers in sequence. You give it an input size and a list of layer sizes:

```python
from nn import MLP

model = MLP(3, [4, 4, 1])
# 3 inputs -> hidden layer of 4 -> hidden layer of 4 -> 1 output
```

`model.parameters()` returns every weight and bias across the whole network as a flat list — which is exactly what the training loop needs.

---

## `train.py` — The training loop

Trains the MLP on a small toy dataset (4 examples, 3 inputs each) using mean squared error loss and SGD. The five steps are the same ones used to train every neural network, just scaled up:

```
1. Forward pass   — run inputs through the model to get predictions
2. Loss           — measure how wrong the predictions are (MSE)
3. Zero gradients — reset .grad on every parameter before backprop
4. Backward pass  — loss.backward() fills in all gradients automatically
5. Update         — nudge each parameter against its gradient
```

Step 3 is the easy-to-forget one: because the engine accumulates gradients with `+=`, skipping the zero step causes gradients from previous iterations to pile up and corrupt the update.

After 100 steps at `lr=0.05` the predictions converge close to the targets `[1, -1, -1, 1]`.

---

## Key concepts this covers

- **Reverse-mode automatic differentiation** built from scratch
- **Computational graphs** — how a DAG is built dynamically during the forward pass
- **Chain rule** — applied at each node's `_backward()` closure
- **Topological sort** — why ordering matters when accumulating gradients
- **Gradient descent** — using `.grad` to update parameters toward lower loss

---

## Credit

- Original micrograd: [karpathy/micrograd](https://github.com/karpathy/micrograd) (MIT License)
- Video walkthrough: [youtube.com/watch?v=VMj-3S1tku0](https://www.youtube.com/watch?v=VMj-3S1tku0)
