const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api', (req, res) => {
  res.json({ message: 'API is working', status: 'ok' })
})

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`)
  })
}

// Export the app for testing
module.exports = app
