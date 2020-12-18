import React, { useState, useEffect } from 'react'
import axios from 'axios'
import url from '../../../settings/api'
import DateFnsUtils from '@date-io/date-fns'
import { useForm, Controller } from 'react-hook-form'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import Snackbar from '@material-ui/core/Snackbar'
import Alert from '@material-ui/lab/Alert'
import Grid from '@material-ui/core/Grid'
import FormHelperText from '@material-ui/core/FormHelperText'
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'

const AddBook = (props) => {
    const classes = useStyles()
    const [snackbar, setSnackbar] = useState({ type: null })
    const [open, setOpen] = useState(false)
    const { register, handleSubmit, errors, reset, control, watch, setValue } = useForm({
        defaultValues: {
            noOfCopies: 1,
            campus: 'rhill',
            location: '',
            publishedDate: new Date()
        }
    })

    useEffect(() => {
        setValue('location', '')

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('campus')])

    const handleClick = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const onSubmit = (data) => {
        axios.post(`${url}/books/add_single`, data, { withCredentials: true })
            .then(result => {
                setSnackbar({
                    type: 'success',
                    msg: `Book added - ${result.data.title}`
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
        reset()
    }

    return (
        <>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert elevation={6} severity={snackbar.type === 'success' ? 'success' : 'warning'} onClose={handleClose}>
                    {snackbar.msg}
                </Alert>
            </Snackbar>
            <form className={classes.root} noValidate onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid item md={6}>
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            id="title"
                            name="title"
                            label="Title"
                            inputRef={register()}
                        />
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            required
                            error={!!errors.isbn}
                            id="isbn"
                            name="isbn"
                            label="ISBN"
                            inputRef={register({ required: "Empty ISBN field." })}
                            helperText={!!errors.isbn ? errors.isbn.message : " "}
                        />
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            id="author"
                            name="author"
                            label="Author(s)"
                            inputRef={register()}
                        />
                        <FormHelperText children="Seperate using comma (,)" />
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            id="categories"
                            name="categories"
                            label="Categories"
                            inputRef={register()}
                        />
                        <FormHelperText children="Seperate using comma (,)" />
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            id="publisher"
                            name="publisher"
                            label="Publisher"
                            inputRef={register()}
                        />
                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                            <Controller
                                render={({ onChange, value }) => (
                                    <KeyboardDatePicker
                                        margin="normal"
                                        color="primary"
                                        label="Published Date"
                                        format="dd/MM/yyyy"
                                        disableFuture
                                        fullWidth
                                        value={value}
                                        onChange={onChange}
                                    />
                                )}
                                name="publishedDate"
                                control={control}
                            />
                        </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item md={6}>
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            id="noOfPages"
                            name="noOfPages"
                            label="Number of pages"
                            inputRef={register({ required: "Empty title field.", validate: value => !isNaN(value) })}
                            error={!!errors.noOfPages}
                            helperText={!!errors.noOfPages ? errors.noOfPages.message === "" ? "Value is not a number" : errors.noOfPages.message : " "}
                        />
                        <Controller
                            as={
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    margin="normal"
                                    required
                                    label="Copies"
                                    select
                                >
                                    <MenuItem value="1">1</MenuItem>
                                    <MenuItem value="2">2</MenuItem>
                                    <MenuItem value="3">3</MenuItem>
                                    <MenuItem value="4">4</MenuItem>
                                    <MenuItem value="5">5</MenuItem>
                                </TextField>
                            }
                            name="noOfCopies"
                            control={control}
                        />
                        <Controller
                            as={
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    margin="normal"
                                    required
                                    label="Campus"
                                    select
                                >
                                    <MenuItem value="rhill">Rose-Hill Campus</MenuItem>
                                    <MenuItem value="pam">Swami Dayanand Campus</MenuItem>
                                </TextField>
                            }
                            name="campus"
                            control={control}
                        />
                        <Controller
                            as={
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    margin="normal"
                                    required
                                    error={!!errors.location}
                                    label="Location"
                                    select
                                    helperText={!!errors.location ? errors.location.message : " "}
                                >
                                    {watch('campus') === 'rhill' ?
                                        props.locations.rhill.options.map(location => (
                                            <MenuItem key={location} value={location}>{location}</MenuItem>
                                        ))
                                        :
                                        props.locations.pam.options.map(location => (
                                            <MenuItem key={location} value={location}>{location}</MenuItem>
                                        ))
                                    }
                                </TextField>
                            }
                            name="location"
                            control={control}
                            rules={{ required: "Location is required." }}
                        />
                        <TextField
                            fullWidth
                            variant="standard"
                            margin="normal"
                            id="description"
                            name="description"
                            label="Description"
                            multiline
                            rows={5}
                            inputRef={register()}
                        />
                    </Grid>
                </Grid>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                >Add Book</Button>
            </form>
        </>
    )
}

const useStyles = makeStyles(theme => ({
}))

export default AddBook