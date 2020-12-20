import React, { useState, useEffect } from 'react'
import axios from 'axios'
import url from '../../../settings/api'
import { useForm } from 'react-hook-form'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import Alert from '@material-ui/core/Alert'

const BookSettings = ({ bookSettings }) => {
    const classes = useStyles()
    const [snackbar, setSnackbar] = useState({ type: null })
    const [open, setOpen] = useState(false)
    const { register, handleSubmit, errors, setValue } = useForm()

    useEffect(() => {
        Object.entries(bookSettings).map(([key, value]) => (
            setValue(`settings[${key}].value`, value.value)
        ))
    }, [bookSettings, setValue])

    const handleClick = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const onSubmit = (data) => {
        let updated = false

        for (let i = 0; i < bookSettings.length; i++) {
            if (parseInt(bookSettings[i].value) !== parseInt(data.settings[i].value)) {
                updated = true
                break
            }
        }

        if (updated)
            axios.put(`${url}/settings/books`, { bookSettings: data.settings }, { withCredentials: true })
                .then(result => {
                    setSnackbar({
                        type: 'success',
                        msg: result.data.message
                    })
                    handleClick()
                })
        else {
            setSnackbar({
                type: 'warning',
                msg: 'Opening/closing hours did not change.'
            })
            handleClick()
        }
    }

    return (
        <>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert elevation={6} severity={snackbar.type === 'success' ? 'success' : 'warning'} onClose={handleClose}>
                    {snackbar.msg}
                </Alert>
            </Snackbar>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {bookSettings.map((setting, index) => (
                    <React.Fragment key={setting.name}>
                        <TextField
                            label={setting.name}
                            name={`settings[${index}].value`}
                            variant="standard"
                            required
                            margin="normal"
                            error={errors.settings === undefined ? false : errors.settings[index] === undefined ? false : true}
                            inputRef={register({ required: "Field is required.", validate: value => !isNaN(value) })}
                            helperText={errors.settings === undefined ? setting.name === "Time onhold" ? "Time in minutes" : "" :
                                errors.settings[index] === undefined ? setting.name === "Time onhold" ? "Time in minutes" : "" :
                                    errors.settings[index].value.message === "" ? "Value is not a number" :
                                        errors.settings[index].value.message}
                        />
                        <TextField
                            className={classes.hidden}
                            name={`settings[${index}].name`}
                            value={setting.name}
                            inputRef={register()}
                        />
                    </React.Fragment>
                ))}
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


export default BookSettings