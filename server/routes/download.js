import express from "express";
import { checkDownloadLimit, recordDownload, getUserDownloads } from "../controllers/download.js";

const routes = express.Router();
routes.get("/check/:userId", checkDownloadLimit);
routes.post("/record", recordDownload);
routes.get("/user/:userId", getUserDownloads);
export default routes;
