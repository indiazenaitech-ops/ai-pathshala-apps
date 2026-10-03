/* Localised learning content: guided challenges (presets in app.js, same order) and explanations. */
window.APP_CONTENT = {
  en: {
    challenges: [
      { title: 'The XOR puzzle', task: 'XOR with no hidden layer. Will a single neuron learn to separate the colours?', notice: 'No! Blue points sit in two opposite corners and orange in the other two. One neuron can only draw one straight line, and no straight line can split XOR. This puzzle stumped AI researchers in 1969.' },
      { title: 'A hidden layer saves the day', task: 'The same XOR puzzle, now with one hidden layer of 4 neurons. Train it. What changes?', notice: 'It learns! Each hidden neuron draws its own straight line (tap the squares to see). The output neuron combines these lines into the X-shaped answer.' },
      { title: 'Give it a better clue', task: 'Circle with no hidden layer, but the inputs are x₁² and x₂² instead of x₁ and x₂. Can one neuron do it now?', notice: 'Yes, and fast! x₁² + x₂² is the squared distance from the centre (Pythagoras), so one neuron can tell inside from outside. Choosing good inputs is called feature engineering.' },
      { title: 'The spiral challenge', task: 'The spiral is the hardest puzzle. Train a deep network with 3 hidden layers of 8 neurons. Then try adding sin(x₁) and sin(x₂).', notice: 'Deep networks can bend the boundary into a spiral, but it takes many epochs. Extra inputs like sin make the job much easier. If it gets stuck, press Reset.' },
      { title: 'Too clever: overfitting', task: 'Only 10% training data, 50% noise and a big network. Watch the training loss and the test loss.', notice: 'Training loss becomes very small, but test loss stays high or even goes up. The network memorised the few noisy training points (even the wrong ones!) instead of the real pattern. More data or a smaller network helps.' },
      { title: 'Giant steps', task: 'Learning rate 3, which is very big. Train and watch the loss chart. Then try 0.03.', notice: 'With giant steps the network keeps jumping over the best weights, so the loss stays high or jumps around. With 0.03 it learns smoothly. A tiny rate like 0.001 is very slow.' }
    ],
    explain: [
      { title: 'A neuron', body: 'A neuron takes some numbers, multiplies each one by its weight, adds them up with a bias, and passes the total through an activation function. On its own, one neuron can only draw a straight line between the colours.' },
      { title: 'Weights', body: 'Weights are the knobs of the network. A big positive weight (thick blue line) means "this input matters a lot". A negative weight (orange line) pushes the other way. At the start the weights are random, so the guesses are random too.' },
      { title: 'Learning = lowering the loss', body: 'Loss tells how wrong the guesses are (0 means perfect). After each small batch of points, the computer works out which way each weight should move to make the loss smaller, and nudges it a little. This is gradient descent. The learning rate is the size of each nudge, like small steps down a hill in thick fog. One epoch is one full round through all the training points.' },
      { title: 'Why XOR needs a hidden layer', body: 'In XOR, blue points sit in two opposite corners and orange points in the other two. Any straight line leaves some points on the wrong side. Hidden neurons each draw their own line, and the next neuron combines them, so together they can carve out the right shape.' },
      { title: 'Activation functions', body: 'ReLU keeps positive numbers and turns negative ones into 0. tanh squeezes any number into −1 to 1, and sigmoid squeezes it into 0 to 1. These bends let the network draw curves. With Linear (no activation), even many layers can only draw a straight line.' },
      { title: 'Overfitting', body: 'A network can memorise its training points instead of learning the real pattern, like a student who mugs up last year\'s answers but fails on a new question paper. You can spot it when training loss is low but test loss is high. Fixes: more data, less noise, a smaller network, or stopping early.' }
    ]
  }
};
/* TEMP: copy en until translations are added */
['hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'].forEach(function (l) { if (!window.APP_CONTENT[l]) window.APP_CONTENT[l] = window.APP_CONTENT.en; });
