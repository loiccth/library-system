import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import axios from 'axios'
import url from '../../settings/api'
import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    Grid,
    makeStyles,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
    Typography
} from '@material-ui/core'
import FiberNewIcon from '@material-ui/icons/FiberNew'
import PriorityHighIcon from '@material-ui/icons/PriorityHigh'
import Navbar from '../navbar/Navbar'
import Footer from '../navbar/Footer'

const Book = (props) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const classes = useStyles()
    const [book, setBook] = useState(null)
    const [transaction, setTransaction] = useState(null)
    const [open, setOpen] = useState(false)
    const [snackbar, setSnackbar] = useState({ type: null })
    const [openSnack, setOpenSnack] = useState(false)

    const handleClick = () => {
        setOpenSnack(true)
    }

    const handleClose = () => {
        setOpenSnack(false)
    }

    const handleToggle = () => {
        setOpen(!open)
    }

    const handleConfirm = () => {
        setOpen(false)

        if (transaction === null) {
            axios.post(`${url}/books/reserve/${id}`, {}, { withCredentials: true })
                .then(result => {
                    setTransaction('Reserve')
                    setSnackbar({
                        type: 'success',
                        msg: result.data.message
                    })
                    getBook(id)
                })
                .catch(err => {
                    setSnackbar({
                        type: 'warning',
                        msg: err.response.data.error
                    })
                })
                .finally(() => {
                    handleClick()
                })
        }

        else if (transaction === 'Reserve') {
            axios.patch(`${url}/books/cancel_reservation/${id}`, {}, { withCredentials: true })
                .then(() => {
                    setTransaction(null)
                    setSnackbar({
                        type: 'success',
                        msg: 'Book reservation cancelled.'
                    })
                    getBook(id)
                    handleClick()
                })
        }
    }

    const getBook = useCallback((id) => {
        axios.get(`${url}/books/${id}`, { withCredentials: true })
            .then(book => {
                setBook(book.data.book)

                if (book.data.transaction)
                    setTransaction(book.data.transaction)
            })
            .catch(err => {
                if (err.response.status === 404) navigate('/', { replace: true })
            })
    }, [navigate])

    useEffect(() => {
        getBook(id)
    }, [getBook, id])

    if (book === null) return null
    else {
        return (
            <React.Fragment>
                <Navbar user={props.user} darkMode={props.darkMode} handleToggleTheme={props.handleToggleTheme} handleLogout={props.handleLogout} />
                <Snackbar open={openSnack} autoHideDuration={6000} onClose={handleClose}>
                    <Alert elevation={6} severity={snackbar.type === 'success' ? 'success' : 'warning'} onClose={handleClose}>
                        {snackbar.msg}
                    </Alert>
                </Snackbar>
                <Box className={classes.wrapper}>
                    <Box className={classes.bookcontainer}>
                        <Box sx={{ my: 7 }}>
                            <Container component={Paper}>
                                <Grid container spacing={3} className={classes.container}>
                                    <Grid item xs={12} sm={4}>
                                        <img className={classes.thumbnail} src={book.thumbnail} alt="thumbnail" />
                                        <Grid container spacing={3} className={classes.container}>
                                            <Grid item xs={4}>
                                                <Typography variant="body2" align="center">Loan: {book.noOfBooksOnLoan}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="body2" align="center">Reservations: {book.reservation.length}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="body2" align="center">On hold: {book.noOfBooksOnHold}</Typography>
                                            </Grid>
                                            <Grid item xs={12} style={{ textAlign: 'center' }}>
                                                {props.user.isLoggedIn ?
                                                    <React.Fragment>
                                                        {transaction === null && <Button variant="outlined" onClick={handleToggle}>Reserve</Button>}
                                                        {transaction === 'Reserve' && <Button variant="outlined" onClick={handleToggle}>Cancel Reservation</Button>}
                                                        {transaction === 'Borrow' && <Button variant="outlined" disabled>Return Book</Button>}
                                                        <Dialog
                                                            open={open}
                                                            onClose={handleToggle}
                                                            aria-labelledby="alert-dialog-title"
                                                            aria-describedby="alert-dialog-description"
                                                        >
                                                            <DialogContent>
                                                                <DialogContentText id="alert-dialog-description">
                                                                    {transaction === null ? 'Are you sure you want to reserve this book?' : 'Are you sure you want to cancel this reservation?'}
                                                                </DialogContentText>
                                                            </DialogContent>
                                                            <DialogActions>
                                                                <Button onClick={handleToggle} color="secondary">
                                                                    Cancel
                                                            </Button>
                                                                <Button onClick={handleConfirm} autoFocus>
                                                                    Confirm
                                                            </Button>
                                                            </DialogActions>
                                                        </Dialog>
                                                    </React.Fragment>
                                                    :
                                                    <Button variant="outlined" disabled>Reserve</Button>
                                                }
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12} sm={8} >
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Title</TableCell>
                                                    <TableCell><Typography variant="body2">{book.title}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell><Typography variant="body2">{book.description}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>ISBN</TableCell>
                                                    <TableCell><Typography variant="body2">{book.isbn}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Author(s)</TableCell>
                                                    <TableCell><Typography variant="body2">
                                                        {book.author.map((author, index) => (
                                                            <span key={author}>{(index ? ', ' : '') + author}</span>
                                                        ))}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Category</TableCell>
                                                    <TableCell><Typography variant="body2">{book.category}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Number of pages</TableCell>
                                                    <TableCell><Typography variant="body2">{book.noOfPages}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Publisher</TableCell>
                                                    <TableCell><Typography variant="body2">{book.publisher}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Published Date</TableCell>
                                                    <TableCell><Typography variant="body2">{new Date(book.publishedDate).toLocaleDateString()}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Location</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" display="block">{book.location}, {book.campus === 'pam' ? "Swami Dayanand Campus" : "Rose-Hill Campus"}</Typography>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Number of holdings</TableCell>
                                                    <TableCell><Typography variant="body2" display="block">{book.copies.length}</Typography></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell style={{ border: 'none' }}>Flags</TableCell>
                                                    <TableCell style={{ border: 'none' }}>
                                                        <Tooltip title="Recently Added" arrow>
                                                            <FiberNewIcon />
                                                        </Tooltip>
                                                        {book.isHighDemand ?
                                                            <Tooltip title="High Demand" arrow>
                                                                <PriorityHighIcon className={classes.highpriority} />
                                                            </Tooltip>
                                                            : null}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Box>
                    </Box>
                    <Footer />
                </Box>
            </React.Fragment>
        )
    }
}

const useStyles = makeStyles(theme => ({
    container: {
        marginTop: '2em'
    },
    thumbnail: {
        width: '100%',
        maxWidth: '230px',
        margin: 'auto',
        display: 'block'
    },
    highpriority: {
        color: 'red'
    },
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
        [theme.breakpoints.up("sm")]: {
            minHeight: `calc(100vh - 64px)`
        },
        [theme.breakpoints.down("xs")]: {
            minHeight: `calc(100vh - 48px)`
        }
    },
    bookcontainer: {
        flex: 1
    }
}))

Book.propTypes = {
    user: PropTypes.object.isRequired,
    darkMode: PropTypes.bool.isRequired,
    handleToggleTheme: PropTypes.func.isRequired,
    handleLogout: PropTypes.func.isRequired
}

export default Book