import express from 'express';
import cors from 'cors';
import { CONFIG } from '@config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import * as OpenApiValidator from 'express-openapi-validator';
import { errorHandler } from '@middlewares/errorMiddleware';
import { categoryRouter } from 'routes/category.routes';
import { uploadRouter } from '@routes/upload.routes';
import { reportRouter } from '@routes/report.routes';
import {userRouter} from "./routes/user.routes";
import * as dotenv from 'dotenv';

export const app = express();

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}));

// app.use(CONFIG.ROUTES.SWAGGER, swaggerUi.serve, swaggerUi.setup(YAML.load(CONFIG.SWAGGER_FILE_PATH))); // now arises error since the swagger.yaml is empty
// check if JWT_SECRET is an env variable
//dotenv.config();
const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv) {
    console.error("ERROR: JWT_SECRET is not defined as env variable.");
    process.exit(1);
}

// app.use(CONFIG.ROUTES.SWAGGER, swaggerUi.serve, swaggerUi.setup(YAML.load(CONFIG.SWAGGER_V1_FILE_PATH))); // now arises error since the swagger.yaml is empty

// app.use(
//     OpenApiValidator.middleware({
//         apiSpec: CONFIG.SWAGGER_FILE_PATH,
//         validateRequests: true,
//         validateResponses: true,
//     })
// );

app.use(CONFIG.ROUTES.CATEGORIES, categoryRouter);
app.use(CONFIG.ROUTES.UPLOADS, uploadRouter);
app.use(CONFIG.ROUTES.REPORTS, reportRouter);
app.use(CONFIG.ROUTES.CATEGORY, categoryRouter);
app.use(CONFIG.ROUTES.USER, userRouter);

app.use(errorHandler);

const jwtSecret = jwtSecretEnv
export { jwtSecret };