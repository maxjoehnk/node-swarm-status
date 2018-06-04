import * as express from 'express';
import * as logger from 'morgan';
import * as Docker from 'dockerode';
import * as debug from 'debug';
import { Service } from 'dockerode';

const d = debug('swarm-status:app');

const app = express();

const swarm = new Docker();

enum ServiceState {
    RUNNING,
    PARTIAL,
    ERROR
}

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
                service: [service.Spec.Name],
                'desired-state': ['running']
            }
        });

        const taskStates = tasks
            .map(task => ({
                state: task.Status.State,
                desired: task.DesiredState
            }))
            .map(({ state, desired }) => state === desired ? ServiceState.RUNNING : ServiceState.ERROR);

        const running = taskStates.every(state => state === ServiceState.RUNNING);
        const error = taskStates.every(state => state === ServiceState.ERROR);

        const status = running ? ServiceState.RUNNING : error ? ServiceState.ERROR : ServiceState.PARTIAL;

        return {
            name: service.Spec.Name,
            displayName: service.Spec.Labels['me.maxjoehnk.status'],
            status,
            up: taskStates.filter(state => state === ServiceState.RUNNING).length,
            tasks: taskStates.length
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
