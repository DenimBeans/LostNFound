const app_name = '174.138.65.216';

export function buildPath(route: string): string {
    if (import.meta.env.MODE != 'development') {
        return 'http://' + app_name + ':4000/' + route;
    }
    else {
        return 'http://localhost:4000/' + route;
    }
}

export default buildPath;