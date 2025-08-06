const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const checkRole = require("../middleware/checkRole.middleware");

// Get a user by id
router.get("/:userId", async (req, res, next) => {
    console.log("GET /user/:userId route hit with userId:", req.params.userId);
    const { userId } = req.params;
  
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "No user found with this id" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  

/*Put a user */
router.put("/:userId", checkRole("admin"), async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await User.findByIdAndUpdate(userId, req.body, { new: true });
    if(response) {
      res.json(response)


    } else {
      res.status(404).json({ message: "No user found with this id"});
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

/* Delete a user */
router.delete("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await User.findByIdAndDelete(userId);
    if(response) {
      res.json({ message: "User deleted successfully"});
    } else {
      res.status(404).json({ message: "No user found with this id"});
    }
  } catch (error) {
    next(error);
  }
});