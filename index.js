require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

// "in practice, try not to log any sensitive data"
morgan.token('data', req => JSON.stringify(req.body))

app.use(express.json())
app.use(morgan('tiny'))
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :data')
)
app.use(cors())
app.use(express.static('build'))

app.get('/info', (request, response, next) => {
  Person.countDocuments()
    .then(numberOfPeople => {
      const currentTime = new Date()
      response.send(`<p>Phonebook has info for ${numberOfPeople} people</p>
   <p>${currentTime}</p>`)
    })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => {
      response.json(persons)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id)
    .then(person => {
      response.json(person)
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name) {
    const error = new Error('Missing Name Error')
    error.name = 'MissingNameError'
    error.statusCode = 422
    return next(error)
  }

  if (!body.phoneNumber) {
    const error = new Error('Missing Number Error')
    error.name = 'MissingNumberError'
    error.statusCode = 422
    return next(error)
  }

  Person.findOne({ name: body.name }).then(person => {
    if (person) {
      return response.redirect(303, `/api/persons/${person.id}`)
    } else {
      const person = new Person({
        name: body.name,
        number: body.phoneNumber,
      })

      person
        .save()
        .then(savedPerson => {
          response.json(savedPerson)
        })
        .catch(error => next(error))
    }
  })
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  if (!body.phoneNumber) {
    const error = new Error('Missing Number Error')
    error.name = 'MissingNumberError'
    error.statusCode = 422
    return next(error)
  }

  const person = {
    name: body.name,
    number: body.phoneNumber,
  }

  Person.findByIdAndUpdate(request.params.id, person, {
    new: true,
    runValidators: true,
  })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.log(error.message)

  let statusCode = 500
  let errorMessage = 'Wow, something went wrong!'

  if (error.name === 'CastError') {
    statusCode = 400
    errorMessage = 'malformatted id'
  } else if (error.name === 'MissingNameError') {
    statusCode = 422
    errorMessage = 'Missing name'
  } else if (error.name === 'MissingNumberError') {
    statusCode = 422
    errorMessage = 'Missing number'
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    errorMessage = error.message
  }

  response.status(statusCode).send({ error: errorMessage })

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
