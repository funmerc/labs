"""
train.py — train the tiny net and watch the loss shrink.

This is THE lesson. The five steps below are the same five steps that
train every model, including the triple extractor you'll build later —
just scaled up. Read the comments, then fill in the TODOs.
"""

from nn import MLP

# A tiny toy dataset: 4 examples, each with 3 input numbers.
# We want the net to learn to output the matching target.
xs = [
    [2.0, 3.0, -1.0],
    [3.0, -1.0, 0.5],
    [0.5, 1.0, 1.0],
    [1.0, 1.0, -1.0],
]
ys = [1.0, -1.0, -1.0, 1.0]  # the targets we want

# A net: 3 inputs -> hidden layer of 4 -> hidden layer of 4 -> 1 output
model = MLP(3, [4, 4, 1])

learning_rate = 0.05
n_steps = 100

for step in range(n_steps):
    # --- 1. FORWARD PASS: run every input through the model ---
    preds = [model(x) for x in xs]

    # --- 2. LOSS: how wrong are we? ---
    # Mean squared error: sum of (prediction - target)**2 over all examples.
    # Smaller = better. Build it up in a loop.
    loss = 0
    for pred, target in zip(preds, ys):
        loss = loss + (pred - target) ** 2

    # --- 3. ZERO THE GRADIENTS ---
    # Grads ACCUMULATE (+=) in the engine, so we must reset them each step,
    # otherwise this step's grads pile on top of last step's. Easy to forget!
    for p in model.parameters():
        p.grad = 0.0

    # --- 4. BACKWARD PASS: fill in every gradient automatically ---
    loss.backward()

    # --- 5. UPDATE: nudge each weight a tiny step AGAINST its gradient ---
    # The gradient points uphill (toward higher loss); we want lower loss,
    # so we step in the NEGATIVE gradient direction.
    for p in model.parameters():
        p.data += -learning_rate * p.grad

    # print progress so you can SEE the loss shrink
    print(f"step {step:3d}  loss {loss.data:.4f}")

# After training, the predictions should be close to ys: [1, -1, -1, 1]
print("\nfinal predictions:")
for x in xs:
    print(f"  {x} -> {model(x).data:.3f}")
