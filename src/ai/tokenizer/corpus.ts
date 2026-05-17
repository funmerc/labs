export type CorpusEntry = {
  key: string
  name: string
  blurb: string
  text: string
}

const STORIES = `
The little cat sat on the mat. The little cat saw a big dog.
The big dog ran to the cat. The cat ran up the tree.
The big dog looked up at the cat. The little cat hid in the tree.
A small bird flew over the tree. The cat saw the small bird.
The bird sang a song. The dog barked at the bird. The bird flew away.
The cat came down from the tree. The dog and the cat ran home.
The little cat slept on the mat. The big dog slept by the door.
The next day the cat went out. The dog went out with the cat.
They saw a small mouse. The mouse ran fast. The cat ran after the mouse.
The dog ran after the cat. The mouse ran into a hole.
The cat sat by the hole. The dog sat by the cat.
A boy came home. The boy played with the dog. The boy played with the cat.
The boy and the dog and the cat all sat on the mat. The little cat slept.
The big dog slept. The boy slept too. The little bird sang in the tree.
A girl gave a ball to the boy. The boy threw the ball. The dog ran for the ball.
The cat watched the dog run. The girl watched the cat. The boy watched the girl.
They all laughed. The little cat purred. The big dog wagged. The boy smiled.
The girl ran home. The boy ran home. The dog and the cat went inside.
Inside the house it was warm. The cat sat on a chair. The dog sat on the floor.
A man read a book. A woman cooked food. The boy ate the food. The girl ate the food.
The dog ate from a bowl. The cat ate from a bowl. They were happy.
`

const PROSE = `
A quiet morning in the small town. The sun came up over the hills and lit the rooftops one by one.
A baker opened the front door of the shop. The smell of fresh bread floated out into the street.
People walked past with coffee in their hands. Some of them stopped to buy a loaf.
Others kept walking, busy with their own thoughts about the day ahead.
Across the road, a teacher unlocked the gate to the school. A handful of children waited outside.
They talked about a game they had played the day before. The teacher smiled at them.
She told them to come inside soon. The bell would ring in a few minutes.
On the corner, an old man sold flowers from a wooden cart. The flowers were yellow and red and white.
A young woman bought a small bunch and walked away with them tucked under her arm.
A bus stopped at the curb. Several people stepped off and walked in different directions.
The driver waved at a friend across the street. He had been driving the same route for many years.
By midday the streets were full. The cafe was busy. The bakery was almost out of bread.
The teacher stood at the front of the classroom. The children were learning to read.
They sounded out the letters slowly. They put the letters together into words.
They put the words together into short sentences. They smiled when they got one right.
Outside, the day kept moving. The sun rose higher and then began to fall again.
In the evening, the lights came on in every window. The town settled into quiet again.
`

const CODE = `
function getUserName(user) {
  if (!user) {
    return ''
  }
  return user.name
}

function getUserEmail(user) {
  if (!user) {
    return ''
  }
  return user.email
}

function getUserAge(user) {
  if (!user) {
    return 0
  }
  return user.age
}

function setUserName(user, name) {
  user.name = name
  return user
}

function setUserEmail(user, email) {
  user.email = email
  return user
}

function createUser(name, email, age) {
  const user = {}
  user.name = name
  user.email = email
  user.age = age
  return user
}

function findUserByName(users, name) {
  for (const user of users) {
    if (user.name === name) {
      return user
    }
  }
  return null
}

function findUserByEmail(users, email) {
  for (const user of users) {
    if (user.email === email) {
      return user
    }
  }
  return null
}

function listUserNames(users) {
  const names = []
  for (const user of users) {
    names.push(user.name)
  }
  return names
}
`

export const CORPORA: CorpusEntry[] = [
  {
    key: 'stories',
    name: 'Little stories',
    blurb: 'Short repetitive English. Lots of common words like "the" and "cat", so merges show up quickly.',
    text: STORIES.trim(),
  },
  {
    key: 'prose',
    name: 'Mixed prose',
    blurb: 'A few paragraphs of everyday English with more varied vocabulary.',
    text: PROSE.trim(),
  },
  {
    key: 'code',
    name: 'JavaScript code',
    blurb: 'A handful of similar functions. Watch identifiers like "user" and "function" emerge as merges.',
    text: CODE.trim(),
  },
]

export function getCorpus(key: string): CorpusEntry {
  const entry = CORPORA.find((candidate) => candidate.key === key)
  if (!entry) {
    return CORPORA[0]
  }
  return entry
}
