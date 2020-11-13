const mongoose = require('mongoose')
const User = require('./user.base')
const Borrow = require('../transactions/borrow.model')
const Book = require('../book.model')
const Setting = require('../setting.model')

const Schema = mongoose.Schema

const memberASchema = new Schema()

memberASchema.methods.borrow = async function (bookid, res) {
    const bookBorrowed = await Borrow.findOne({ bookid, userid: this._id, archive: false })

    if (bookBorrowed !== null) return res.json({ 'error': 'Cannot borrow multiple copies of the same book' })
    else {
        const numOfBooksBorrowed = await Borrow.countDocuments({ userid: this._id, archive: false })
        const bookLimit = await Setting.findOne({ setitng: 'ACCADEMIC_BORROW' })

        if (numOfBooksBorrowed >= parseInt(bookLimit.option)) return res.json({ 'error': 'Cannot borrow more than 5 books at the same time' })
        else {
            Book.findOne({ _id: bookid })
                .then(async book => {
                    let bookAvailable = false
                    for (let i = 0; i < book.copies.length; i++) {
                        if (book.copies[i].availability === 'available') {
                            bookAvailable = true
                            const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                            book.noOfBooksOnLoan = book.noOfBooksOnLoan + 1
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
                            })
                            await newBorrow.save().then(() => {
                                return res.sendStatus(201)
                            }).catch(err => console.log(err))
                            break
                        }
                    }
                    if (!bookAvailable) res.json({ 'error': 'No books available to loan' })
                })
        }
    }
}

const MemberA = User.discriminator('MemberA', memberASchema)

module.exports = MemberA