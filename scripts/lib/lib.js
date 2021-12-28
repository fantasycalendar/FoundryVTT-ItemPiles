import CONSTANTS from "../constants.js";

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function debug(msg, args = "") {
    if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) console.log(`DEBUG | Item Piles | ${msg}`, args)
}

export function custom_notify(message, notify = true) {
    message = `Item Piles | ${message}`;
    if (notify) ui.notifications.notify(message);
    console.log(message.replace("<br>", "\n"));
}

export function custom_warning(warning, notify = false) {
    warning = `Item Piles | ${warning}`;
    if (notify) ui.notifications.warn(warning);
    console.warn(warning.replace("<br>", "\n"));
}

export function custom_error(error, notify = true) {
    error = `Item Piles | ${error}`;
    if (notify) ui.notifications.error(error);
    return new Error(error.replace("<br>", "\n"));
}

export function getTokensAtLocation(position){
    return canvas.tokens.placeables.filter(token => {
        return position.x >= token.x && position.x < (token.x + (token.data.width * canvas.grid.size))
            && position.y >= token.y && position.y < (token.y + (token.data.height * canvas.grid.size));
    });
}

export function distance_between_rect(p1, p2){

    const x1 = p1.x;
    const y1 = p1.y;
    const x1b = p1.x + p1.w;
    const y1b = p1.y + p1.h;

    const x2 = p2.x;
    const y2 = p2.y;
    const x2b = p2.x + p2.w;
    const y2b = p2.y + p2.h;

    const left = x2b < x1;
    const right = x1b < x2;
    const bottom = y2b < y1;
    const top = y1b < y2;

    if(top && left) {
        return distance_between({ x: x1, y: y1b }, { x: x2b, y: y2 });
    } else if(left && bottom) {
        return distance_between({ x: x1, y: y1 }, { x: x2b, y: y2b });
    } else if(bottom && right) {
        return distance_between({ x: x1b, y: y1 }, { x: x2, y: y2b });
    } else if(right && top) {
        return distance_between({ x: x1b, y: y1b }, { x: x2, y: y2 });
    } else if(left) {
        return x1 - x2b;
    } else if(right) {
        return x2 - x1b;
    } else if(bottom) {
        return y1 - y2b;
    } else if(top) {
        return y2 - y1b;
    }

    return 0;

}

export function distance_between(a, b){
    return new Ray(a, b).distance;
}

export function object_has_event(object, eventName, func){

    if(!object?._events?.[eventName]) return false;

    let events = object?._events?.[eventName];
    if(!Array.isArray(events)) events = [events];
    for(let event of events){
        if(event.context === object && event.fn.toString() === func.toString()){
            return true;
        }
    }

    return false;
}