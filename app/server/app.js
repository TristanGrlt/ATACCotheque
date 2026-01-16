const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express()
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const port = 3000

app.get('/', async (req, res) => {
  
  // const user = await prisma.user.create({
  //     data: {
  //       username: "toto",
  //       password: "password123",
  //     },
  // });
  const users = await prisma.user.findMany();
  res.json(users)

})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
