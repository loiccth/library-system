import React, { useState } from 'react'
import { Link, Outlet, Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import i18n from '../../translations/i18n'
import axios from 'axios'
import url from '../../settings/api'
import { analytics } from '../../functions/analytics'
import {
    AppBar,
    Drawer,
    Hidden,
    IconButton,
    List,
    ListItem,
    ListItemText,
    makeStyles,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    useTheme
} from '@material-ui/core'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'
import Brightness3Icon from '@material-ui/icons/Brightness3'
import BrightnessHighIcon from '@material-ui/icons/BrightnessHigh'
import HomeIcon from '@material-ui/icons/Home'
import MenuIcon from '@material-ui/icons/Menu'
import TranslateIcon from '@material-ui/icons/Translate'
import logo from '../../img/logo.png'
import whitelogo from '../../img/logo_white.png'

const drawerWidth = 240

const Dashboard = (props) => {
    const { window } = props
    const classes = useStyles()
    const theme = useTheme()
    const [mobileOpen, setMobileOpen] = useState(false)
    const { t } = useTranslation()

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen)
    }

    // Open user menu
    const [anchorEl, setAnchorEl] = useState(null)
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget)
    }

    // Close user menu
    const handleClose = () => {
        setAnchorEl(null)
    }

    const [anchorE2, setAnchorE2] = useState(null)
    // Open language menu
    const handleLanguage = (event) => {
        setAnchorE2(event.currentTarget)
    }

    // Close language menu
    const handleCloseLanguage = () => {
        setAnchorE2(null)
    }

    // Set locale when languauge is changed
    const handleMenuItemClick = (lang) => {
        let temp = ''
        if (lang === 'en')
            temp = 'enUS'
        else if (lang === 'fr')
            temp = 'frFR'
        else if (lang === 'zh')
            temp = 'zhCN'
        else if (lang === 'ar')
            temp = 'arEG'

        // Close language menu
        setAnchorE2(null)
        // Change language
        i18n.changeLanguage(lang)
        // Change locale
        props.handleLocale(temp)
    }

    // List of sidebar links
    const [sidebar] = useState([
        {
            sidebarMenu: 'dashboard',
            link: '/dashboard'
        },
        {
            sidebarMenu: 'manageBooks',
            link: '/dashboard/managebooks',
            permission: 'Librarian'
        },
        {
            sidebarMenu: 'settings',
            link: '/dashboard/settings',
            permission: 'Librarian'
        },
        {
            sidebarMenu: 'manageMemberships',
            link: '/dashboard/managememberships',
            permission: 'Admin'
        },
        {
            sidebarMenu: 'reports',
            link: '/dashboard/reports',
            permission: 'Librarian'
        },
        {
            sidebarMenu: 'reports',
            link: '/dashboard/reports',
            permission: 'Admin'
        },
        {
            sidebarMenu: 'myBooks',
            link: '/dashboard/mybooks',
            permission: 'staff'
        },
        {
            sidebarMenu: 'profile',
            link: '/dashboard/profile'
        }
    ])

    // Logout button click, send logout request
    const handleLogout = () => {
        analytics('action', 'logout success')
        axios.get(`${url}/users/logout`, { withCredentials: true })
            .then(result => {
                props.handleLogout(result.data.message)
            })
    }

    // Redirect to login if not logged in
    if (!props.user.isLoggedIn) {
        return <Navigate to='/login' />
    }
    else {
        const drawer = (
            <div>
                <List>
                    {sidebar.map(item => {
                        if (item.permission === props.user.memberType || item.permission === undefined)
                            return (
                                <ListItem button key={item.sidebarMenu} component={Link} to={item.link}>
                                    <ListItemText primary={t(item.sidebarMenu)} />
                                </ListItem>
                            )
                        else if (item.permission === 'staff' && (props.user.memberType === 'Librarian' || props.user.memberType === 'Admin'))
                            return (
                                <ListItem button key={item.sidebarMenu} component={Link} to={item.link}>
                                    <ListItemText primary={t(item.sidebarMenu)} />
                                </ListItem>
                            )
                        else return null
                    })}
                </List>
            </div>
        )

        const container =
            window !== undefined ? () => window().document.body : undefined

        return (
            <div>
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            className={classes.menuButton}
                        >
                            <MenuIcon />
                        </IconButton>
                        <div className={classes.title}>
                            <Hidden smDown>
                                <Link to='/'>
                                    <img src={props.darkMode ? whitelogo : logo} alt="udmlogo" style={{ maxHeight: '50px', maxWidth: 'auto' }} />
                                    <img src={props.darkMode ? logo : whitelogo} alt="udmlogo" style={{ display: 'none' }} />
                                </Link>
                            </Hidden>
                        </div>
                        <Tooltip title={t('toggleDarkMode')} arrow>
                            {props.darkMode ?
                                <IconButton
                                    color="inherit"
                                    onClick={() => props.handleToggleTheme()}
                                >
                                    <BrightnessHighIcon />
                                </IconButton>
                                :
                                <IconButton
                                    color="inherit"
                                    onClick={() => props.handleToggleTheme()}
                                >
                                    <Brightness3Icon />
                                </IconButton>
                            }
                        </Tooltip>
                        <Tooltip title={t('changeLanguage')} arrow>
                            <IconButton
                                onClick={handleLanguage}
                                color="inherit"
                            >
                                <TranslateIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-language"
                            anchorEl={anchorE2}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorE2)}
                            onClose={handleCloseLanguage}
                        >
                            <MenuItem
                                onClick={(() => handleMenuItemClick('en'))}
                            >
                                English
                            </MenuItem>
                            <MenuItem
                                onClick={(() => handleMenuItemClick('fr'))}
                            >
                                Français
                            </MenuItem>
                            <MenuItem
                                onClick={(() => handleMenuItemClick('zh'))}
                            >
                                中文
                            </MenuItem>
                            <MenuItem
                                onClick={(() => handleMenuItemClick('ar'))}
                            >
                                عربي
                        </MenuItem>
                        </Menu>
                        <Tooltip title={t('home')} arrow>
                            <IconButton
                                color="inherit"
                                component={Link}
                                to="/"
                            >
                                <HomeIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('userMenu')} arrow>
                            <IconButton
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <AccountCircleIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem component={Link} to="/dashboard" color="inherit">{t('dashboard')}</MenuItem>
                            <MenuItem color="inherit" onClick={handleLogout}>{t('logout')}</MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
                <nav className={classes.drawer} >
                    <Hidden lgUp implementation="css">
                        <Drawer
                            container={container}
                            variant="temporary"
                            anchor={theme.direction === "rtl" ? "right" : "left"}
                            open={mobileOpen}
                            onClose={handleDrawerToggle}
                            classes={{
                                paper: classes.drawerPaper
                            }}
                            ModalProps={{
                                keepMounted: true
                            }}
                        >
                            {drawer}
                        </Drawer>
                    </Hidden>
                    <Hidden lgDown implementation="css">
                        <Drawer
                            classes={{
                                paper: classes.drawerPaper
                            }}
                            variant="permanent"
                            open
                        >
                            {drawer}
                        </Drawer>
                    </Hidden>
                </nav>
                <main className={classes.content}>
                    <div className={classes.toolbar} />
                    <Outlet />
                </main>
            </div>
        )
    }
}

const useStyles = makeStyles(theme => ({
    drawer: {
        [theme.breakpoints.up("lg")]: {
            width: drawerWidth,
            flexShrink: 0
        }
    },
    appBar: {
        backgroundColor: theme.palette.custom.main,
        color: theme.palette.custom.contrastText,
        [theme.breakpoints.up("lg")]: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth
        }
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up("lg")]: {
            display: "none"
        }
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth
    },
    content: {
        [theme.breakpoints.up("lg")]: {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`
        }
    },

    title: {
        flexGrow: 1
    }
}))

Dashboard.propTypes = {
    window: PropTypes.func,
    user: PropTypes.object.isRequired,
    darkMode: PropTypes.bool.isRequired,
    handleToggleTheme: PropTypes.func.isRequired,
    handleLocale: PropTypes.func.isRequired,
    handleLogout: PropTypes.func.isRequired
}

export default Dashboard