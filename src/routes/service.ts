import { Router } from "express";
import {
  getAllServices,
  getBusinessServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByType,
} from "../controllers/serviceController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { upload } from "../middleware/upload";

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [appointment, product, uniform]
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of services
 */
router.get("/", getAllServices);

/**
 * @swagger
 * /api/services/business/{businessId}:
 *   get:
 *     summary: Get all services for a business
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [appointment, product, uniform]
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of services for the business
 *       404:
 *         description: Business not found
 */
router.get("/business/:businessId", getBusinessServices);

/**
 * @swagger
 * /api/services/{serviceId}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 */
router.get("/:serviceId", getServiceById);

/**
 * @swagger
 * /api/services/business/{businessId}/type/{type}:
 *   get:
 *     summary: Get services by type for a business
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [appointment, product, uniform]
 *         description: Service type
 *     responses:
 *       200:
 *         description: List of services of the specified type for the business
 *       404:
 *         description: Business not found
 */
router.get("/business/:businessId/type/:type", getServicesByType);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - type
 *               - businessId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [appointment, product, uniform]
 *               businessId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               duration:
 *                 type: number
 *                 description: Required for appointment type services (in minutes)
 *               availability:
 *                 type: object
 *                 description: Required for appointment type services
 *               stock:
 *                 type: number
 *                 description: Required for product type services
 *               location:
 *                 type: string
 *                 description: Required for uniform type services
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a business owner)
 */
router.post(
  "/",
  protect(["business"]),
  isBusiness,
  upload.array("images", 5),
  createService
);

/**
 * @swagger
 * /api/services/{serviceId}:
 *   put:
 *     summary: Update a service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               duration:
 *                 type: number
 *                 description: For appointment type services (in minutes)
 *               availability:
 *                 type: object
 *                 description: For appointment type services
 *               stock:
 *                 type: number
 *                 description: For product type services
 *               location:
 *                 type: string
 *                 description: For uniform type services
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner of this service)
 *       404:
 *         description: Service not found
 */
router.put(
  "/:serviceId",
  protect(["business"]),
  isBusiness,
  upload.array("images", 5),
  updateService
);

/**
 * @swagger
 * /api/services/{serviceId}:
 *   delete:
 *     summary: Delete a service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner of this service)
 *       404:
 *         description: Service not found
 */
router.delete("/:serviceId", protect(["business"]), isBusiness, deleteService);

export default router;
