import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductByCategory,
  getProductBySlug,
  updateProduct,
  reorderProduct,
  toggleProductPriority,
} from "../controllers/products-controller";
import { authenticateJWT } from "../middleware/authMiddleware";
import { authorizeRole } from "../middleware/authorizeRole";
import upload from "../config/multer";

const router: Router = Router();

router.get("/:slug", getProductBySlug);
router.get("/", getAllProducts);
router.post("/", authenticateJWT, authorizeRole("admin"), upload.array("images"), createProduct);
router.post("/getProducts", getProductByCategory);
router.post("/reorder", authenticateJWT, authorizeRole("admin"), reorderProduct);
router.post("/priority", authenticateJWT, authorizeRole("admin"), toggleProductPriority);
router.put("/", authenticateJWT, authorizeRole("admin"), upload.array("images"), updateProduct);
router.delete("/:slug", authenticateJWT, authorizeRole("admin"), deleteProduct);

export default router;
