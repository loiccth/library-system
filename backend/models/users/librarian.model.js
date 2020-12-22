const mongoose = require('mongoose')
const axios = require('axios')
const User = require('./user.base')
const Book = require('../book.model')
const Borrow = require('../transactions/borrow.model')
const Reserve = require('../transactions/reserve.model')
const Payment = require('../payment.model')
const Setting = require('../setting.model')
const csv = require('csv-parser')
const fs = require('fs')
const transporter = require('../../config/mail.config')

const Schema = mongoose.Schema

const librarianSchema = new Schema()

librarianSchema.methods.borrow = async function (bookid, libraryOpenTime, res) {
    const bookBorrowed = await Borrow.findOne({ bookid, userid: this._id, status: 'active' })

    if (bookBorrowed !== null) return res.json({ 'message': 'Cannot borrow multiple copies of the same book' })
    else {
        const date = new Date()
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const numOfBooksBorrowed = await Borrow.countDocuments({ userid: this._id, createdAt: { $gte: firstDay, $lte: lastDay } })
        let bookLimit = await Setting.findOne({ setting: 'USER' })

        for (let i = 0; i < bookLimit.options.length; i++) {
            if (bookLimit.options[i].id === 'non_academic_borrow_count') {
                bookLimit = bookLimit.options[i].value
                break
            }
        }

        if (numOfBooksBorrowed >= bookLimit) return res.json({ 'message': 'Cannot borrow more than 2 books in a month' })
        else {
            const now = new Date()
            const bookReserved = await Reserve.findOne({ bookid, userid: this._id, status: 'active', expireAt: { $gte: now } })

            Book.findById(bookid)
                .then(async book => {
                    let dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    if (book.isHighDemand === true) {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 2)
                        tomorrow.setHours(0, 0, 0, 0)

                        if (libraryOpenTime === 0) return res.json({ 'message': 'Cannot issue high demand book, library is closed tomorrow.' })
                        else dueDate = tomorrow.setSeconds(libraryOpenTime + 1800)
                    }

                    if (bookReserved !== null) {
                        bookReserved.status = 'archive'
                        bookReserved.save().catch(err => console.log(err))

                        for (let j = 0; j < book.reservation.length; j++) {
                            if (book.reservation[j].userid.toString() === this._id.toString()) {
                                for (let i = 0; i < book.copies.length; i++) {
                                    if (book.copies[i].availability === 'onhold') {
                                        book.noOfBooksOnLoan++
                                        book.noOfBooksOnHold++
                                        book.copies[i].availability = 'onloan'
                                        book.copies[i].borrower = {
                                            userid: this._id,
                                            borrowAt: Date(),
                                            dueDate,
                                            renews: 0
                                        }
                                        book.reservation.splice(j, 1)
                                        await book.save().catch(err => console.log(err))

                                        const newBorrow = new Borrow({
                                            userid: this._id,
                                            bookid,
                                            copyid: book.copies[i]._id,
                                            dueDate,
                                            isHighDemand: book.isHighDemand
                                        })
                                        await newBorrow.save().then(() => {
                                            return res.status(201).json({
                                                title: book.title,
                                                dueDate: new Date(dueDate)
                                            })
                                        }).catch(err => console.log(err))
                                        break
                                    }
                                }
                                break
                            }
                            else res.json({ 'message': 'There are other users infront of the queue.' })
                        }
                    }
                    else {
                        if (book.copies.length > book.noOfBooksOnLoan + book.noOfBooksOnHold)
                            for (let i = 0; i < book.copies.length; i++) {
                                if (book.copies[i].availability === 'available') {
                                    book.noOfBooksOnLoan++
                                    book.copies[i].availability = 'onloan'
                                    book.copies[i].borrower = {
                                        userid: this._id,
                                        borrowAt: Date(),
                                        dueDate,
                                        renews: 0
                                    }
                                    await book.save().catch(err => console.log(err))

                                    const newBorrow = new Borrow({
                                        userid: this._id,
                                        bookid,
                                        copyid: book.copies[i]._id,
                                        dueDate,
                                        isHighDemand: book.isHighDemand
                                    })
                                    await newBorrow.save().then(() => {
                                        return res.status(201).json({
                                            title: book.title,
                                            dueDate: new Date(dueDate)
                                        })
                                    }).catch(err => console.log(err))
                                    break
                                }
                            }
                        else res.json({ 'message': 'No books available to loan' })
                    }
                })
        }
    }
}

