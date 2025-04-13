import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.B2_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024, fieldSize: 1024 * 1024 * 1024 },
});
