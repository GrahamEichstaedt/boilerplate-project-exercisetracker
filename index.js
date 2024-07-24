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
  username: String
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


/**
 * 
 * @param {String} dateString 
 * @returns String
 */
const formatDateString = dateString => dateString.slice(0, dateString.indexOf('T'));


/**
 * Create new user
 */
app.post('/api/users', (req, res) => {
  const username = req.body['username'];
  const newUser = new User({
    username: username
  });

  newUser.save()
  .then(savedUser => console.log(`User Saved: ${savedUser}`))
  .catch((error) => console.error(`Uh oh! Error: ${error}`));
  
  res.json(newUser);
});

/**
 * Retrieve list of all users
 */
app.get('/api/users', (req, res) => {

  let allUsers = [];
  User.find()
  .then((data) => {
    console.log(data);
    res.json(data);
  })
  .catch(error => console.error(`Error finding users: ${error}`));

})

/**
 * Endpoint to delete all users
 */
app.delete('/api/users/delete', async (req, res) => {
  try {
    await mongoose.connection.db.dropCollection('users'); 
    console.log('User collection dropped.');
    res.json({ message: 'User collection dropped.' });
  } catch (error) {
    console.error('Error dropping collection:', error);
    res.status(500).json({ error: 'Failed to drop collection.' }); 
  }
});


/**
 * Endpoint to allow client access to wipe database
 */
app.get('/api/users/delete', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Delete Users Confirmation</title>
      </head>
      <body>
        <h1>Delete All Users</h1>
        <button onclick="confirmDelete()">Delete</button>

        <script>
          function confirmDelete() {
            if (confirm('Are you sure you want to delete ALL users? This cannot be undone.')) {
              fetch('/api/users/delete', { method: 'DELETE' })
                .then(response => {
                  if (response.ok) {
                    alert('All users deleted successfully.');
                  } else {
                    alert('An error occurred while deleting users.');
                  }
                })
                .catch(error => console.error('Network error:', error));
            } else {
              alert('Delete cancelled.');
            }
          }
        </script>
      </body>
    </html>
  `);
});

/**
 * POSTS a new exercises that is logged under a user.
 * The JSON Response should look like:
 * {
 *  _id: string,
 * username: string,
 * date: string,
 * duration: number,
 * description: string
 * }
 */
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.body[':_id'];
  const date = req.body['date'] || new Date();
  let duration = req.body['duration'];
  const description = req.body['description'];

  console.log(`Variables:\nuserId: ${userId}\ndate: ${date}\nduration: ${duration}\ndescription: ${description}`)

  try {
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).json({error: 'User not found'});
    }
    console.log(`The current user is: ${user}`)
    // console.log(`USER: ${user}`)
    // const name = user.name;
    // console.log(`NAME : ${name}`)
    const newExercise = new Exercise({
      _id: userId,
      username: user.username,
      date: formatDateString(date.toString()),
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
      username: user.username,
      date: date.toDateString(),
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

