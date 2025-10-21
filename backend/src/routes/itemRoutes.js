import { Router } from "express";
import {
  createItem,
  listItems,
  getItem,
  claimItem,
  markReturned,
  deleteItem
} from "../controllers/itemController.js";

const router = Router();

router.get("/", listItems);
router.post("/", createItem);
router.get("/:id", getItem);
router.patch("/:id/claim", claimItem);
router.patch("/:id/return", markReturned);
router.delete("/:id", deleteItem);

export default router;