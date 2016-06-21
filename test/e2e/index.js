import {expect} from "chai";
import {merge} from "ramda";
import * as sinon from "sinon";

import {handler} from "index";
import mongodb from "services/mongodb";
import {run, getEventFromObject} from "../mocks";
import {CHARTS_COLLECTION_NAME} from "config";

const aChart = {
    name: "Grafico preferito",
    type: "monitoring",
    owner: "userId",
    state: {
        firstAttr: "value",
        secondAttr: ["value1", "value2"],
        thirdAttr: {
            attr: "value"
        }
    }
};

describe("On favorite chart", () => {

    var db;
    var chartsCollection;
    var clock;
    const now = new Date("2016-06-21").getTime();

    before(async () => {
        db = await mongodb;
        chartsCollection = db.collection(CHARTS_COLLECTION_NAME);
    });

    after(async () => {
        await db.dropCollection(CHARTS_COLLECTION_NAME);
        await db.close();
    });

    beforeEach(() => {
        clock = sinon.useFakeTimers(now);
    });

    afterEach(async () => {
        await chartsCollection.remove({});
        clock.restore();
    });

    it("perform INSERT", async () => {
        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: aChart,
                id: "123456"
            },
            type: "element inserted in collection favorite-charts"
        });
        const expected = {
            _id: "123456",
            isDeleted: false,
            createdDate: now,
            ...aChart
        };

        await run(handler, event);
        const result = await chartsCollection.findOne({_id: "123456"});
        expect(result).to.deep.equal(expected);
    });

    it("perform UPDATE", async () => {
        chartsCollection.insert(merge(aChart, {_id: "123456"}));

        const eventSensor = merge(aChart, {
            name: "Grafico preferito modificato",
            state: {
                secondAttr: ["value1", "value3"]
            }
        });
        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: eventSensor,
                id: "123456"
            },
            type: "element replaced in collection favorite-charts"
        });
        const expected = {
            _id: "123456",
            isDeleted: false,
            lastModifiedDate: now,
            ...aChart,
            name: "Grafico preferito modificato",
            state: {
                secondAttr: ["value1", "value3"]
            }
        };

        await run(handler, event);
        const result = await chartsCollection.findOne({_id: "123456"});
        expect(result).to.deep.equal(expected);
    });

    it("perform logical DELETE", async () => {
        chartsCollection.insert(merge(aChart, {_id: "123456", isDeleted: false}));

        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: undefined,
                id: "123456"
            },
            type: "element removed in collection favorite-charts"
        });
        const expected = merge(aChart, {
            _id: "123456",
            isDeleted: true
        });

        await run(handler, event);
        const result = await chartsCollection.findOne({_id: "123456"});
        expect(result).to.deep.equal(expected);
    });

    it("INSERT, UPDATE, UPDATE & DELETE", async () => {
        const tick = 10000;
        const eventInsert = getEventFromObject({
            id: "eventId",
            data: {
                element: aChart,
                id: "123456"
            },
            type: "element inserted in collection favorite-charts"
        });
        const eventUpdate1 = getEventFromObject({
            id: "eventId",
            data: {
                element: {
                    ...aChart,
                    name: "Grafico ultra preferito"
                },
                id: "123456"
            },
            type: "element replaced in collection favorite-charts"
        });
        const eventUpdate2 = getEventFromObject({
            id: "eventId",
            data: {
                element: {
                    ...aChart,
                    name: "Grafico mega preferito"
                },
                id: "123456"
            },
            type: "element replaced in collection favorite-charts"
        });
        const eventDelete = getEventFromObject({
            id: "eventId",
            data: {
                element: undefined,
                id: "123456"
            },
            type: "element removed in collection favorite-charts"
        });

        const expectedInsert = {
            _id: "123456",
            isDeleted: false,
            createdDate: Date.now(),
            ...aChart
        };

        const expectedUpdate1 = {
            ...expectedInsert,
            lastModifiedDate: Date.now() + tick,
            name: "Grafico ultra preferito"
        };

        const expectedUpdate2 = {
            ...expectedInsert,
            lastModifiedDate: Date.now() + (2 * tick),
            name: "Grafico mega preferito"
        };

        const expectedDelete = {
            ...expectedUpdate2,
            isDeleted: true
        };

        await run(handler, eventInsert);
        const resultInsert = await chartsCollection.findOne({_id: "123456"});
        expect(resultInsert).to.deep.equal(expectedInsert);

        clock.tick(tick);
        await run(handler, eventUpdate1);
        const resultUpdate1 = await chartsCollection.findOne({_id: "123456"});
        expect(resultUpdate1).to.deep.equal(expectedUpdate1);

        clock.tick(tick);
        await run(handler, eventUpdate2);
        const resultUpdate2 = await chartsCollection.findOne({_id: "123456"});
        expect(resultUpdate2).to.deep.equal(expectedUpdate2);

        clock.tick(tick);
        await run(handler, eventDelete);
        const resultDelete = await chartsCollection.findOne({_id: "123456"});
        expect(resultDelete).to.deep.equal(expectedDelete);
    });
});
