import { Request, Response } from "express";
import { ServiceCategory } from "../models/serviceCategory";
import { Service } from "../models/service";

// Get all service categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await ServiceCategory.find().sort({ name: 1 });
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    const category = await ServiceCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    return res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    
    // Check if category already exists
    const existingCategory = await ServiceCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    
    const newCategory = new ServiceCategory({
      name,
      description,
      icon,
    });
    
    await newCategory.save();
    
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, description, icon } = req.body;
    
    const category = await ServiceCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Check if name is being changed and if it already exists
    if (name && name !== category.name) {
      const existingCategory = await ServiceCategory.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists" });
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    
    await category.save();
    
    return res.status(200).json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    // Check if category exists
    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Check if any services are using this category
    const servicesUsingCategory = await Service.countDocuments({ categoryId });
    if (servicesUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It is being used by ${servicesUsingCategory} services.` 
      });
    }
    
    await ServiceCategory.findByIdAndDelete(categoryId);
    
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get services by category
export const getServicesByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    // Check if category exists
    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const services = await Service.find({ categoryId })
      .populate("businessId", "name")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services by category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
