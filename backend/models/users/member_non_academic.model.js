const mongoose = require('mongoose')
const User = require('./user.base')
const Borrow = require('../transactions/borrow.model')
const Reserve = require('../transactions/reserve.model')
const Book = require('../book.model')
const Setting = require('../setting.model')

const Schema = mongoose.Schema

const memberNASchema = new Schema()

memberNASchema.methods.borrow = async function (bookid, res) {
    const bookBorrowed = await Borrow.findOne({ bookid, userid: this._id, archive: false })

    if (bookBorrowed !== null) return res.json({ 'error': 'Cannot borrow multiple copies of the same book' })
    else {
        const date = new Date()
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const numOfBooksBorrowed = await Borrow.countDocuments({ userid: this._id, createdAt: { $gte: firstDay, $lte: lastDay } })
        const bookLimit = await Setting.findOne({ setting: 'NONACCADEMIC_BORROW' })

        if (numOfBooksBorrowed >= parseInt(bookLimit.option)) return res.json({ 'error': 'Cannot borrow more than 2 books in a month' })
        else {
            const now = new Date()
            const bookReserved = await Reserve.findOne({ bookid, userid: this._id, archive: false, expireAt: { $gte: now } })

            if (bookReserved !== null) {
                bookReserved.archive = true
                bookReserved.save().catch(err => console.log(err))

                Book.findOne({ _id: bookid })
                    .then(async book => {
                        if (book.reservation[0].userid.toString() === this._id.toString()) {
                            for (let i = 0; i < book.copies.length; i++) {
                                if (book.copies[i].availability === 'onhold') {
                                    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                    book.noOfBooksOnLoan = book.noOfBooksOnLoan + 1
                                    book.copies[i].availability = 'onloan'
                                    book.copies[i].borrower = {
                                        userid: this._id,
                                        borrowAt: Date(),
                                        dueDate,
                                        renews: 0
                                    }
                                    book.reservation.splice(0, 1)
                                    await book.save().catch(err => console.log(err))

                                    const newBorrow = new Borrow({
                                        userid: this._id,
                                        bookid,
                                        copyid: book.copies[i]._id,
                                        dueDate,
                                        isHighDemand: book.isHighDemand
                                    })
                                    await newBorrow.save().then(() => {
                                        return res.sendStatus(201)
                                    }).catch(err => console.log(err))
                                    break
                                }
                            }
                        }
                        else res.json({ 'error': 'User is not first in reservation queue' })
                    })
            }
            else {
                Book.findOne({ _id: bookid })
                    .then(async book => {
                        let bookAvailable = false
                        for (let i = 0; i < book.copies.length; i++) {
                            if (book.copies[i].availability === 'available') {
                                bookAvailable = true
                                const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
                                    isHighDemand: book.isHighDemand
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
}

const MemberNA = User.discriminator('MemberNA', memberNASchema)

module.exports = MemberNA