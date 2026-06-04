"""
nn.py — a tiny neural network built on top of your Value engine.

A Neuron is: activation( sum(weight_i * input_i) + bias ).
A Layer is a list of Neurons.
An MLP (multi-layer perceptron) is a list of Layers.

Because every weight/bias is a Value, the whole thing is automatically
differentiable — you already built that in engine.py.

Fill in the TODOs.
"""

import random
from engine import Value


class Neuron:
    def __init__(self, n_inputs):
        # one weight per input, plus one bias. Start them random-ish.
        self.w = [Value(random.uniform(-1, 1)) for _ in range(n_inputs)]
        self.b = Value(0.0)

    def __call__(self, x):
        # x is a list of inputs (numbers or Values), same length as self.w
        # Compute: act = w0*x0 + w1*x1 + ... + b, then squash with tanh.
        act = self.b
        for wi, xi in zip(self.w, x):
            act = act + wi * xi

        return act.tanh()

    def parameters(self):
        # everything that should get updated during training
        return self.w + [self.b]


class Layer:
    def __init__(self, n_inputs, n_outputs):
        # n_outputs neurons, each taking n_inputs inputs
        self.neurons = [Neuron(n_inputs) for _ in range(n_outputs)]

    def __call__(self, x):
        outs = [n(x) for n in self.neurons]
        # if a layer has a single neuron, return the bare value, not a list
        return outs[0] if len(outs) == 1 else outs

    def parameters(self):
        # flatten every neuron's parameters into one list
        return [p for n in self.neurons for p in n.parameters()]


class MLP:
    def __init__(self, n_inputs, layer_sizes):
        # layer_sizes e.g. [4, 4, 1] means two hidden layers then one output
        sizes = [n_inputs] + layer_sizes
        self.layers = [
            Layer(sizes[i], sizes[i + 1]) for i in range(len(layer_sizes))
        ]

    def __call__(self, x):
        # pass x through each layer in turn (feed output of one into the next)
        for layer in self.layers:
            x = layer.__call__(x)
        return x

    def parameters(self):
        return [p for layer in self.layers for p in layer.parameters()]
