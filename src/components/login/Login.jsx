import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import url from '../../settings/api'
import { analytics } from '../../functions/analytics'
import {
    Alert,
    Button,
    Checkbox,
    Container,
    FormControlLabel,
    makeStyles,
    Paper,
    Snackbar,
    TextField,
    Typography
} from '@material-ui/core'

const Login = (props) => {
    const { register, handleSubmit, errors, reset } = useForm()
    const [snackbar, setSnackbar] = useState()
    const [open, setOpen] = useState(false)
    const { t } = useTranslation()

    // Open snackbar feedback
    const handleClick = () => {
        setOpen(true);
    }

    // Close snackbar feedback
    const handleClose = () => {
        setOpen(false);
    }

    // Login button pressed send userid and password to server
    const onSubmit = (data) => {
        axios.post(`${url}/users/login`, data, { withCredentials: true })
            .then(result => {
                props.handleLogin(result.data)
            })
            .catch(err => {
                // Incorrct credentials
                analytics('action', `login attempt failed - memberid: ${data.userid}`)
                setSnackbar(t(err.response.data.error))
                handleClick()
            })
        reset()
    }

    const classes = useStyles()

    return (
        <React.Fragment>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert elevation={6} severity="warning" onClose={handleClose}>
                    {snackbar}
                </Alert>
            </Snackbar>

            <Container component="div" maxWidth="sm">
                <Paper className={classes.paper}>
                    <Typography component="h1" variant="h5">
                        {t('login')}
                    </Typography>
                    <form className={classes.form} noValidate onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            variant="standard"
                            margin="normal"
                            required
                            fullWidth
                            error={!!errors.userid}
                            id="userid"
                            name="userid"
                            label={t('memberid')}
                            autoFocus
                            inputRef={register({ required: t('requiredField') })}
                            helperText={!!errors.userid ? errors.userid.message : " "}
                        />
                        <TextField
                            type="password"
                            variant="standard"
                            margin="normal"
                            required
                            fullWidth
                            error={!!errors.password}
                            id="password"
                            name="password"
                            label={t('password')}
                            inputRef={register({ required: t('requiredField') })}
                            helperText={!!errors.password ? errors.password.message : " "}
                        />
                        <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label={t('rememberMe')}
                        />
                        <Button
                            className={classes.button}
                            type="submit"
                            variant="contained"
                            fullWidth
                        >{t('login')}</Button>
                    </form>
                </Paper>
            </Container>
        </React.Fragment>
    )
}

const useStyles = makeStyles(theme => ({
    paper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
    },
    form: {
        width: '100%',
        padding: theme.spacing(3),
    },
    button: {
        marginTop: theme.spacing(2),
    }
}))

Login.propTypes = {
    handleLogin: PropTypes.func.isRequired
}

export default Login