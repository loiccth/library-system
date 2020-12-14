import React, { useState } from 'react'
import axios from 'axios'
import url from '../../../../settings/api'
import DateFnsUtils from '@date-io/date-fns'
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Checkbox from '@material-ui/core/Checkbox'
import Typography from '@material-ui/core/Typography'
import AutorenewIcon from '@material-ui/icons/Autorenew'
import PriorityHighIcon from '@material-ui/icons/PriorityHigh'
import Tooltip from '@material-ui/core/Tooltip'
import { Button, Toolbar, Container, Grid } from '@material-ui/core'
import Snackbar from '@material-ui/core/Snackbar'
import Alert from '@material-ui/lab/Alert'
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers'

const DueBooks = (props) => {
    const classes = useStyles()
    const [check, setCheck] = useState(false)
    const [snackbar, setSnackbar] = useState({ type: null })
    const [open, setOpen] = useState(false)
    const [selectedDateFrom, setSelectedDateFrom] = useState(new Date())
    const [selectedDateTo, setSelectedDateTo] = useState(new Date())

    const handleDateChangeFrom = (date) => {
        setSelectedDateFrom(date)
        props.getNewDueBooks(date, selectedDateTo)
    }

    const handleDateChangeTo = (date) => {
        setSelectedDateTo(date)
        props.getNewDueBooks(selectedDateFrom, date)
    }

    const handleClick = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const handleOnClick = () => {
        axios.post(`${url}/users/notify`, { type: 'due', books: props.dueBooks }, { withCredentials: true })
            .then(result => {
                setSnackbar({
                    type: 'success',
                    msg: `Success! ${result.data.length} notification(s) sent.`
                })
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
        props.handleUncheckAllDue()
        setCheck(false)
    }

    const handleCheckAll = (e) => {
        setCheck(e.target.checked)
        props.handleCheckAllDue(e)
    }

    return (
        <React.Fragment>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert elevation={6} severity={snackbar.type === 'success' ? 'success' : 'warning'} onClose={handleClose}>
                    {snackbar.msg}
                </Alert>
            </Snackbar>
            <TableContainer component={Paper}>
                <Container className={classes.table}>
                    <Grid container justify="flex-end" spacing={3}>
                        <Grid item className={classes.title}>
                            <Toolbar>
                                <Typography variant="h6">Due Books</Typography>
                            </Toolbar>
                        </Grid>
                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                            <Grid item xs={4} sm={4} md={4} lg={2}>
                                <DatePicker
                                    margin="dense"
                                    color="primary"
                                    label="From"
                                    format="dd/MM/yyyy"
                                    name="from"
                                    value={selectedDateFrom}
                                    onChange={handleDateChangeFrom}
                                    maxDate={selectedDateTo}
                                    disablePast
                                />
                            </Grid>
                            <Grid item xs={4} sm={4} md={4} lg={2}>
                                <DatePicker
                                    margin="dense"
                                    color="primary"
                                    label="To"
                                    format="dd/MM/yyyy"
                                    name="to"
                                    value={selectedDateTo}
                                    onChange={handleDateChangeTo}
                                    minDate={selectedDateFrom}
                                    disablePast
                                />
                            </Grid>
                        </MuiPickersUtilsProvider>
                    </Grid>
                </Container>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Checkbox checked={check} onChange={handleCheckAll} />
                            </TableCell>
                            <TableCell>MemberID</TableCell>
                            <TableCell>Book Details</TableCell>
                            <TableCell>Borrow Details</TableCell>
                            <TableCell>Flag(s)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {props.dueBooks.map(row => (
                            <TableRow key={row._id}>
                                <TableCell component="th" scope="row">
                                    <Checkbox value={row._id} checked={row.checked} onChange={props.handleCheckDue} />
                                </TableCell>
                                <TableCell>
                                    {row.userid}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" display="block">Title: {row.title}</Typography>
                                    <Typography variant="caption" display="block">ISBN: {row.isbn}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" display="block">Borrow: {row.isHighDemand ? new Date(row.borrowDate).toLocaleString() : new Date(row.borrowDate).toLocaleDateString()}</Typography>
                                    <Typography variant="caption" display="block">Due: {row.isHighDemand ? new Date(row.dueDate).toLocaleString() : new Date(row.dueDate).toLocaleDateString()}</Typography>
                                    <Typography variant="caption" display="block">Renews: {row.renews}</Typography>
                                </TableCell>
                                <TableCell>
                                    {row.renews === 3 &&
                                        <Tooltip title="Max Renews" arrow>
                                            <AutorenewIcon />
                                        </Tooltip>
                                    }
                                    {row.isHighDemand &&
                                        <Tooltip title="High Demand" arrow>
                                            <PriorityHighIcon />
                                        </Tooltip>
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Container className={classes.button}>
                    <Button variant="outlined" onClick={handleOnClick} color="primary">Send Reminder</Button>
                </Container>
            </TableContainer>
        </React.Fragment>
    )
}

const useStyles = makeStyles(theme => ({
    table: {
        minWidth: 650,
        maxWidth: '80%',
        margin: 'auto'
    },
    button: {
        minWidth: 650,
        maxWidth: '80%',
        margin: 'auto',
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    },
    title: {
        flex: 1
    }
}))

export default DueBooks