librarianSchema.methods.addBook = async function (book, res) {
    const { location, campus, isbn, noOfCopies } = book

    const googleBookAPI = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)

    if (googleBookAPI.data.totalItems === 0) res.status(404).json({ 'error': 'Book not found.' })
    else {
        Book.findOne({ isbn })
            .then(book => {
                const { title, authors, publisher, publishedDate, categories, description, pageCount, imageLinks } = googleBookAPI.data.items[0].volumeInfo
                if (book === null) {
                    let image = imageLinks.thumbnail
                    let secureImg = image.replace('http:', 'https:')

                    const newBook = new Book({
                        title,
                        author: authors,
                        isbn,
                        publisher,
                        publishedDate,
                        categories,
                        description,
                        noOfPages: pageCount,
                        thumbnail: secureImg,
                        location,
                        campus,
                        copies: []
                    })
                    for (let i = 0; i < noOfCopies; i++)
                        newBook.copies.push({})
                    newBook.save()
                        .then(() => res.status(201).json({ 'title': title }))
                        .catch(err => res.json({ 'error': err.message }))
                }
                else {
                    for (let i = 0; i < noOfCopies; i++)
                        book.copies.push({})
                    book.save()
                        .then(() => res.status(201).json({ 'title': title }))
                        .catch(err => res.json({ 'error': err._message }))
                }
            })
            .catch(err => console.log(err))
    }
}

librarianSchema.methods.addBookCSV = function (file, res) {
    let success = []
    let fail = []

    const stream = fs.createReadStream(file)
        .pipe(csv())
        .on('data', async (book) => {
            stream.pause()
            const { location, campus, isbn, noOfCopies } = book

            const googleBookAPI = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)

            if (googleBookAPI.data.totalItems === 0) {
                fail.push(isbn + ' - Invalid ISBN')
            }
            else {
                await Book.findOne({ isbn })
                    .then(async (book) => {
                        const { title, authors, publisher, publishedDate, categories, description, pageCount, imageLinks } = googleBookAPI.data.items[0].volumeInfo
                        if (book === null) {
                            let image = imageLinks.thumbnail
                            let secureImg = image.replace('http:', 'https:')

                            const newBook = new Book({
                                title,
                                author: authors,
                                isbn,
                                publisher,
                                publishedDate,
                                categories,
                                description,
                                noOfPages: pageCount,
                                thumbnail: secureImg,
                                location,
                                campus,
                                copies: []
                            })
                            for (let i = 0; i < noOfCopies; i++)
                                newBook.copies.push({})
                            newBook.save()
                                .then(() => success.push(`${title} (${isbn})`))
                                .catch(err => fail.push(`${title} (${isbn}) - ${err.message}`))
                        }
                        else {
                            for (let i = 0; i < noOfCopies; i++)
                                book.copies.push({})
                            await book.save()
                                .then(() => success.push(`${title} (${isbn})`))
                                .catch(err => fail.push(`${title} (${isbn}) - ${err.message}`))
                        }
                    })
                    .catch(err => console.log(err))
            }
            stream.resume()
        })
        .on('end', () => {
            setTimeout(() => {
                res.status(201).json({
                    success,
                    fail
                })
            }, 1000)
        })
}

librarianSchema.methods.editBook = function (bookDetails, res) {
    const { isbn } = bookDetails

    Book.findOne({ isbn })
        .then(book => {
            if (book === null) return res.sendStatus(404)
            else {
                const { title, publisher, publishedDate, description, noOfPages, location, campus } = bookDetails
                const author = bookDetails.author.split(',').map(item => {
                    return item.trim()
                })
                const categories = bookDetails.categories.split(',').map(item => {
                    return item.trim()
                })

                book.title = title
                book.publisher = publisher
                book.publishedDate = publishedDate
                book.description = description
                book.noOfPages = noOfPages
                book.location = location
                book.campus = campus
                book.author = author
                book.categories = categories

                book.save().then(() => res.sendStatus(200))
            }
        })
        .catch(err => console.log(err))
}

