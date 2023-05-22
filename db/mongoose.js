const mongoose = require('mongoose')
// categorySchema = mongoose.model('categories')
// mongoose.Types.ObjectId

mongoose.connect("mongodb+srv://guest:guest123@cluster0-s8l65.gcp.mongodb.net/messageDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
})
