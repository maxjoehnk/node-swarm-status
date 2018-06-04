import * as Docker from 'dockerode';
import * as debug from 'debug';

const d = debug('swarm-status:status');

const swarm = new Docker();

export enum ServiceState {
    RUNNING,
    PARTIAL,
    ERROR
}

export default async function () {
    d('Fetching services');
    const services = await swarm.listServices({
        filters: {
            label: [
                'me.maxjoehnk.status'
            ]
        }
    });

    d('Fetching tasks');

    return await Promise.all(services.map(async service => {
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
            name: service.Spec.Labels['me.maxjoehnk.status'],
            status,
            up: taskStates.filter(state => state === ServiceState.RUNNING).length,
            tasks: taskStates.length
        };
    }));
}
