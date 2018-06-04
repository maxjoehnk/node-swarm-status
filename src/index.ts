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
    d('fetching services...');
    const services = await swarm.listServices({
        filters: {
            label: [
                'me.maxjoehnk.status'
            ]
        }
    });

    const status = await Promise.all(services.map(async service => {
        const tasks = await swarm.listTasks({
            filters: {
                service: [service.Name]
            }
        });

        return {
            id: service.Id,
            name: service.Name,
            tasks: tasks.map(task => ({
                id: task.Id,
                name: task.Name,
                status: task.Status
            }))
        };
    }));

    res.json(status);
    res.status(200);
    res.end();
}));

function try_async(handler: (req, res, next) => Promise<void>) {
    return (req, res, next) => handler(req, res, next)
        .catch(err => next(err));
}

module.exports = app;
