import {logicalDelete, insert, update} from "./services/mongodb";
import {ACTION_INSERT, ACTION_UPDATE, ACTION_DELETE} from "./config";

export default async function pipeline (event, action) {
    var chart = event.data.element || {};
    const id = event.data.id;
    if (!id) {
        return null;
    }
    chart.isDeleted = action === ACTION_DELETE;

    const now = Date.now();

    switch (action) {
    case ACTION_INSERT:
        chart.createdDate = now;
        await insert(chart, id);
        break;
    case ACTION_UPDATE:
        chart.lastModifiedDate = now;
        await update(chart, id);
        break;
    case ACTION_DELETE:
        await logicalDelete(id);
        break;
    }

    return null;
}
