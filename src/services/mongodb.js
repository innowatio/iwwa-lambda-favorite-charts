import {MongoClient} from "mongodb";

import {
    MONGODB_URL,
    CHARTS_COLLECTION_NAME
} from "../config";

export default MongoClient.connect(MONGODB_URL);

export async function insert (chart, id) {
    const db = await MongoClient.connect(MONGODB_URL);
    chart._id = id;
    return db.collection(CHARTS_COLLECTION_NAME).insert(
        chart
    );
}

export async function update (chart, id) {
    const db = await MongoClient.connect(MONGODB_URL);
    return db.collection(CHARTS_COLLECTION_NAME).update(
        {_id: id},
        {$set: chart}
    );
}

export async function logicalDelete (id) {
    const db = await MongoClient.connect(MONGODB_URL);
    return db.collection(CHARTS_COLLECTION_NAME).update(
        {_id: id},
        {$set: {isDeleted: true}}
    );
}
