const Role = require("../models/roleModel");

exports.addRole = async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }
      const newRole = new Role({ name });
      await newRole.save();
      res.status(201).json({ message: "Role added successfully", role: newRole });
    } catch (error) {
      res.status(500).json({ message: "Error adding role", error: error.message });
    }
  };
  

  exports.deleteRole = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRole = await Role.findByIdAndDelete(id);
      if (!deletedRole) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.status(200).json({ message: "Role deleted successfully", role: deletedRole });
    } catch (error) {
      res.status(500).json({ message: "Error deleting role", error: error.message });
    }
  };