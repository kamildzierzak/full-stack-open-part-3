require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

// "in practice, try not to log any sensitive data"
morgan.token('data', (req, res) => JSON.stringify(req.body))

app.use(express.json())
app.use(morgan('tiny'))
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :data')
)
app.use(cors())
app.use(express.static('build'))

app.get('/info', (request, response) => {
  const numberOfPeople = persons.length || 0 //TODO fix
  const currentTime = new Date()
  response.send(`<p>Phonebook has info for ${numberOfPeople} people</p>
  <p>${currentTime}</p>`)
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response) => {
  const id = request.params.id
  Person.findById(id).then(person => {
    response.json(person)
  })
})

app.post('/api/persons', (request, response) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({
      error: 'name is missing',
    })
  }

  if (!body.phoneNumber) {
    return response.status(400).json({
      error: 'number is missing',
    })
  }

  // if (persons.find(person => person.name === body.name)) {
  //   return response.status(400).json({
  //     error: 'name must be unique',
  //   })
  // }

  const person = new Person({
    name: body.name,
    number: body.phoneNumber,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
})

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  persons = persons.filter(person => person.id !== id)

  response.status(204).end()
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
