"""
engine.py — a tiny scalar autograd engine.

Goal: every Value remembers its number AND how it was made.
That memory lets us walk backward and fill in gradients automatically.
"""

import math


class Value:
    """Stores a single scalar and its gradient, plus how it was computed."""

    def __init__(self, data, _children=(), _op=""):
        self.data = data
        self.grad = 0.0  # starts at zero; backprop fills this in

        # internal bookkeeping for autograd
        self._backward = lambda: None   # how to push grad to parents; set per-op
        self._prev = set(_children)     # the Values this one was made from
        self._op = _op                  # what operation made it (for debugging)

    # ----- operations -----
    # Each op does TWO jobs:
    #   1. compute the resulting Value
    #   2. define _backward(): how to send THIS node's grad to its parents
    #
    # Reminder on the chain rule: a parent's grad gets
    #   (local derivative of this op w.r.t. that parent) * (this node's grad)
    # and we ACCUMULATE (+=) because a node can feed into many places.

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")

        def _backward():
            # For c = a + b, addition passes gradient straight through.
            # local derivative w.r.t. a is 1, w.r.t. b is 1.
            self.grad  += 1.0 * out.grad
            other.grad += 1.0 * out.grad

        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")

        def _backward():
            # For c = a * b, local derivative w.r.t. a is b, w.r.t. b is a.
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = _backward
        return out

    def __pow__(self, other):
        # only support int/float powers, e.g. x**2
        assert isinstance(other, (int, float)), "only int/float powers"
        out = Value(self.data ** other, (self,), f"**{other}")

        def _backward():
            # d/dx (x**n) = n * x**(n-1)
            self.grad += other * (self.data ** (other - 1)) * out.grad

        out._backward = _backward
        return out

    def tanh(self):
        # a common "squashing" nonlinearity, output in (-1, 1)
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")

        def _backward():
            # d/dx tanh(x) = 1 - tanh(x)**2   (note: t IS tanh(x) here)
            self.grad += (1 - t**2) * out.grad

        out._backward = _backward
        return out

    def exp(self):
        out = Value(math.exp(self.data), (self,), "exp")

        def _backward():
            # d/dx e**x = e**x, and out.data IS e**x here
            self.grad += out.data * out.grad

        out._backward = _backward
        return out

    # ----- the big one: walk the whole graph backward -----
    def backward(self):
        # 1) build a topological order: every node appears AFTER all its
        #    children, so when we process it, its grad is already complete.
        topo = []
        visited = set()

        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)

        build_topo(self)

        # 2) seed: the gradient of the final output w.r.t. itself is 1.
        self.grad = 1

        # 3) go backward through the graph, applying each local rule.
        for node in reversed(topo):
            node._backward()

    # ----- convenience so a+b, b+a, a-b, a/b, -a all work -----
    def __neg__(self):           return self * -1
    def __radd__(self, other):   return self + other
    def __sub__(self, other):    return self + (-other)
    def __rsub__(self, other):   return other + (-self)
    def __rmul__(self, other):   return self * other
    def __truediv__(self, other): return self * other ** -1
    def __rtruediv__(self, other): return other * self ** -1

    def __repr__(self):
        return f"Value(data={self.data}, grad={self.grad})"
