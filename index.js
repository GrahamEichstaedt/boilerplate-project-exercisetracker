// const express = require('express');
// const app = express();
// const cors = require('cors');
// require('dotenv').config();
// const mongoose = require('mongoose');
// const { ObjectId } = mongoose.Types;


// // Connect to MongoDB
// mongoose.connect(process.env['MONGO_URI'], { dbName: "exerciseTracker" });

// // Define schemas
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
// });

// const exerciseSchema = new mongoose.Schema({
//   user: { type: ObjectId, ref: 'User', required: true },
//   description: { type: String, required: true },
//   duration: { type: Number, required: true },
//   date: { type: Date, default: Date.now }
// });

// // Define models
// const User = mongoose.model('User', userSchema);
// const Exercise = mongoose.model('Exercise', exerciseSchema);

// app.use(cors());
// app.use(express.static('public'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/views/index.html');
// });

// // Create user
// app.post('/api/users', async (req, res) => {
//   const { username } = req.body;
//   try {
//     const user = await User.create({ username });
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message }); // Handle duplicate username error (if applicable)
//   }
// });

// // Get all users
// app.get('/api/users', async (req, res) => {
//   try {
//     const users = await User.find({}, { username: 1, _id: 1 }); // Projection to get only username and _id
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Add exercise to user
// app.post('/api/users/:_id/exercises', async (req, res) => {
//   const userId = req.params._id;
//   const { description, duration, date } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const exerciseDate = date ? new Date(date) : new Date();

//     const exercise = await Exercise.create({
//       user: userId,
//       description,
//       duration,
//       date: exerciseDate,
//     });

//     // Manually construct the response object with ONLY the required fields
//     const responseUser = {
//       _id: user._id.toString(), // Convert ObjectId to string
//       username: user.username,
//       date: exerciseDate.toDateString(),
//       duration: exercise.duration,
//       description: exercise.description
//     };

//     res.json(responseUser);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// // Get user exercise log
// app.get('/api/users/:_id/logs', async (req, res) => {
//   const userId = req.params._id;
//   const { from, to, limit } = req.query;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     let query = { user: userId };

//     if (from || to) {
//       query.date = {};
//       if (from) query.date.$gte = new Date(from);
//       if (to) query.date.$lte = new Date(to);
//     }
   

//     let exercises = await Exercise.find(query, { _id: 0, __v: 0 })
//                                  .sort({ date: 'asc' })
//                                  .limit(parseInt(limit) || 500) // Default to 500 if limit not specified

//     const logs = exercises.map(ex => ({
//         description: ex.description,
//         duration: ex.duration,
//         date: ex.date.toDateString() 
//     }));

//     res.json({
//       username: user.username,
//       count: exercises.length,
//       _id: user._id,
//       log: logs
//     }); 
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// const listener = app.listen(process.env.PORT || 3000, () => {
//   console.log('Your app is listening on port ' + listener.address().port)
// })

const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))

// setup bodyparser
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:false}))

// Connect to Atlas-mongoDB Database
const mySecret = process.env['MONGO_URI']
mongoose = require('mongoose')
mongoose.connect(mySecret, {useNewUrlParser:true, useUnifiedTopology:true})
mongoose.set('useFindAndModify', false);

// mongose schemas 
const userSchema = mongoose.Schema({
  username: {type: String, required:true},
})

const exerciseSchema = mongoose.Schema({
  username: {type: String, required:true},
  description: {type: String, required:true},
  duration: {type: Number, required:true},
  date: {type: Date, required:true},
})

// Instantiation of Model
const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)


//Middleware
function logger(req, res, next){
  console.log(req.method, req.path, req.params, req.query, req.body)
  next()
}
app.use(logger)


// Endpoints
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get("/api/users", async(req, res) => {
  try{
    return res.json( await User.find({}))

  }catch(error){
    console.error(error)
    return res.json({error: "invalid"})
  }
})


app.post("/api/users", async(req, res)=>{

  try {
    const existing = await User.findOne({username:req.body.username}).select({__v:0})
    if (!existing) {
      const newUser = await User.create({username:req.body.username})
      return res.json({username:newUser.username, _id:newUser._id})
    }
    return res.json({username:existing.username, _id:existing._id})
  } catch (error) {
    console.error(error)
    return res.json({error:"Operation failed"})
  }

})

app.post("/api/users/:_id/exercises", async(req, res) =>{
  try {
    const user = await User.findById(req.body[":_id"] || req.params._id)
    if (!user) return res.json({error:"user doesn't exist"})
    const newExercise = await Exercise.create({
      username:user.username,
      description:req.body.description,
      duration: req.body.duration, 
      date: (req.body.date)? new Date(req.body.date) : new Date(),
      })

    return res.json({
      _id:user._id,
      username:user.username,
      date: newExercise.date.toDateString(),
      duration: newExercise.duration,
      description:newExercise.description,

    })
  } catch (error) {
    console.error(error)
    return res.json({error:"Operation failed"})
  }
})

// http://localhost:3000/api/users/65dc22ad6af64791b7fd8bad/logs?from=2024-01-30&to=2024-03-01
// http://localhost:3000/api/users/65dc22ad6af64791b7fd8bad/logs?from=2024-01-30&to=2024-03-01&limit=2

app.get("/api/users/:_id/logs", async(req, res)=>{
  try {
    let result = {}
    let consultation = {}
    let from = null
    let to = null

    const user = await User.findById(req.params._id)

    consultation.username=user.username
    result._id=user._id
    result.username=user.username

    if (req.query.from){
      from = new Date (req.query.from+ "T00:00:00.000-06:00") 
      consultation.date={...consultation.date, $gte:from}
      result.from = from.toDateString()
      // console.log(result.from)
    }

    if (req.query.to){
      to = new Date (req.query.to+"T00:00:00.000-06:00")
      consultation.date={...consultation.date, $lte:to}
      result.to = to.toDateString()
      // console.log(result.to)
    }
    console.log(consultation)

    // const from = (req.query.from)? new Date(req.query.from) : null
    // const to   = (req.query.to)? new Date(req.query.to)     : null
    const log = await Exercise.find(consultation).limit(parseInt(req.query.limit)).select({_id:0, username:0, __v:0})

    let pseudoLog = []

    for(let entry of log){
      pseudoLog.push({description:entry.description, duration:entry.duration, date:entry.date.toDateString()})
    }

    // console.log(copycat)

    // console.log(log)
    result.count=log.length
    result.log=pseudoLog
    // return res.json({_id:user._id, username:user.username, from:from.toDateString(), to:to.toDateString(), count:log.length, log:pseudoLog })
    return res.json(result)

  } catch (error) {
    console.error(error)
    return res.json({error:"Operation failed"})
  }




})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
