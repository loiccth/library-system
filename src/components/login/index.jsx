import React from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Box, Grid, Hidden, makeStyles } from '@material-ui/core'
import Navbar from '../navbar/Navbar'
import Login from './Login'
import Reset from './Reset'

const LoginPage = (props) => {
    const classes = useStyles()
    const navigate = useNavigate()

    // If user is already logged in, redirect to their dashboard on login page load
    if (props.user.isLoggedIn) {
        navigate('/dashboard', { replace: true })
    }

    return (
        <React.Fragment>
            <Navbar user={props.user} darkMode={props.darkMode} handleToggleTheme={props.handleToggleTheme} handleLocale={props.handleLocale} handleLogout={props.handleLogout} />
            <div className={classes.container}>
                <Grid container spacing={0}>
                    <Grid item xs={12} md={6}>
                        <Login handleLogin={props.handleLogin} />
                    </Grid>
                    <Hidden mdUp>
                        <Grid item xs={12}>
                            <Box sx={{ my: 3 }} />
                        </Grid>
                    </Hidden>
                    <Grid item xs={12} md={6}>
                        <Reset darkMode={props.darkMode} />
                    </Grid>
                </Grid>
            </div>
        </React.Fragment>
    )
}

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        justifyContent: 'center',
        margin: 'auto',
        maxWidth: '1280px',
        minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
        [theme.breakpoints.up("sm")]: {
            minHeight: `calc(100vh - 64px)`
        },
        [theme.breakpoints.down("xs")]: {
            minHeight: `calc(100vh - 48px)`
        },
        alignItems: 'center'
    }
}))

LoginPage.propTypes = {
    user: PropTypes.object.isRequired,
    darkMode: PropTypes.bool.isRequired,
    handleToggleTheme: PropTypes.func.isRequired,
    handleLocale: PropTypes.func.isRequired,
    handleLogin: PropTypes.func.isRequired,
    handleLogout: PropTypes.func.isRequired
}

export default LoginPage