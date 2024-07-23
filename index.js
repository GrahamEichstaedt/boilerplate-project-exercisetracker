const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const uri = process.env.MONGO_URI;
const mongoose = require('mongoose');
console.log(`Connected to: ${uri}`)
const bodyParse = require('body-parser');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error(`Error connecting to MongoDB: ${err}`))


const userSchema = new mongoose.Schema({
  name: String
});

const exerciseSchema = new mongoose.Schema({
  username: userSchema,
  date: Date,
  duration: Number,
  description: String
})

const logSchema = new mongoose.Schema({
  username: userSchema,
  count: Number,
  log: [exerciseSchema]
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
const Log = mongoose.model('Log', logSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/users', (req, res) => {
  const username = req.body['username'];
  const newUser = new User({
    name: username
  });

  newUser.save()
  .then(savedUser => console.log(`User Saved: ${savedUser}`))
  .catch((error) => console.error(`Uh oh! Error: ${error}`));
  
  res.json(newUser);
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.body[':_id'];
  const date = req.body['date'];
  const duration = req.body['duration'];
  const description = req.body['description'];

  console.log(`Variables:\nuserId: ${userId}\ndate: ${date}\nduration: ${duration}\ndescription: ${description}`)

  try {
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).json({error: 'User not found'});
    }
    // console.log(`USER: ${user}`)
    const name = user.name;
    // console.log(`NAME : ${name}`)
    const newExercise = new Exercise({
      _id: userId,
      username: name,
      date: date.toString(),
      duration: duration,
      description: description
    });

    newExercise.save()
    .then( savedExercise => console.log(`Exercise Saved: ${savedExercise}`))
    .catch( error => console.error(`Uh oh! Error: ${error}`));


    // console.log(`NAME: ${name}`)
    // res.json(newExercise);
    res.json({
      _id: userId,
      username: name,
      date: date,
      duration: duration,
      description: description
    });
  }
  catch(error) {
    console.error(error);
    res.status(500).json({error: `Ruh roh: ${error}`});
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})



