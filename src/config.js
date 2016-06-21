import dotenv from "dotenv";

dotenv.load();

export const MONGODB_URL = process.env.MONGODB_URL;
export const CHARTS_COLLECTION_NAME = "favorite-charts";
export const ACTION_INSERT = "insert";
export const ACTION_UPDATE = "update";
export const ACTION_DELETE = "delete";
