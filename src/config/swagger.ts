import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Khanut API",
      version: "1.0.0",
      description: "API documentation for Khanut Auth System",
    },
    servers: [
      {
        url: "http://localhost:4000",
      },
      {
        url: "https://khanut.onrender.com",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
