const app_name = 'knightfind.xyz';

export function buildAPIPath(route: string): string {
    if (import.meta.env.MODE != 'development') {
        return 'http://' + app_name + ':4000/' + route;
    }
    else {
        return 'http://localhost:4000/' + route;
    }
}

export function buildPath(route: string): string {
    if (import.meta.env.MODE != 'development') {
        return 'http://' + app_name + ':/' + route;
    }
    else {
        return 'http://localhost:5173/' + route;
    }
}