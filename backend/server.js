const app = require('./app')
const mongoose = require('mongoose')

const port = process.env.PORT
const uri = process.env.ATLAS_URI

mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).catch(() => console.log("MongoDB database connection failed"))
const connection = mongoose.connection
connection.once('open', () => {
    console.log("MongoDB database connection established successfully")
    // If connection is successful with MongoDB
    // Run cronjobs
    require('./cronjob/expireReservations')
    require('./cronjob/highDemand')
    require('./cronjob/expiredContractsPT')
    require('./cronjob/dueNotification')
    require('./cronjob/publicHolidays')
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})