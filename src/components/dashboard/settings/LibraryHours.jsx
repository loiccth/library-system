import React, { useState, useEffect } from 'react'
import axios from 'axios'
import url from '../../../settings/api'
import { useForm, Controller } from 'react-hook-form'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import LocalizationProvider from '@material-ui/lab/LocalizationProvider'
import AdapterDateFns from '@material-ui/lab/AdapterDateFns'
import TimePicker from '@material-ui/lab/TimePicker'
import Snackbar from '@material-ui/core/Snackbar'
import Alert from '@material-ui/core/Alert'

const LibraryHours = ({ hours }) => {
    const classes = useStyles()
    const [snackbar, setSnackbar] = useState({ type: null })
    const [open, setOpen] = useState(false)
    const { register, handleSubmit, control, setValue, getValues, trigger } = useForm()

    useEffect(() => {
        Object.entries(hours).map(([key, value]) => (
            setValue(key, value)
        ))
    }, [hours, setValue])

    const handleClick = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const onSubmit = (data) => {
        axios.put(`${url}/settings/hours`, data, { withCredentials: true })
            .then(result => {
                setSnackbar(result.data.message)
                handleClick()
            })
    }

    return (
        <>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert elevation={6} severity='success' onClose={handleClose}>
                    {snackbar}
                </Alert>
            </Snackbar>
            <form onSubmit={handleSubmit(onSubmit)}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {hours.opening.map((openHrs, index) => (
                        <Grid container key={openHrs.day}>
                            <Grid item>
                                <Controller
                                    render={({ onChange, value }) => (
                                        <TimePicker
                                            label={`${openHrs.day} - Open`}
                                            value={value}
                                            ampm={false}
                                            onChange={onChange}
                                            onClose={trigger}
                                            maxTime={getValues(`closing[${index}].time`)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="normal"
                                                    variant="standard"
                                                    helperText=""
                                                />
                                            )}
                                        />
                                    )}
                                    name={`opening[${index}].time`}
                                    control={control}
                                />
                                <TextField
                                    className={classes.hidden}
                                    name={`opening[${index}].day`}
                                    inputRef={register()}
                                />
                            </Grid>
                            <Grid item>
                                <Controller
                                    render={({ onChange, value }) => (
                                        <TimePicker
                                            label={`${hours.closing[index].day}  - Close`}
                                            value={value}
                                            ampm={false}
                                            onChange={onChange}
                                            onClose={trigger}
                                            minTime={getValues(`opening[${index}].time`)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="normal"
                                                    variant="standard"
                                                    helperText=""
                                                />
                                            )}
                                        />
                                    )}
                                    name={`closing[${index}].time`}
                                    control={control}
                                />
                                <TextField
                                    className={classes.hidden}
                                    name={`closing[${index}].day`}
                                    inputRef={register()}
                                />
                            </Grid>
                        </Grid>
                    ))}
                </LocalizationProvider>
                <Button
                    type="submit"
                    variant="contained"
                >Update</Button>
            </form>
        </>
    )
}

const useStyles = makeStyles(theme => ({
    hidden: {
        display: 'none'
    }
}))

export default LibraryHours