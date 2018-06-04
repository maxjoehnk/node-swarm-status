import * as express from 'express';
import * as logger from 'morgan';
import * as Docker from 'dockerode';
import * as debug from 'debug';

const d = debug('swarm-status:app');

const app = express();

const swarm = new Docker();

app.use(logger('dev'));
app.use(express.json());

app.get('/status', try_async(async (req, res, next) => {
    d('fetching containers...');
    const containers = await swarm.listContainers();

    res.json(containers);
    res.status(200);
    res.end();
}));

function try_async(handler: (req, res, next) => Promise<void>) {
    return (req, res, next) => handler(req, res, next)
        .catch(err => next(err));
}

module.exports = app;
