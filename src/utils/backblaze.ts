import B2 from "backblaze-b2";
import dotenv from "dotenv";

dotenv.config();

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID!,
  applicationKey: process.env.B2_APP_KEY!,
});

export const uploadToB2 = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  try {
    await b2.authorize();

    const { data: uploadUrlData } = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_NAME!,
    });

    const { data } = await b2.uploadFile({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName,
      data: buffer,
    });

    return `${process.env.B2_BUCKET_URL}/${data.fileName}`;
  } catch (err) {
    console.error("❌ B2 Upload Error:", err);
    throw new Error("Failed to upload to Backblaze B2");
  }
};
