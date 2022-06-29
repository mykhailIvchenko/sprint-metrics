import {storage} from "@forge/api";
import {Metric} from "./metric";

function acronymKey(acronym) {
    return `acronym-${acronym}`;
}

export const getComments = async (acronym) => {
    // Fetch a definition from the Storage API
    //await storage.delete(acronymKey(acronym));
    const value = await storage.get(acronymKey(acronym));

    return value? value : new Metric() ;
}

export const saveComments = async (acronym, comments) => {
    return await storage.set(acronymKey(acronym), comments);
}

export const removeCommentsByKeys = async (keySequence, metric) =>  {
    let keys = keySequence.split(",");
    keys.forEach(key => metric[key]? metric[key].definition = "" : metric[key] = metric[key]);
};