librarianSchema.methods.returnBook = async function (isbn, userid, res) {
    User.findOne({ userid })
        .then(user => {
            if (user) {
                Book.findOne({ isbn })
                    .then(async book => {
                        if (book) {
                            Borrow.findOne({ bookid: book._id, userid: user._id, status: 'active' })
                                .then(async borrow => {
                                    if (borrow) {

                                        let bookSettings = await Setting.findOne({ setting: 'BOOKS' })
                                        let numOfDays
                                        let finePerDay
                                        let timeOnHold
                                        let paymentID

                                        for (let i = 0; i < bookSettings.options.length; i++) {
                                            if (bookSettings.options[i].id === 'fine_per_day') {
                                                finePerDay = bookSettings.options[i].value
                                            }
                                            else if (bookSettings.options[i].id === 'fine_per_day') {
                                                timeOnHold = bookSettings.options[i].value
                                            }
                                        }

                                        borrow.returnedOn = Date()
                                        borrow.status = 'archive'

                                        const now = new Date(new Date().toDateString())
                                        const borrowDate = new Date(borrow.dueDate.toDateString())
                                        numOfDays = ((now.getTime() - borrowDate.getTime()) / (24 * 60 * 60 * 1000))

                                        if (borrow.isHighDemand) {
                                            if (new Date() > new Date(borrow.dueDate))
                                                numOfDays++
                                        }

                                        if (numOfDays > 0) {

                                            const newPayment = new Payment({
                                                userid: borrow.userid,
                                                bookid: borrow.bookid,
                                                copyid: borrow.copyid,
                                                numOfDays,
                                                pricePerDay: finePerDay
                                            })

                                            paymentID = await newPayment.save().catch(err => console.log(err))
                                        }
                                        borrow.save().catch(err => console.log(err))

                                        book.noOfBooksOnLoan--
                                        for (let i = 0; i < book.copies.length; i++) {
                                            if (book.copies[i].borrower.userid) {
                                                if (book.copies[i].borrower.userid.toString() === borrow.userid.toString()) {
                                                    if (book.reservation.length - book.noOfBooksOnHold > 0) {
                                                        book.copies[i].availability = 'onhold'
                                                        book.noOfBooksOnHold++
                                                        for (let j = 0; j < book.reservation.length; j++) {
                                                            if (book.reservation[j].expireAt === null) {
                                                                const dueDate = new Date(new Date().getTime() + (timeOnHold * 1000))
                                                                book.reservation[j].expireAt = dueDate
                                                                Reserve.findOne({ bookid: borrow.bookid, userid: book.reservation[j].userid, status: 'active' })
                                                                    .then(reserve => {
                                                                        reserve.expireAt = dueDate

                                                                        reserve.save().catch(err => console.log(err))
                                                                    })
                                                                break
                                                                // TODO: Inform next member in reservation queue
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        book.copies[i].availability = 'available'
                                                        book.copies[i].borrower = null
                                                        book.noOfBooksOnLoan--
                                                        break
                                                    }
                                                }
                                            }
                                        }

                                        book.save()
                                            .then(() => {
                                                res.json({
                                                    noOfDaysOverdue: numOfDays,
                                                    finePerDay,
                                                    paymentID: paymentID ? paymentID._id : null
                                                })
                                            })
                                            .catch(err => console.log(err))
                                    }
                                    else
                                        res.status(404).json({ 'error': 'Record not found.' })
                                })
                        }
                        else
                            res.status(404).json({ 'error': 'Book not found.' })
                    })
                    .catch(err => console.log(err))
            }
            else
                res.status(404).json({ 'error': 'MemberID not found.' })
        })

}

librarianSchema.methods.getOverdueBooks = function (res) {
    const now = new Date(new Date().toDateString())

    Borrow.find({ status: 'active', dueDate: { $lt: now } })
        .populate({ path: 'userid', select: 'userid', populate: { path: 'udmid', select: 'email' } })
        .populate('bookid', ['title', 'isbn'])
        .then(books => res.json(books))
        .catch(err => console.log(err))
}

librarianSchema.methods.getDueBooks = function (from, to, res) {
    const now = new Date(new Date(from).toDateString())
    const toDate = new Date(new Date(to).toDateString())
    toDate.setDate(toDate.getDate() + 1)

    Borrow.find({ status: 'active', dueDate: { $gte: now, $lt: toDate } })
        .populate({ path: 'userid', select: 'userid', populate: { path: 'udmid', select: 'email' } })
        .populate('bookid', ['title', 'isbn'])
        .then(books => res.json(books))
        .catch(err => console.log(err))
}

librarianSchema.methods.getReservations = function (res) {
    Reserve.find({ status: 'active', expireAt: { $ne: null } })
        .populate({ path: 'userid', select: 'userid', populate: { path: 'udmid', select: 'email' } })
        .populate('bookid', ['title', 'isbn', 'isHighDemand'])
        .then(books => res.json(books))
        .catch(err => console.log(err))
}

librarianSchema.methods.issueBook = async function (isbn, userid, res) {
    const book = await Book.findOne({ isbn }).select(['_id', 'isHighDemand'])

    let today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay()
    const closeSettings = await Setting.findOne({ setting: 'CLOSING_HOURS' })
    const openSettings = await Setting.findOne({ setting: 'OPENING_HOURS' })
    let libraryOpenTime
    let libraryCloseTime

    switch (dayOfWeek) {
        case 0:
            libraryOpenTime = openSettings.options[6].time
            libraryCloseTime = closeSettings.options[6].time
            break
        case 1:
            libraryOpenTime = openSettings.options[0].time
            libraryCloseTime = closeSettings.options[0].time
            break
        case 2:
            libraryOpenTime = openSettings.options[1].time
            libraryCloseTime = closeSettings.options[1].time
            break
        case 3:
            libraryOpenTime = openSettings.options[2].time
            libraryCloseTime = closeSettings.options[2].time
            break
        case 4:
            libraryOpenTime = openSettings.options[3].time
            libraryCloseTime = closeSettings.options[3].time
            break
        case 5:
            libraryOpenTime = openSettings.options[4].time
            libraryCloseTime = closeSettings.options[4].time
            break
        case 6:
            libraryOpenTime = openSettings.options[5].time
            libraryCloseTime = closeSettings.options[5].time
            break
    }

    const openTime = new Date(today.getTime() + (libraryOpenTime * 1000))
    const closeTime = new Date(today.getTime() + (libraryCloseTime * 1000))

    if (libraryOpenTime === 0 && libraryCloseTime === 0) return res.json({ 'message': 'Library is closed.' })
    else if (new Date() <= openTime || new Date() >= closeTime) return res.json({ 'message': 'Library is closed.' })

    else {
        User.findOne({ userid })
            .then(user => {
                if (!user)
                    res.status(404).json({ 'error': 'MemberID not found.' })
                else
                    if (book) {
                        if (book.isHighDemand) {
                            today.setSeconds(libraryCloseTime - 1800)
                            if (today > new Date()) return res.json({ 'message': 'Too early to issue high demand book.' })
                        }
                        user.borrow(book._id, libraryOpenTime, res)
                    }
                    else
                        res.status(404).json({ 'error': 'Book not found.' })
            })
            .catch(err => console.log(err))

    }
}

librarianSchema.methods.removeBook = function (bookCopies, res) {
    const { copies } = bookCopies
    let count = 0
    Book.findOne({ isbn: bookCopies.isbn })
        .then(book => {

            for (let i = 0; i < copies.length; i++) {
                if (!copies[i].checked)
                    continue
                for (let j = 0; j < book.copies.length; j++) {
                    if (copies[i]._id === book.copies[j]._id.toString()) {
                        book.copies.splice(j, 1)
                        book.removed.push({
                            _id: copies[i]._id,
                            reason: copies[i].reason,
                            createdAt: Date()
                        })
                        count++
                    }
                }
            }

            book.save()
                .then(() => {
                    res.json({ 'noOfBooksRemoved': count })
                })
                .catch(err => console.log(err))
        })
}

librarianSchema.methods.notify = async function (books, type, res) {
    let emailSent = []

    for (let i = 0; i < books.length; i++) {
        if (books[i].checked) {
            const mailRegister = {
                from: 'no-reply@udmlibrary.com',
                to: books[i].email,
                subject: type === 'overdue' ? 'NOTIFY: Book overdue' : 'NOTIFY: Book due',
                text: `Your book titled ${books[i].title} with ISBN ${books[i].isbn} is overdue since ${books[i].dueDate}`
            }
            try {
                await transporter.sendMail(mailRegister)
                emailSent.push(books[i].userid)
            }
            catch (err) {
                console.log(err.message)
            }
        }
    }
    if (emailSent.length === 0) res.status(400).json({ 'error': 'Zero notification sent, no user(s) selected.' })
    else res.json({ 'listOfEmailSent': emailSent })
}

const Librarian = User.discriminator('Librarian', librarianSchema)

module.exports = Librarian