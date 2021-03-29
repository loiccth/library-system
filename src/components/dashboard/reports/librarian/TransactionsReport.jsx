import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { CSVLink } from 'react-csv'
import {
    Box,
    Button,
    Container,
    Grid,
    makeStyles,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ThemeProvider,
    Toolbar,
    Typography,
    useTheme
} from '@material-ui/core'
import { LocalizationProvider, DateRangePicker } from '@material-ui/lab'
import AdapterDateFns from '@material-ui/lab/AdapterDateFns'
import { enGB, fr, zhCN, arSA } from 'date-fns/locale'

const localeMap = {
    enUS: enGB,
    frFR: fr,
    zhCN: zhCN,
    arEG: arSA
}

const maskMap = {
    enUS: '__/__/____',
    frFR: '__/__/____',
    zhCN: '__-__-__',
    arEG: '__/__/____'
}

const TransactionsReport = (props) => {
    const csvlink = useRef()
    const classes = useStyles()
    const [date, setDate] = useState([new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()])
    const { t } = useTranslation()
    const theme = useTheme()

    const handleDateUpdate = (date) => {
        setDate(date)
        props.getNewTransactionsReport(date)
    }

    const handleDownloadCSV = () => {
        csvlink.current.link.click()
    }

    return (
        <>
            <Container>
                <Toolbar>
                    <Typography variant="h6">{t('transactionReport')}</Typography>
                </Toolbar>
            </Container>
            <Box sx={{ mt: 1 }}>
                <Grid container justifyContent="center">
                    <Grid item xs={11} md={10}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} locale={localeMap[props.locale]}>
                            <ThemeProvider theme={{ ...theme, direction: 'ltr' }}>
                                <DateRangePicker
                                    mask={maskMap[props.locale]}
                                    startText={t('from')}
                                    endText={t('to')}
                                    value={date}
                                    onChange={handleDateUpdate}
                                    renderInput={(startProps, endProps) => (
                                        <Grid container className={classes.heading} spacing={1}>
                                            <Grid item xs={12} sm={5} md={3} lg={2}>
                                                <TextField
                                                    {...startProps}
                                                    variant="standard"
                                                    fullWidth
                                                    InputLabelProps={{
                                                        style: {
                                                            left: props.locale === 'arEG' ? 'auto' : 0
                                                        }
                                                    }}
                                                    FormHelperTextProps={{
                                                        style: {
                                                            textAlign: props.locale === 'arEG' ? 'right' : 'left'
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={5} md={3} lg={2}>
                                                <TextField
                                                    {...endProps}
                                                    variant="standard"
                                                    fullWidth
                                                    InputLabelProps={{
                                                        style: {
                                                            left: props.locale === 'arEG' ? 'auto' : 0
                                                        }
                                                    }}
                                                    FormHelperTextProps={{
                                                        style: {
                                                            textAlign: props.locale === 'arEG' ? 'right' : 'left'
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    )}
                                />
                            </ThemeProvider>
                        </LocalizationProvider>
                        <Grid container className={classes.heading} spacing={1}>
                            <Grid item xs={12} sm={5} md={3} lg={2}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    height: '100%'
                                }}
                                >
                                    <Button variant="contained" fullWidth onClick={handleDownloadCSV}>{t('downloadcsv')}</Button>
                                    <CSVLink
                                        data={props.filteredTransactions.length === 0 ? 'No records found' : props.filteredTransactions}
                                        filename={`Book_Transactions_Report_${new Date().toLocaleDateString()}.csv`}
                                        ref={csvlink}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={5} md={3} lg={2}>
                                <TextField
                                    name="type"
                                    fullWidth
                                    variant="standard"
                                    label={t('type')}
                                    select
                                    value={props.filterTransactions.type}
                                    onChange={props.handleTransactionChange}
                                >
                                    <MenuItem value="All">{t('all')}</MenuItem>
                                    <MenuItem value="Reserve">{t('reserve')}</MenuItem>
                                    <MenuItem value="Borrow">{t('borrow')}</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={5} md={3} lg={2}>
                                <TextField
                                    name="status"
                                    fullWidth
                                    variant="standard"
                                    label={t('status')}
                                    select
                                    value={props.filterTransactions.status}
                                    onChange={props.handleTransactionChange}
                                >
                                    <MenuItem value="All">{t('all')}</MenuItem>
                                    <MenuItem value="active">{t('active')}</MenuItem>
                                    <MenuItem value="archive">{t('archived')}</MenuItem>
                                    {props.filterTransactions.type === 'Reserve' && <MenuItem value="expired">{t('expired')}</MenuItem>}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>


            <Box sx={{ mt: 3 }}>
                <Grid container justifyContent="center">
                    <Grid item xs={11} md={10}>
                        <Paper className={classes.paper}>
                            <Table className={classes.table}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('transactionDetails')}</TableCell>
                                        <TableCell>{t('memberid')}</TableCell>
                                        <TableCell>{t('bookDetails')}</TableCell>
                                        <TableCell>{t('reservations')}</TableCell>
                                        <TableCell>{t('borrowDetails')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {props.filteredTransactions.length === 0 &&
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">{t('noRecords')}</TableCell>
                                        </TableRow>
                                    }
                                    {props.filteredTransactions.map(record => (
                                        <TableRow key={record.TransactionID}>
                                            <TableCell>
                                                <Typography variant="caption" display="block">{t('type')}: {record.Transaction}</Typography>
                                                <Typography variant="caption" display="block">{t('id')}: {record.TransactionID}</Typography>
                                                <Typography variant="caption" display="block">{t('date')}: {record.Created}</Typography>
                                                <Typography variant="caption" display="block">{t('status')}: {record.Status}</Typography>
                                            </TableCell>
                                            <TableCell>{record.MemberID}</TableCell>
                                            <TableCell>
                                                <Typography variant="caption" display="block">{t('title')}: {record.BookTitle}</Typography>
                                                <Typography variant="caption" display="block">{t('isbn')}: {record.BookISBN}</Typography>
                                                {record.Transaction === 'Borrow' && <Typography variant="caption" display="block">{t('copyId')}: {record.BookCopyID}</Typography>}
                                            </TableCell>
                                            {record.Transaction === 'Reserve' ?
                                                <TableCell>
                                                    <Typography variant="caption" display="block">{t('expire')}: {record.ReservationExpire}</Typography>
                                                    <Typography variant="caption" display="block">{t('cancel')}: {record.ReservationCancelled === true ? "Yes" : "No"}</Typography>
                                                </TableCell>
                                                :
                                                <TableCell></TableCell>
                                            }
                                            {record.Transaction === 'Borrow' ?
                                                <TableCell>
                                                    <Typography variant="caption" display="block">{t('highDemand')}: {record.HighDemand === true ? "Yes" : "No"}</Typography>
                                                    <Typography variant="caption" display="block">{t('renews')}: {record.Renews}</Typography>
                                                    <Typography variant="caption" display="block">{t('due')}: {record.Due}</Typography>
                                                    <Typography variant="caption" display="block">{t('return')}: {record.Returned === undefined ? "N/A" : record.Returned}</Typography>
                                                </TableCell>
                                                :
                                                <TableCell></TableCell>
                                            }
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    )
}

const useStyles = makeStyles(theme => ({
    table: {
        minWidth: 650,
        overflowX: 'auto'
    },
    title: {
        flex: 1
    },
    paper: {
        overflowX: 'auto'
    },
    heading: {
        justifyContent: 'flex-end',
        [theme.breakpoints.down("sm")]: {
            justifyContent: 'center'
        }
    }
}))

TransactionsReport.propTypes = {
    filteredTransactions: PropTypes.array.isRequired,
    filterTransactions: PropTypes.object.isRequired,
    getNewTransactionsReport: PropTypes.func.isRequired,
    handleTransactionChange: PropTypes.func.isRequired,
    locale: PropTypes.string.isRequired
}

export default TransactionsReport