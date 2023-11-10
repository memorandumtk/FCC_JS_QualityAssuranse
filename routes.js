const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {

    app.route('/').get((req, res) => {
        // Change the response, to render the Pug template
        console.log("this is req.session >> ", req.session);
        res.render('index', {
            showLogin: true,
            showRegistration: true,
            showSocialAuth: true,
            title: 'Connected to Database',
            message: 'Please login'
        });
    });

    app.route('/login').post(
        passport.authenticate('local',
            {
                failureRedirect: '/',
                failureMessage: true
            }),
        (req, res) => {
            console.log("this is a req.user >> ");
            console.log(req.user);
            console.log(req.session);
            // console.log("this is a req.user >> " + req.user.username);
            res.redirect('/profile')
        })

    app.route('/auth/github').get(
        passport.authenticate('github'));
    app.route('/auth/github/callback').get(
        passport.authenticate('github',
            {
                failureRedirect: '/',
                failureMessage: true
            }),
        (req, res) => {
            req.session.user_id = req.user.id;
            console.log("this is a req.user >> " + req.user.username);
            res.redirect('/chat')
        })

    app.route('/register')
        .post((req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12);
            myDataBase.findOne(
                { username: req.body.username },
                (err, user) => {
                    if (err) {
                        next(err);
                    } else if (user) {
                        res.redirect('/');
                    } else {
                        myDataBase.insertOne({
                            username: req.body.username,
                            password: hash
                            // password: req.body.password
                        },
                            (err, doc) => {
                                if (err) {
                                    res.redirect('/');
                                } else {
                                    // The inserted document is held within
                                    // the ops property of the doc
                                    next(null, doc.ops[0]);
                                }
                            }
                        )
                    }
                })
        },
            passport.authenticate('local',
                {
                    failureRedirect: '/'
                }),
            (req, res, next) => {
                console.log('this is a success auth to "register"')
                res.redirect('/profile');
            }
        );

    const ensureAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            console.log("this is the result of req.isAuthenticated >> " + req.isAuthenticated())
            return next();
        }
        res.redirect('/');
    };

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render('profile', {
            username: req.user.username
        })
    });

    app.route('/chat').get(ensureAuthenticated, (req, res) => {
        res.render('chat', {
            user: req.user
        })
    });

    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    });

    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}