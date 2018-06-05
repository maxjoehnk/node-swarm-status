import * as express from 'express';
import * as logger from 'morgan';
import getStatus, { ServiceState } from './status';
import { create } from 'express-handlebars';
import * as createError from 'http-errors';
import { join } from 'path';
import * as helpers from 'handlebars-helpers';

const app = express();

const handlebars = create({
    helpers: {
        ...helpers(),
        statusClass: (state: ServiceState) => {
            switch (state) {
                case ServiceState.RUNNING:
                    return 'running';
                case ServiceState.PENDING:
                    return 'pending';
                case ServiceState.PARTIAL:
                    return 'partial';
                case ServiceState.ERROR:
                    return 'error';
            }
        }
    },
    defaultLayout: 'main',
    extname: 'hbs'
});

app.locals.styles = ['styles.css'];

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

app.get('/', try_async(async(req, res) => {
    const status = await getStatus();
    res.render('index', {
        status,
        title: 'maxjoehnk.me - Service Status',
        scripts: ['script.js']
    });
}));

app.get('/status', try_async(async(req, res) => {
    const status = await getStatus();
    res.render('index', {
        status,
        layout: false
    });
}));

app.get('/api/status', try_async(async (req, res) => {
    const status = await getStatus();

    res.json(status);
    res.status(200);
    res.end();
}));

app.use((req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        title: err.message,
        message: err.message,
        error: req.app.get('env') === 'development' ? err : {}
    });
});

function try_async(handler: (req, res, next) => Promise<void>) {
    return (req, res, next) => handler(req, res, next)
        .catch(err => next(err));
}

module.exports = app;
